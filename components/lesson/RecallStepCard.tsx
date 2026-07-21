'use client'

import { forwardRef } from 'react'
import MultipleChoiceOptions from './MultipleChoiceOptions'
import type { StepHandle, StepProps } from './types'

const RecallStepCard = forwardRef<StepHandle, StepProps>(({ step, onAnswer, onReadyChange }, ref) => {
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

RecallStepCard.displayName = 'RecallStepCard'

export default RecallStepCard
