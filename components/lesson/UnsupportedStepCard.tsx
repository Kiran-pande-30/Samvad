'use client'

import { useEffect } from 'react'
import type { StepProps } from './types'

export default function UnsupportedStepCard({ step, onAnswer }: StepProps) {
  useEffect(() => {
    onAnswer({ submitted: null, isCorrect: true })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step.id])

  return (
    <div className="p-4 bg-[#F9F9F9] border border-[#E0E0E0] rounded-xl">
      <p className="text-sm text-[#8A8A96]">
        Unsupported step type: <span className="font-mono">{step.step_type}</span>
      </p>
    </div>
  )
}
