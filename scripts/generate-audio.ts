// Generates Marathi audio for one lesson with Sarvam and stores it in Supabase.
//
//   npm run audio -- <lessonId>            generate missing clips
//   npm run audio -- <lessonId> --dry-run  list texts, call nothing, spend nothing
//
// Reads SARVAM_API_KEY, NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY
// from .env.local (loaded by `tsx --env-file`). Never prints any key.

import { createHash } from 'node:crypto'
import { createClient } from '@supabase/supabase-js'
import type { WebSocketLikeConstructor } from '@supabase/realtime-js'
import ws from 'ws'
import type { AudioClip } from '@/lib/types'

const SARVAM_MODEL = 'bulbul:v3'
const SARVAM_SPEAKER = 'ishita'
const LANGUAGE_CODE = 'mr-IN'
const BUCKET = 'audio'
const RUPEES_PER_CHAR = 30 / 10_000 // bulbul:v3 list price

const requireEnv = (name: string) => {
  const value = process.env[name]
  if (!value) throw new Error(`${name} is missing — is it in .env.local?`)
  return value
}

const supabase = createClient(
  requireEnv('NEXT_PUBLIC_SUPABASE_URL'),
  requireEnv('SUPABASE_SERVICE_ROLE_KEY'), // bypasses RLS: script-only, never in the app
  // Node 20 has no built-in WebSocket, which supabase-js's realtime client needs.
  { auth: { persistSession: false }, realtime: { transport: ws as unknown as WebSocketLikeConstructor } },
)

// "मी राज आहे." and "मी राज आहे" should share one clip. Keep "?" and "!" —
// they change the intonation.
const normalize = (text: string) =>
  text.trim().replace(/\s+/g, ' ').replace(/[.।]+$/, '').trim()

const fillBlank = (sentence: string, answer: string) => sentence.replace('___', answer)

const collectLessonTexts = async (lessonId: string) => {
  const [phrases, steps] = await Promise.all([
    supabase.from('phrases').select('target').eq('lesson_id', lessonId),
    supabase.from('lesson_steps').select('step_type, data, correct_answer').eq('lesson_id', lessonId),
  ])
  if (phrases.error) throw phrases.error
  if (steps.error) throw steps.error
  if (phrases.data.length === 0 && steps.data.length === 0) {
    throw new Error(`No phrases or steps found for lesson ${lessonId}`)
  }

  const raw: string[] = phrases.data.map((p) => p.target)

  for (const step of steps.data) {
    const data = (step.data ?? {}) as Record<string, unknown>
    const answer = step.correct_answer

    if (step.step_type === 'fill_blank' && typeof data.sentence === 'string' && answer) {
      raw.push(fillBlank(data.sentence, answer))
    }
    if (step.step_type === 'conversation' && typeof data.speaker_says === 'string') {
      raw.push(data.speaker_says)
    }
    if ((step.step_type === 'conversation' || step.step_type === 'arrange') && answer) {
      raw.push(answer)
    }
  }

  return [...new Set(raw.map(normalize).filter(Boolean))]
}

const storagePathFor = (text: string) => {
  const hash = createHash('sha256').update(`${SARVAM_MODEL}|${SARVAM_SPEAKER}|${text}`).digest('hex')
  return `mr/${hash.slice(0, 16)}.wav`
}

const synthesize = async (text: string) => {
  const res = await fetch('https://api.sarvam.ai/text-to-speech', {
    method: 'POST',
    headers: {
      'api-subscription-key': requireEnv('SARVAM_API_KEY'),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      text,
      language_code: LANGUAGE_CODE,
      model: SARVAM_MODEL,
      speaker: SARVAM_SPEAKER,
    }),
  })
  if (!res.ok) throw new Error(`Sarvam ${res.status}: ${await res.text()}`)

  const json = (await res.json()) as { audios?: string[] }
  const base64 = json.audios?.[0]
  if (!base64) throw new Error('Sarvam returned no audio')

  const audio = Buffer.from(base64, 'base64')
  if (audio.subarray(0, 4).toString('ascii') !== 'RIFF') {
    throw new Error('Sarvam audio is not a WAV file')
  }
  return audio
}

const withRetry = async <T>(label: string, fn: () => Promise<T>) => {
  try {
    return await fn()
  } catch (error) {
    console.warn(`  retrying ${label}: ${(error as Error).message}`)
    await new Promise((resolve) => setTimeout(resolve, 2000))
    return fn()
  }
}

const generateClip = async (text: string) => {
  const audio = await withRetry(text, () => synthesize(text))
  const storagePath = storagePathFor(text)

  // upsert: if a previous run uploaded the file but crashed before the insert,
  // re-running overwrites the same file instead of failing.
  const upload = await supabase.storage.from(BUCKET).upload(storagePath, audio, {
    contentType: 'audio/wav',
    cacheControl: '31536000', // 1 year: the path changes whenever the text or voice does
    upsert: true,
  })
  if (upload.error) throw upload.error

  const insert = await supabase.from('audio_clips').insert({
    text,
    model: SARVAM_MODEL,
    speaker: SARVAM_SPEAKER,
    storage_path: storagePath,
  })
  if (insert.error) throw insert.error

  return { storagePath, bytes: audio.length }
}

const main = async () => {
  const args = process.argv.slice(2)
  const dryRun = args.includes('--dry-run')
  const lessonId = args.find((arg) => !arg.startsWith('--'))
  if (!lessonId) throw new Error('Usage: npm run audio -- <lessonId> [--dry-run]')

  const texts = await collectLessonTexts(lessonId)

  const existing = await supabase
    .from('audio_clips')
    .select('text')
    .eq('model', SARVAM_MODEL)
    .eq('speaker', SARVAM_SPEAKER)
    .in('text', texts)
  if (existing.error) throw existing.error

  const done = new Set(existing.data.map((clip: Pick<AudioClip, 'text'>) => clip.text))
  const missing = texts.filter((text) => !done.has(text))
  const chars = missing.reduce((sum, text) => sum + text.length, 0)

  console.log(`Lesson ${lessonId}: ${texts.length} texts, ${done.size} already have audio, ${missing.length} to generate`)
  console.log(`Estimated cost: ${chars} characters ≈ ₹${(chars * RUPEES_PER_CHAR).toFixed(2)}\n`)
  for (const text of texts) console.log(`  ${done.has(text) ? '✓' : '+'} ${text}`)

  if (dryRun || missing.length === 0) {
    console.log(dryRun ? '\nDry run: nothing generated.' : '\nNothing to do.')
    return
  }

  console.log('')
  let failed = 0
  for (const text of missing) {
    try {
      const { storagePath, bytes } = await generateClip(text)
      console.log(`  ✓ ${text} → ${storagePath} (${Math.round(bytes / 1024)} KB)`)
    } catch (error) {
      failed++
      console.error(`  ✗ ${text}: ${(error as Error).message}`)
    }
  }

  console.log(`\nDone: ${missing.length - failed} generated, ${failed} failed.`)
  if (failed > 0) process.exitCode = 1
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})
