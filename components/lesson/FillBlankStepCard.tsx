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
  const [checked, setChecked] = useState(false)

  const isCorrect = checked && selected === step.correct_answer

  const sentenceParts = sentence.split(' ')
  const displayed = sentenceParts
    .map((part, index) => (index === blankIndex ? selected ?? '___' : part))
    .join(' ')

  const handleSelect = (word: string) => {
    if (checked) return
    setSelected(word)
  }

  const handleCheck = () => {
    if (!selected) return
    const correct = selected === step.correct_answer
    setChecked(true)
    onAnswer({ submitted: selected, isCorrect: correct })
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="p-4 bg-white border border-[#E0E0E0] rounded-xl">
        <p className="text-[18px] font-semibold text-[#111111]">{displayed}</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {wordBank.map((word) => {
          const isSelected = selected === word
          const isCorrectOption = checked && isCorrect && isSelected
          const isWrongSelection = checked && !isCorrect && isSelected

          return (
            <button
              key={word}
              onClick={() => handleSelect(word)}
              disabled={checked}
              className={`px-4 py-2 rounded-lg border text-[15px] font-medium ${
                isCorrectOption
                  ? 'border-[#2E7D32] bg-[#EAF6EB] text-[#2E7D32]'
                  : isWrongSelection
                    ? 'border-[#d45656] bg-[#FDECEC] text-[#d45656]'
                    : isSelected
                      ? 'border-[#111111] bg-[#F9F9F9] text-[#111111]'
                      : 'border-[#E0E0E0] bg-white text-[#111111]'
              }`}
            >
              {word}
            </button>
          )
        })}
      </div>

      {checked && !isCorrect && (
        <p className="text-sm text-[#d45656]">Correct answer: {step.correct_answer}</p>
      )}

      {!checked && (
        <button
          onClick={handleCheck}
          disabled={!selected}
          className="w-full h-12 rounded-full border border-[#111111] text-[#111111] text-[15px] font-semibold disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Check
        </button>
      )}
    </div>
  )
}
