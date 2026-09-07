'use client'

import { forwardRef } from 'react'
import MultipleChoiceOptions from './MultipleChoiceOptions'
import type { StepHandle, StepProps } from './types'

const ConversationStepCard = forwardRef<StepHandle, StepProps>(({ step, onAnswer, onReadyChange }, ref) => {
  const speaker = typeof step.data.speaker === 'string' ? step.data.speaker : ''
  const speakerSays = typeof step.data.speaker_says === 'string' ? step.data.speaker_says : ''
  const options = Array.isArray(step.data.options) ? (step.data.options as string[]) : []

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1 items-start">
        {speaker && <p className="text-[13px] font-medium text-[#8A8A96] px-1">{speaker}</p>}
        <div className="max-w-[85%] px-4 py-3 bg-[#F1F1F4] rounded-2xl rounded-tl-sm">
          <p className="text-[16px] text-[#111111]">{speakerSays}</p>
        </div>
      </div>

      <MultipleChoiceOptions
        ref={ref}
        options={options}
        correctAnswer={step.correct_answer}
        onAnswer={onAnswer}
        onReadyChange={onReadyChange}
      />
    </div>
  )
})

ConversationStepCard.displayName = 'ConversationStepCard'

export default ConversationStepCard
