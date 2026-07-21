'use client'

import { useRef, useState } from 'react'
import StepCardShell from './StepCardShell'
import { AnswerFeedbackDialog } from './AnswerFeedbackDialog'
import { renderStep } from './stepRegistry'
import type { LessonStep, Phrase, StepAnswer, StepAttempt, StepHandle } from './types'

interface LessonEngineProps {
  steps: LessonStep[]
  phrasesById: Map<string, Phrase>
  onComplete: (attempts: StepAttempt[]) => void
}

export default function LessonEngine({ steps, phrasesById, onComplete }: LessonEngineProps) {
  const [queue, setQueue] = useState<LessonStep[]>(steps)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [attempts, setAttempts] = useState<StepAttempt[]>([])
  const [pendingAnswer, setPendingAnswer] = useState<StepAnswer | null>(null)
  const [ready, setReady] = useState(false)
  const stepRef = useRef<StepHandle>(null)

  const step = queue[currentIndex]
  const phrase = phrasesById.get(step.phrase_id)
  const isLastQueued = currentIndex === queue.length - 1

  const handleAnswer = (result: StepAnswer) => {
    setPendingAnswer(result)
  }

  const handleCheck = () => {
    stepRef.current?.check()
  }

  const handleContinue = () => {
    if (!pendingAnswer) return

    const nextAttempts = [
      ...attempts,
      { step_id: step.id, phrase_id: step.phrase_id, is_correct: pendingAnswer.isCorrect },
    ]

    if (isLastQueued && pendingAnswer.isCorrect) {
      onComplete(nextAttempts)
      return
    }

    setAttempts(nextAttempts)
    if (!pendingAnswer.isCorrect) {
      setQueue((prev) => [...prev, step])
    }
    setPendingAnswer(null)
    setReady(false)
    setCurrentIndex((prev) => prev + 1)
  }

  return (
    <>
      <StepCardShell
        stepNumber={currentIndex + 1}
        totalSteps={queue.length}
        prompt={step.prompt}
        showCheckButton={pendingAnswer === null}
        canCheck={ready}
        onCheck={handleCheck}
      >
        {renderStep({
          step,
          phrase,
          onAnswer: handleAnswer,
          onReadyChange: setReady,
          stepRef,
          stepKey: String(currentIndex),
        })}
      </StepCardShell>

      {pendingAnswer && (
        <AnswerFeedbackDialog
          isCorrect={pendingAnswer.isCorrect}
          correctAnswer={step.correct_answer}
          continueLabel={isLastQueued && pendingAnswer.isCorrect ? 'Finish' : 'Continue'}
          onContinue={handleContinue}
        />
      )}
    </>
  )
}
