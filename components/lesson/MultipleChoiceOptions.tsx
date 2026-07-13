'use client'

import { useState } from 'react'
import type { StepAnswer } from './types'

interface MultipleChoiceOptionsProps {
  options: string[]
  correctAnswer: string | null
  onAnswer: (result: StepAnswer) => void
}

export default function MultipleChoiceOptions({
  options,
  correctAnswer,
  onAnswer,
}: MultipleChoiceOptionsProps) {
  const [selected, setSelected] = useState<string | null>(null)
  const [checked, setChecked] = useState(false)

  const handleSelect = (option: string) => {
    if (checked) return
    setSelected(option)
  }

  const handleCheck = () => {
    if (!selected) return
    setChecked(true)
    onAnswer({ submitted: selected, isCorrect: selected === correctAnswer })
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        {options.map((option) => {
          const isSelected = selected === option
          const isCorrectOption = checked && option === correctAnswer
          const isWrongSelection = checked && isSelected && option !== correctAnswer

          return (
            <button
              key={option}
              onClick={() => handleSelect(option)}
              disabled={checked}
              className={`w-full text-left px-5 py-4 rounded-xl border text-[16px] font-medium transition-colors duration-150 ${
                isCorrectOption
                  ? 'border-[#2E7D32] bg-[#EAF6EB] text-[#2E7D32]'
                  : isWrongSelection
                    ? 'border-[#d45656] bg-[#FDECEC] text-[#d45656]'
                    : isSelected
                      ? 'border-[#111111] bg-[#F9F9F9] text-[#111111]'
                      : 'border-[#E0E0E0] bg-white text-[#111111]'
              }`}
            >
              {option}
            </button>
          )
        })}
      </div>

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
