'use client'

import { forwardRef, useEffect, useImperativeHandle, useState } from 'react'
import type { StepAnswer, StepHandle } from './types'

interface MultipleChoiceOptionsProps {
  options: string[]
  correctAnswer: string | null
  onAnswer: (result: StepAnswer) => void
  onReadyChange: (ready: boolean) => void
}

const MultipleChoiceOptions = forwardRef<StepHandle, MultipleChoiceOptionsProps>(
  ({ options, correctAnswer, onAnswer, onReadyChange }, ref) => {
    const [selected, setSelected] = useState<string | null>(null)
    const [checked, setChecked] = useState(false)

    useEffect(() => {
      onReadyChange(selected !== null && !checked)
    }, [selected, checked, onReadyChange])

    useImperativeHandle(ref, () => ({
      check: () => {
        if (!selected) return
        setChecked(true)
        onAnswer({ submitted: selected, isCorrect: selected === correctAnswer })
      },
    }))

    const handleSelect = (option: string) => {
      if (checked) return
      setSelected(option)
    }

    return (
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
    )
  }
)

MultipleChoiceOptions.displayName = 'MultipleChoiceOptions'

export default MultipleChoiceOptions
