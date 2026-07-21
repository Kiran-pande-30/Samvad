import { forwardRef, useEffect, useImperativeHandle, type Ref } from 'react'
import RecallStepCard from './RecallStepCard'
import ArrangeStepCard from './ArrangeStepCard'
import MatchStepCard from './MatchStepCard'
import FillBlankStepCard from './FillBlankStepCard'
import UnsupportedStepCard from './UnsupportedStepCard'
import type { StepHandle, StepProps } from './types'

interface RenderStepArgs extends StepProps {
  stepRef: Ref<StepHandle>
  stepKey: string
}

// Context steps are informational only (no answer to submit), so the Check
// button should always be enabled and simply acknowledges the step.
const ContextStepCard = forwardRef<StepHandle, StepProps>(({ phrase, onAnswer, onReadyChange }, ref) => {
  useEffect(() => {
    onReadyChange(true)
  }, [onReadyChange])

  useImperativeHandle(ref, () => ({
    check: () => onAnswer({ submitted: null, isCorrect: true }),
  }))

  return (
    <div className="p-6 bg-white border border-[#E0E0E0] rounded-xl flex flex-col gap-2">
      <p className="text-[20px] font-bold text-[#111111]">{phrase?.target}</p>
      {phrase?.transliteration && (
        <p className="text-[15px] text-[#8A8A96]">{phrase.transliteration}</p>
      )}
      <p className="text-[16px] text-[#111111]">{phrase?.source}</p>
    </div>
  )
})

ContextStepCard.displayName = 'ContextStepCard'

export const renderStep = ({ step, phrase, onAnswer, onReadyChange, stepRef, stepKey }: RenderStepArgs) => {
  switch (step.step_type) {
    case 'recall':
      return (
        <RecallStepCard
          key={stepKey}
          ref={stepRef}
          step={step}
          phrase={phrase}
          onAnswer={onAnswer}
          onReadyChange={onReadyChange}
        />
      )
    case 'arrange':
      return (
        <ArrangeStepCard
          key={stepKey}
          ref={stepRef}
          step={step}
          phrase={phrase}
          onAnswer={onAnswer}
          onReadyChange={onReadyChange}
        />
      )
    case 'match':
      return (
        <MatchStepCard
          key={stepKey}
          ref={stepRef}
          step={step}
          phrase={phrase}
          onAnswer={onAnswer}
          onReadyChange={onReadyChange}
        />
      )
    case 'fill_blank':
      return (
        <FillBlankStepCard
          key={stepKey}
          ref={stepRef}
          step={step}
          phrase={phrase}
          onAnswer={onAnswer}
          onReadyChange={onReadyChange}
        />
      )
    case 'context':
      return (
        <ContextStepCard
          key={stepKey}
          ref={stepRef}
          step={step}
          phrase={phrase}
          onAnswer={onAnswer}
          onReadyChange={onReadyChange}
        />
      )
    default:
      return (
        <UnsupportedStepCard
          key={stepKey}
          step={step}
          phrase={phrase}
          onAnswer={onAnswer}
          onReadyChange={onReadyChange}
        />
      )
  }
}
