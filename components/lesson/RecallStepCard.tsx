'use client'

import MultipleChoiceOptions from './MultipleChoiceOptions'
import type { StepProps } from './types'

export default function RecallStepCard({ step, onAnswer }: StepProps) {
  const options = Array.isArray(step.data.options) ? (step.data.options as string[]) : []

  return (
    <MultipleChoiceOptions
      options={options}
      correctAnswer={step.correct_answer}
      onAnswer={onAnswer}
    />
  )
}
