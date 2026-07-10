import RecallStepCard from './RecallStepCard'
import ArrangeStepCard from './ArrangeStepCard'
import MatchStepCard from './MatchStepCard'
import FillBlankStepCard from './FillBlankStepCard'
import ContextStepCard from './ContextStepCard'
import UnsupportedStepCard from './UnsupportedStepCard'
import type { StepProps } from './types'

export function renderStep({ step, phrase, onAnswer }: StepProps) {
  switch (step.step_type) {
    case 'recall':
      return <RecallStepCard key={step.id} step={step} phrase={phrase} onAnswer={onAnswer} />
    case 'arrange':
      return <ArrangeStepCard key={step.id} step={step} phrase={phrase} onAnswer={onAnswer} />
    case 'match':
      return <MatchStepCard key={step.id} step={step} phrase={phrase} onAnswer={onAnswer} />
    case 'fill_blank':
      return <FillBlankStepCard key={step.id} step={step} phrase={phrase} onAnswer={onAnswer} />
    case 'context':
      return <ContextStepCard key={step.id} step={step} phrase={phrase} onAnswer={onAnswer} />
    default:
      return <UnsupportedStepCard key={step.id} step={step} phrase={phrase} onAnswer={onAnswer} />
  }
}
