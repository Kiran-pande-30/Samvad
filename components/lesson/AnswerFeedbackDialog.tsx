'use client'

import { useEffect, useState } from 'react'

interface AnswerFeedbackDialogProps {
  isCorrect: boolean
  correctAnswer: string | null
  continueLabel: string
  onContinue: () => void
}

export const AnswerFeedbackDialog = ({
  isCorrect,
  correctAnswer,
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
      } ${isCorrect ? 'bg-[#EAF6EB] border-[#2E7D32]' : 'bg-[#FDECEC] border-[#d45656]'}`}
      style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 24px)' }}
    >
      <div className="flex items-center gap-3 mb-1">
        <span
          className={`flex items-center justify-center w-8 h-8 rounded-full text-white text-[16px] font-bold shrink-0 ${
            isCorrect ? 'bg-[#2E7D32]' : 'bg-[#d45656]'
          }`}
        >
          {isCorrect ? '✓' : '✕'}
        </span>
        <p className={`text-[18px] font-bold ${isCorrect ? 'text-[#2E7D32]' : 'text-[#d45656]'}`}>
          {isCorrect ? 'Excellent!' : 'Not quite'}
        </p>
      </div>

      {!isCorrect && correctAnswer && (
        <p className="text-[15px] text-[#111111] mb-4 ml-11">
          Correct answer: <span className="font-semibold">{correctAnswer}</span>
        </p>
      )}

      <button
        onClick={onContinue}
        className="w-full h-14.5 mt-3 bg-[#111111] text-white rounded-full text-[17px] font-semibold tracking-[-0.2px] flex items-center justify-center cursor-pointer border-none active:opacity-85 active:scale-[0.985] transition-[opacity,transform] duration-150 shrink-0"
      >
        {continueLabel}
      </button>
    </div>
  )
}
