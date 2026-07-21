'use client'

import { forwardRef, useEffect, useImperativeHandle, useMemo, useState } from 'react'
import type { StepHandle, StepProps } from './types'

const FillBlankStepCard = forwardRef<StepHandle, StepProps>(({ step, onAnswer, onReadyChange }, ref) => {
  const sentence = typeof step.data.sentence === 'string' ? step.data.sentence : ''
  const wordBank = useMemo(
    () => (Array.isArray(step.data.word_bank) ? (step.data.word_bank as string[]) : []),
    [step.data.word_bank]
  )
  const blankIndex = typeof step.data.blank_index === 'number' ? step.data.blank_index : -1

  const [selected, setSelected] = useState<string | null>(null)
  const [checked, setChecked] = useState(false)

  const isCorrect = checked && selected === step.correct_answer

  useEffect(() => {
    onReadyChange(selected !== null && !checked)
  }, [selected, checked, onReadyChange])

  useImperativeHandle(ref, () => ({
    check: () => {
      if (!selected) return
      const correct = selected === step.correct_answer
      setChecked(true)
      onAnswer({ submitted: selected, isCorrect: correct })
    },
  }))

  const sentenceParts = sentence.split(' ')
  const displayed = sentenceParts
    .map((part, index) => (index === blankIndex ? selected ?? '___' : part))
    .join(' ')

  const handleSelect = (word: string) => {
    if (checked) return
    setSelected(word)
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
    </div>
  )
})

FillBlankStepCard.displayName = 'FillBlankStepCard'

export default FillBlankStepCard
