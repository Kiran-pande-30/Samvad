export interface Phrase {
  id: string
  source: string
  target: string
  transliteration: string | null
  order_index: number
}

export interface LessonStep {
  id: string
  phrase_id: string
  step_type: string
  order_index: number
  prompt: string
  data: Record<string, unknown>
  correct_answer: string | null
}

export interface StepAnswer {
  submitted: string | null
  isCorrect: boolean
}

export interface StepProps {
  step: LessonStep
  phrase: Phrase | undefined
  onAnswer: (result: StepAnswer) => void
  onContinue: () => void
  isLastStep: boolean
}

export interface StepAttempt {
  step_id: string
  phrase_id: string
  is_correct: boolean
}
