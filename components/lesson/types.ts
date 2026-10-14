import type { StepAudio, StepMeaning } from '@/lib/types'

export interface Phrase {
  id: string
  source: string
  target: string
  transliteration: string | null
  order_index: number
  audio_url: string | null
}

export interface LessonStep {
  id: string
  phrase_id: string
  step_type: string
  order_index: number
  prompt: string
  data: Record<string, unknown>
  correct_answer: string | null
  hint: string | null
  audio: StepAudio
  // The full correct Marathi answer and its Hindi meaning (null if no phrase matches).
  answer_meaning: StepMeaning | null
  // Hindi meanings of wrong Marathi options that are phrases elsewhere, keyed by option text.
  option_meanings: Record<string, string>
}

export interface StepAnswer {
  submitted: string | null
  isCorrect: boolean
}

export interface StepHandle {
  check: () => void
}

export interface StepProps {
  step: LessonStep
  phrase: Phrase | undefined
  onAnswer: (result: StepAnswer) => void
  onReadyChange: (ready: boolean) => void
}
