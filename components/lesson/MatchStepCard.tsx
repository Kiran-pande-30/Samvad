'use client'

import { forwardRef } from 'react'
import MultipleChoiceOptions from './MultipleChoiceOptions'
import type { StepHandle, StepProps } from './types'

const MatchStepCard = forwardRef<StepHandle, StepProps>(({ step, onAnswer, onReadyChange }, ref) => {
  const options = Array.isArray(step.data.options) ? (step.data.options as string[]) : []

  return (
    <MultipleChoiceOptions
      ref={ref}
      options={options}
      correctAnswer={step.correct_answer}
      onAnswer={onAnswer}
      onReadyChange={onReadyChange}
    />
  )
})

MatchStepCard.displayName = 'MatchStepCard'

export default MatchStepCard
