import RecallStepCard from './RecallStepCard'
import ArrangeStepCard from './ArrangeStepCard'
import MatchStepCard from './MatchStepCard'
import FillBlankStepCard from './FillBlankStepCard'
import ContextStepCard from './ContextStepCard'
import UnsupportedStepCard from './UnsupportedStepCard'
import type { StepProps } from './types'

export function renderStep({ step, phrase, onAnswer, onContinue, isLastStep }: StepProps) {
  switch (step.step_type) {
    case 'recall':
      return <RecallStepCard key={step.id} step={step} phrase={phrase} onAnswer={onAnswer} onContinue={onContinue} isLastStep={isLastStep} />
    case 'arrange':
      return <ArrangeStepCard key={step.id} step={step} phrase={phrase} onAnswer={onAnswer} onContinue={onContinue} isLastStep={isLastStep} />
    case 'match':
      return <MatchStepCard key={step.id} step={step} phrase={phrase} onAnswer={onAnswer} onContinue={onContinue} isLastStep={isLastStep} />
    case 'fill_blank':
      return <FillBlankStepCard key={step.id} step={step} phrase={phrase} onAnswer={onAnswer} onContinue={onContinue} isLastStep={isLastStep} />
    case 'context':
      return <ContextStepCard key={step.id} step={step} phrase={phrase} onAnswer={onAnswer} onContinue={onContinue} isLastStep={isLastStep} />
    default:
      return <UnsupportedStepCard key={step.id} step={step} phrase={phrase} onAnswer={onAnswer} onContinue={onContinue} isLastStep={isLastStep} />
  }
}
