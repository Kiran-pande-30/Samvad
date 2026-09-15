import type { Ref } from 'react'
import RecallStepCard from './RecallStepCard'
import ArrangeStepCard from './ArrangeStepCard'
import MatchStepCard from './MatchStepCard'
import FillBlankStepCard from './FillBlankStepCard'
import ConversationStepCard from './ConversationStepCard'
import UnsupportedStepCard from './UnsupportedStepCard'
import type { StepHandle, StepProps } from './types'

interface RenderStepArgs extends StepProps {
  stepRef: Ref<StepHandle>
  stepKey: string
}

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
    case 'conversation':
      return (
        <ConversationStepCard
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
