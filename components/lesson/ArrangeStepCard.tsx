'use client'

import { forwardRef, useEffect, useImperativeHandle, useMemo, useState } from 'react'
import type { StepHandle, StepProps } from './types'

const ArrangeStepCard = forwardRef<StepHandle, StepProps>(({ step, onAnswer, onReadyChange }, ref) => {
  const words = useMemo(
    () => (Array.isArray(step.data.words) ? (step.data.words as string[]) : []),
    [step.data.words]
  )

  const [available, setAvailable] = useState<string[]>(words)
  const [chosen, setChosen] = useState<string[]>([])
  const [revealed, setRevealed] = useState(false)

  useEffect(() => {
    onReadyChange(available.length === 0 && chosen.length > 0 && !revealed)
  }, [available, chosen, revealed, onReadyChange])

  useImperativeHandle(ref, () => ({
    check: () => {
      if (available.length > 0) return
      setRevealed(true)
      onAnswer({ submitted: chosen.join(' '), isCorrect: chosen.join(' ') === step.correct_answer })
    },
  }))

  const pickWord = (index: number) => {
    if (revealed) return
    const word = available[index]
    setAvailable((prev) => prev.filter((_, i) => i !== index))
    setChosen((prev) => [...prev, word])
  }

  const removeWord = (index: number) => {
    if (revealed) return
    const word = chosen[index]
    setChosen((prev) => prev.filter((_, i) => i !== index))
    setAvailable((prev) => [...prev, word])
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="min-h-16 p-4 bg-white border border-[#E0E0E0] rounded-xl flex flex-wrap gap-2">
        {chosen.length === 0 && (
          <span className="text-[#8A8A96] text-sm">Tap words below to build the sentence</span>
        )}
        {chosen.map((word, index) => (
          <button
            key={`${word}-${index}`}
            onClick={() => removeWord(index)}
            disabled={revealed}
            className="px-4 py-2 rounded-lg bg-[#111111] text-white text-[15px] font-medium"
          >
            {word}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        {available.map((word, index) => (
          <button
            key={`${word}-${index}`}
            onClick={() => pickWord(index)}
            disabled={revealed}
            className="px-4 py-2 rounded-lg border border-[#E0E0E0] bg-white text-[#111111] text-[15px] font-medium"
          >
            {word}
          </button>
        ))}
      </div>
    </div>
  )
})

ArrangeStepCard.displayName = 'ArrangeStepCard'

export default ArrangeStepCard
