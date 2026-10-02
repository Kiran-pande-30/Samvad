import type { SupabaseClient } from '@supabase/supabase-js'
import type { StepAudio } from '@/lib/types'
import { NotFoundError } from './errors'

// Voice used for every clip in the `audio` bucket (see scripts/generate-audio.ts).
export const AUDIO_MODEL = 'bulbul:v3'
export const AUDIO_SPEAKER = 'ishita'
export const AUDIO_BUCKET = 'audio'

// "मी राज आहे." and "मी राज आहे" share one clip. "?" and "!" are kept because
// they change the intonation.
export const normalizeAudioText = (text: string) =>
  text.trim().replace(/\s+/g, ' ').replace(/[.।]+$/, '').trim()

// Arrange answers come from word tiles, so they lack punctuation: "तू कोण आहेस"
// should reuse the "तू कोण आहेस?" clip (right intonation, no extra cost).
export const audioLookupKeys = (text: string) => (/[?!]$/.test(text) ? [text] : [text, `${text}?`])

interface AudioSourceStep {
  step_type: string
  prompt: string | null
  data: Record<string, unknown> | null
  correct_answer: string | null
}

// Devanagari with no Latin letters, i.e. text worth voicing as Marathi.
const isMarathi = (text: string | null): text is string =>
  !!text && /[\u0900-\u097F]/.test(text) && !/[A-Za-z]/.test(text)

// The Marathi a step can play. Wrong options are never voiced.
//   prompt  — a Marathi prompt to understand (match): playable any time
//   speaker — what the other person says (conversation): playable any time
//   answer  — the full correct Marathi sentence: played only after Check
export const stepAudioTexts = ({ step_type, prompt, data, correct_answer }: AudioSourceStep) => {
  const sentence = typeof data?.sentence === 'string' ? data.sentence : null
  const speakerSays = typeof data?.speaker_says === 'string' ? data.speaker_says : null

  let promptText: string | null = null
  let speaker: string | null = null
  let answer: string | null = null

  switch (step_type) {
    case 'fill_blank':
      if (sentence && correct_answer) answer = sentence.replace('___', correct_answer)
      break
    case 'conversation':
      speaker = speakerSays
      answer = correct_answer
      break
    case 'arrange':
    case 'recall':
      answer = correct_answer
      break
    case 'match': {
      // Either "तू कोण आहेस?" → "Who are you?", or an English prompt with
      // answers shaped like "नमस्ते / Hello".
      if (isMarathi(prompt)) promptText = prompt
      const marathiPart = correct_answer?.split(' / ')[0] ?? null
      answer = promptText ?? (isMarathi(marathiPart) ? marathiPart : null)
      break
    }
  }

  const clean = (text: string | null) => (isMarathi(text) ? normalizeAudioText(text) : null)
  return { prompt: clean(promptText), speaker: clean(speaker), answer: clean(answer) }
}

// One query for all of a lesson's texts → { normalized text → public URL }.
// Audio is optional: if the lookup fails the lesson still loads, just silent.
const getAudioUrls = async (supabase: SupabaseClient, texts: string[]) => {
  const urls = new Map<string, string>()
  if (texts.length === 0) return urls

  const { data, error } = await supabase
    .from('audio_clips')
    .select('text, storage_path')
    .eq('model', AUDIO_MODEL)
    .eq('speaker', AUDIO_SPEAKER)
    .in('text', texts.flatMap(audioLookupKeys))

  if (error) {
    console.error('Failed to fetch audio clips', error)
    return urls
  }

  const found = new Map(
    data.map((clip) => [clip.text, supabase.storage.from(AUDIO_BUCKET).getPublicUrl(clip.storage_path).data.publicUrl])
  )
  for (const text of texts) {
    const url = audioLookupKeys(text).map((key) => found.get(key)).find(Boolean)
    if (url) urls.set(text, url)
  }
  return urls
}

export async function getLessonSummaries(supabase: SupabaseClient) {
  const { data: lessons, error } = await supabase
    .from('lessons')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw new Error('Failed to fetch lessons')

  return (lessons || []).map((lesson) => ({
    id: lesson.id,
    title: lesson.title,
    module_id: lesson.module_id,
  }))
}

export async function getLessonDetail(supabase: SupabaseClient, lessonId: string, userId: string) {
  const [lessonResult, phrasesResult, stepsResult, progressResult] = await Promise.all([
    supabase.from('lessons').select('*').eq('id', lessonId).single(),
    supabase.from('phrases').select('*').eq('lesson_id', lessonId).order('order_index', { ascending: true }),
    supabase.from('lesson_steps').select('*').eq('lesson_id', lessonId).order('order_index', { ascending: true }),
    supabase
      .from('user_progress')
      .select('status')
      .eq('user_id', userId)
      .eq('lesson_id', lessonId)
      .maybeSingle(),
  ])

  if (lessonResult.error?.code === 'PGRST116') throw new NotFoundError('Lesson not found')
  if (lessonResult.error || phrasesResult.error || stepsResult.error || progressResult.error) {
    throw new Error('Failed to fetch lesson')
  }

  const lesson = lessonResult.data
  const rawPhrases = phrasesResult.data || []
  const rawSteps = (stepsResult.data || []).filter((step) => step.step_type !== 'context')

  const stepTexts = rawSteps.map(stepAudioTexts)
  const texts = new Set<string>(rawPhrases.map((phrase) => normalizeAudioText(phrase.target)))
  for (const stepText of stepTexts) {
    for (const text of Object.values(stepText)) if (text) texts.add(text)
  }
  const audioUrls = await getAudioUrls(supabase, [...texts])
  const urlFor = (text: string | null) => (text ? audioUrls.get(text) ?? null : null)

  const phrases = rawPhrases.map((phrase) => ({
    id: phrase.id,
    source: phrase.source,
    target: phrase.target,
    transliteration: phrase.transliteration,
    order_index: phrase.order_index,
    audio_url: urlFor(normalizeAudioText(phrase.target)),
  }))

  const steps = rawSteps.map((step, index) => {
    const { prompt, speaker, answer } = stepTexts[index]
    const audio: StepAudio = { prompt: urlFor(prompt), speaker: urlFor(speaker), answer: urlFor(answer) }
    return {
      id: step.id,
      phrase_id: step.phrase_id,
      step_type: step.step_type,
      order_index: step.order_index,
      prompt: step.prompt,
      data: step.data,
      correct_answer: step.correct_answer,
      hint: step.hint,
      audio,
    }
  })

  return {
    id: lesson.id,
    title: lesson.title,
    module_id: lesson.module_id,
    phrases,
    steps,
    status: progressResult.data?.status ?? 'not_started',
  }
}
