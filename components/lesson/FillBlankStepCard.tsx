'use client'

import { useMemo, useState } from 'react'
import type { StepProps } from './types'

export default function FillBlankStepCard({ step, onAnswer }: StepProps) {
  const sentence = typeof step.data.sentence === 'string' ? step.data.sentence : ''
  const wordBank = useMemo(
    () => (Array.isArray(step.data.word_bank) ? (step.data.word_bank as string[]) : []),
    [step.data.word_bank]
  )
  const blankIndex = typeof step.data.blank_index === 'number' ? step.data.blank_index : -1

  const [selected, setSelected] = useState<string | null>(null)
  const [revealed, setRevealed] = useState(false)

  const sentenceParts = sentence.split(' ')
  const displayed = sentenceParts
    .map((part, index) => (index === blankIndex ? selected ?? '___' : part))
    .join(' ')

  const handleSelect = (word: string) => {
    if (revealed) return
    setSelected(word)
    setRevealed(true)
    onAnswer({ submitted: word, isCorrect: word === step.correct_answer })
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="p-4 bg-white border border-[#E0E0E0] rounded-xl">
        <p className="text-[18px] font-semibold text-[#111111]">{displayed}</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {wordBank.map((word) => {
          const isSelected = selected === word
          const isCorrectOption = revealed && word === step.correct_answer
          const isWrongSelection = revealed && isSelected && word !== step.correct_answer

          return (
            <button
              key={word}
              onClick={() => handleSelect(word)}
              disabled={revealed}
              className={`px-4 py-2 rounded-lg border text-[15px] font-medium ${
                isCorrectOption
                  ? 'border-[#2E7D32] bg-[#EAF6EB] text-[#2E7D32]'
                  : isWrongSelection
                    ? 'border-[#d45656] bg-[#FDECEC] text-[#d45656]'
                    : 'border-[#E0E0E0] bg-white text-[#111111]'
              }`}
            >
              {word}
            </button>
          )
        })}
      </div>
    </div>
  )
}
