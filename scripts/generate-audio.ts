// Generates Marathi audio for one lesson with Sarvam and stores it in Supabase.
//
//   npm run audio -- <lessonId>            generate missing clips
//   npm run audio -- <lessonId> --dry-run  list texts, call nothing, spend nothing
//   npm run audio -- <lessonId> --words-only  only single words (for measuring billing)
//
// Reads SARVAM_API_KEY, NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY
// from .env.local (loaded by `tsx --env-file`). Never prints any key.

import { createHash } from 'node:crypto'
import { createClient } from '@supabase/supabase-js'
import type { WebSocketLikeConstructor } from '@supabase/realtime-js'
import ws from 'ws'
import type { AudioClip } from '@/lib/types'
import {
  AUDIO_BUCKET as BUCKET,
  AUDIO_MODEL as SARVAM_MODEL,
  AUDIO_SPEAKER as SARVAM_SPEAKER,
  audioLookupKeys,
  normalizeAudioText as normalize,
  stepAudioTexts,
} from '@/lib/data/lessons'

const LANGUAGE_CODE = 'mr-IN'
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

const collectLessonTexts = async (lessonId: string) => {
  const [phrases, steps] = await Promise.all([
    supabase.from('phrases').select('target').eq('lesson_id', lessonId),
    supabase.from('lesson_steps').select('step_type, prompt, data, correct_answer').eq('lesson_id', lessonId),
  ])
  if (phrases.error) throw phrases.error
  if (steps.error) throw steps.error
  if (phrases.data.length === 0 && steps.data.length === 0) {
    throw new Error(`No phrases or steps found for lesson ${lessonId}`)
  }

  // Same rules the lesson page uses to look clips up (lib/data/lessons.ts).
  const raw: string[] = phrases.data.map((p) => p.target)
  for (const step of steps.data) {
    for (const text of Object.values(stepAudioTexts(step))) if (text) raw.push(text)
  }

  const texts = new Set(raw.map(normalize).filter(Boolean))
  // "तू कोण आहेस" is covered by "तू कोण आहेस?" when both are in this lesson.
  return [...texts].filter((text) => !audioLookupKeys(text).slice(1).some((key) => texts.has(key)))
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

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

// Sarvam answers 429 when we send too many requests too quickly. Back off
// progressively instead of failing; other errors get one quick retry.
const RETRY_DELAYS_MS = [5_000, 15_000, 30_000]

const withRetry = async <T>(label: string, fn: () => Promise<T>) => {
  for (let attempt = 0; ; attempt++) {
    try {
      return await fn()
    } catch (error) {
      const message = (error as Error).message
      const rateLimited = message.includes('Sarvam 429')
      const delay = RETRY_DELAYS_MS[attempt]
      if (delay === undefined || (!rateLimited && attempt > 0)) throw error
      console.warn(`  ${rateLimited ? 'rate limited' : 'error'} on ${label}, retrying in ${delay / 1000}s`)
      await sleep(rateLimited ? delay : 2_000)
    }
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
    .in('text', texts.flatMap(audioLookupKeys))
  if (existing.error) throw existing.error

  const stored = new Set(existing.data.map((clip: Pick<AudioClip, 'text'>) => clip.text))
  const done = new Set(texts.filter((text) => audioLookupKeys(text).some((key) => stored.has(key))))
  const wordsOnly = args.includes('--words-only')
  const missing = texts.filter((text) => !done.has(text) && (!wordsOnly || !text.includes(' ')))
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
  for (const [index, text] of missing.entries()) {
    if (index > 0) await sleep(500) // stay under Sarvam's rate limit
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
