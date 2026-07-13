'use client'

import { useState } from 'react'
import StepCardShell from './StepCardShell'
import { renderStep } from './stepRegistry'
import type { LessonStep, Phrase, StepAnswer, StepAttempt } from './types'

interface LessonEngineProps {
  steps: LessonStep[]
  phrasesById: Map<string, Phrase>
  onComplete: (attempts: StepAttempt[]) => void
}

export default function LessonEngine({ steps, phrasesById, onComplete }: LessonEngineProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [attempts, setAttempts] = useState<StepAttempt[]>([])
  const [pendingAnswer, setPendingAnswer] = useState<StepAnswer | null>(null)

  const step = steps[currentIndex]
  const phrase = phrasesById.get(step.phrase_id)
  const isLastStep = currentIndex === steps.length - 1

  const handleAnswer = (result: StepAnswer) => {
    setPendingAnswer(result)
  }

  const handleContinue = () => {
    if (!pendingAnswer) return

    const nextAttempts = [
      ...attempts,
      { step_id: step.id, phrase_id: step.phrase_id, is_correct: pendingAnswer.isCorrect },
    ]

    if (isLastStep) {
      onComplete(nextAttempts)
      return
    }

    setAttempts(nextAttempts)
    setPendingAnswer(null)
    setCurrentIndex((prev) => prev + 1)
  }

  return (
    <StepCardShell
      stepNumber={currentIndex + 1}
      totalSteps={steps.length}
      prompt={step.prompt}
      canContinue={pendingAnswer !== null}
      onContinue={handleContinue}
      continueLabel={isLastStep ? 'Finish' : 'Continue'}
    >
      {renderStep({ step, phrase, onAnswer: handleAnswer })}
    </StepCardShell>
  )
}
