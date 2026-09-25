'use client'

import type { StepProps } from './types'

export default function UnsupportedStepCard({ step, onAnswer }: StepProps) {
  const handleCheck = () => {
    onAnswer({ submitted: null, isCorrect: true })
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl">
        <p className="text-sm text-gray-500">
          Unsupported step type: <span className="font-mono">{step.step_type}</span>
        </p>
      </div>

      <button
        onClick={handleCheck}
        className="w-full h-12 rounded-full border border-gray-900 text-[15px] font-semibold"
      >
        Check
      </button>
    </div>
  )
}
