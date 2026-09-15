import type { SupabaseClient } from '@supabase/supabase-js'
import { NotFoundError } from './errors'

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
  const phrases = (phrasesResult.data || []).map((phrase) => ({
    id: phrase.id,
    source: phrase.source,
    target: phrase.target,
    transliteration: phrase.transliteration,
    order_index: phrase.order_index,
  }))
  const steps = (stepsResult.data || [])
    .filter((step) => step.step_type !== 'context')
    .map((step) => ({
      id: step.id,
      phrase_id: step.phrase_id,
      step_type: step.step_type,
      order_index: step.order_index,
      prompt: step.prompt,
      data: step.data,
      correct_answer: step.correct_answer,
      hint: step.hint,
    }))

  return {
    id: lesson.id,
    title: lesson.title,
    module_id: lesson.module_id,
    phrases,
    steps,
    status: progressResult.data?.status ?? 'not_started',
  }
}
