'use client'

import { useState } from 'react'
import MultipleChoiceOptions from './MultipleChoiceOptions'
import type { StepProps } from './types'

export default function MatchStepCard({ step, onAnswer }: StepProps) {
  const [selected, setSelected] = useState<string | null>(null)
  const [revealed, setRevealed] = useState(false)

  const options = Array.isArray(step.data.options) ? (step.data.options as string[]) : []

  const handleSelect = (option: string) => {
    setSelected(option)
    setRevealed(true)
    onAnswer({ submitted: option, isCorrect: option === step.correct_answer })
  }

  return (
    <MultipleChoiceOptions
      options={options}
      selected={selected}
      revealed={revealed}
      correctAnswer={step.correct_answer}
      onSelect={handleSelect}
    />
  )
}
