'use client'

import { useEffect } from 'react'
import type { StepProps } from './types'

export default function ContextStepCard({ step, phrase, onAnswer }: StepProps) {
  useEffect(() => {
    onAnswer({ submitted: null, isCorrect: true })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step.id])

  if (!phrase) return null

  return (
    <div className="p-4 bg-white border border-[#E0E0E0] rounded-xl">
      <p className="text-[18px] font-semibold text-[#111111]">{phrase.target}</p>
      {phrase.transliteration && (
        <p className="text-sm text-[#8A8A96] mt-1 italic">{phrase.transliteration}</p>
      )}
      <p className="text-sm text-[#8A8A96] mt-2">{phrase.source}</p>
    </div>
  )
}
