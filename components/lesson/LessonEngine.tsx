'use client'

import { useEffect, useMemo, useState } from 'react'
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
  const isContextStep = step.step_type === 'context'

  const interactiveSteps = useMemo(
    () => steps.filter((s) => s.step_type !== 'context'),
    [steps]
  )

  useEffect(() => {
    if (!isContextStep) return

    const nextAttempts = [
      ...attempts,
      { step_id: step.id, phrase_id: step.phrase_id, is_correct: true },
    ]

    if (currentIndex === steps.length - 1) {
      onComplete(nextAttempts)
      return
    }

    /* eslint-disable react-hooks/set-state-in-effect -- auto-advances past non-interactive context steps */
    setAttempts(nextAttempts)
    setPendingAnswer(null)
    setCurrentIndex((prev) => prev + 1)
    /* eslint-enable react-hooks/set-state-in-effect */
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex])

  const handleAnswer = (result: StepAnswer) => {
    setPendingAnswer(result)
  }

  const handleContinue = () => {
    if (!pendingAnswer) return

    const nextAttempts = [
      ...attempts,
      { step_id: step.id, phrase_id: step.phrase_id, is_correct: pendingAnswer.isCorrect },
    ]

    if (currentIndex === steps.length - 1) {
      onComplete(nextAttempts)
      return
    }

    setAttempts(nextAttempts)
    setPendingAnswer(null)
    setCurrentIndex((prev) => prev + 1)
  }

  if (isContextStep) {
    return null
  }

  const stepNumber = interactiveSteps.findIndex((s) => s.id === step.id) + 1
  const isLastStep = currentIndex === steps.length - 1

  return (
    <StepCardShell
      stepNumber={stepNumber}
      totalSteps={interactiveSteps.length}
      prompt={step.prompt}
      canContinue={pendingAnswer !== null}
      onContinue={handleContinue}
      continueLabel={isLastStep ? 'Finish' : 'Continue'}
      hideAction={step.step_type === 'fill_blank'}
    >
      {renderStep({ step, phrase, onAnswer: handleAnswer, onContinue: handleContinue, isLastStep })}
    </StepCardShell>
  )
}
