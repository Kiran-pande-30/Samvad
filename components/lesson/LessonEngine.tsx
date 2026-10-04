'use client'

import { useRef, useState } from 'react'
import StepCardShell from './StepCardShell'
import { AnswerFeedbackDialog } from './AnswerFeedbackDialog'
import { renderStep } from './stepRegistry'
import type { LessonResume } from '@/lib/types'
import type { LessonStep, Phrase, StepAnswer, StepHandle } from './types'

interface LessonEngineProps {
  steps: LessonStep[]
  phrasesById: Map<string, Phrase>
  resume: LessonResume | null
  onComplete: () => void
}

export default function LessonEngine({ steps, phrasesById, resume, onComplete }: LessonEngineProps) {
  // Resuming: start from the steps still to do (worked out on the server from
  // this run's saved answers). Steps already done count towards the progress bar.
  const [initial] = useState(() => {
    const byId = new Map(steps.map((step) => [step.id, step]))
    const remaining = (resume?.remaining_step_ids ?? [])
      .map((id) => byId.get(id))
      .filter((step): step is LessonStep => !!step)
    return remaining.length > 0 ? { queue: remaining, done: resume?.done ?? 0 } : { queue: steps, done: 0 }
  })
  const [queue, setQueue] = useState<LessonStep[]>(initial.queue)
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
        stepNumber={initial.done + currentIndex + 1}
        totalSteps={initial.done + queue.length}
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
