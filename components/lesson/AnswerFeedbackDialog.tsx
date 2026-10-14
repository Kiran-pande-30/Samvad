'use client'

import { useEffect, useState } from 'react'
import PlayAudioButton from './PlayAudioButton'
import type { StepMeaning } from '@/lib/types'

interface AnswerFeedbackDialogProps {
  isCorrect: boolean
  correctAnswer: string | null
  answerMeaning: StepMeaning | null
  pickedMeaning: StepMeaning | null
  audioUrl: string | null
  continueLabel: string
  onContinue: () => void
}

export const AnswerFeedbackDialog = ({
  isCorrect,
  correctAnswer,
  answerMeaning,
  pickedMeaning,
  audioUrl,
  continueLabel,
  onContinue,
}: AnswerFeedbackDialogProps) => {
  const [entered, setEntered] = useState(false)

  useEffect(() => {
    const frame = requestAnimationFrame(() => setEntered(true))
    return () => cancelAnimationFrame(frame)
  }, [])

  return (
    <div
      className={`fixed bottom-0 left-1/2 z-50 w-full max-w-107.5 border-t px-4 pt-5 pb-6 shadow-[rgba(36,36,36,0.08)_0px_-4px_16px_0px] transition-transform duration-300 ease-out ${
        entered ? 'translate-x-[-50%] translate-y-0' : 'translate-x-[-50%] translate-y-full'
      } ${isCorrect ? 'bg-success-bg border-success' : 'bg-error-bg border-error'}`}
      style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 24px)' }}
    >
      <div className="flex items-center gap-3 mb-1">
        <span
          className={`flex items-center justify-center w-8 h-8 rounded-full text-white text-[16px] font-bold shrink-0 ${
            isCorrect ? 'bg-success' : 'bg-error'
          }`}
        >
          {isCorrect ? '✓' : '✕'}
        </span>
        <p className={`text-[18px] font-bold ${isCorrect ? 'text-success' : 'text-error'}`}>
          {isCorrect ? 'Excellent!' : 'Not quite'}
        </p>
        {audioUrl && (
          <PlayAudioButton
            src={audioUrl}
            autoPlay
            label="Play the correct answer"
            className={`ml-auto -my-2 bg-white/70 ${isCorrect ? 'text-success' : 'text-error'}`}
          />
        )}
      </div>

      <div className="ml-11 mb-4 space-y-2 text-[15px]">
        {!isCorrect && correctAnswer && (
          <p>
            Correct answer: <span className="font-semibold">{correctAnswer}</span>
          </p>
        )}

        {/* Meaning of the full correct answer, on right and wrong attempts alike. */}
        {answerMeaning && (
          <p>
            {/* Wrong attempts already show the answer above; repeat it only when it differs (e.g. fill_blank's full sentence). */}
            {(isCorrect || answerMeaning.marathi !== correctAnswer?.trim().replace(/[.।]+$/, '')) && (
              <span className="font-semibold">{answerMeaning.marathi} </span>
            )}
            <span className="text-gray-600">= {answerMeaning.hindi}</span>
          </p>
        )}

        {pickedMeaning && (
          <p className="text-gray-600">
            You picked <span className="font-semibold text-gray-800">{pickedMeaning.marathi}</span>, which means{' '}
            {pickedMeaning.hindi}
          </p>
        )}
      </div>

      <button
        onClick={onContinue}
        className="w-full h-14.5 mt-3 bg-coral-strong text-white rounded-full text-[17px] font-semibold tracking-[-0.2px] flex items-center justify-center cursor-pointer border-none active:opacity-85 active:scale-[0.985] transition-[opacity,transform] duration-150 shrink-0"
      >
        {continueLabel}
      </button>
    </div>
  )
}
