'use client'

import { useRef, useState } from 'react'
import StepCardShell from './StepCardShell'
import { AnswerFeedbackDialog } from './AnswerFeedbackDialog'
import { renderStep } from './stepRegistry'
import type { LessonStep, Phrase, StepAnswer, StepHandle } from './types'

interface LessonEngineProps {
  steps: LessonStep[]
  phrasesById: Map<string, Phrase>
  onComplete: () => void
}

export default function LessonEngine({ steps, phrasesById, onComplete }: LessonEngineProps) {
  const [queue, setQueue] = useState<LessonStep[]>(steps)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [pendingAnswer, setPendingAnswer] = useState<StepAnswer | null>(null)
  const [ready, setReady] = useState(false)
  const stepRef = useRef<StepHandle>(null)
  // Answers are saved one by one, in order; completing the lesson waits for them
  // because the server scores from what's saved.
  const pendingSaves = useRef<Promise<void>>(Promise.resolve())

  const step = queue[currentIndex]
  const phrase = phrasesById.get(step.phrase_id)
  const isLastQueued = currentIndex === queue.length - 1

  const handleAnswer = (result: StepAnswer) => {
    setPendingAnswer(result)
    const save = () =>
      fetch('/api/me/progress/attempt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ step_id: step.id, is_correct: result.isCorrect }),
      }).then((res) => {
        if (!res.ok) throw new Error('Failed to save answer')
      })
    // One retry, then carry on: a lost answer must not block the lesson.
    pendingSaves.current = pendingSaves.current
      .then(() => save().catch(save))
      .catch((error) => console.error(error))
  }

  const handleCheck = () => {
    stepRef.current?.check()
  }

  const handleContinue = () => {
    if (!pendingAnswer) return

    if (isLastQueued && pendingAnswer.isCorrect) {
      pendingSaves.current.then(onComplete)
      return
    }

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
        promptAudioUrl={step.audio.prompt}
        hint={step.hint}
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
          audioUrl={step.audio.answer}
          continueLabel={isLastQueued && pendingAnswer.isCorrect ? 'Finish' : 'Continue'}
          onContinue={handleContinue}
        />
      )}
    </>
  )
}
