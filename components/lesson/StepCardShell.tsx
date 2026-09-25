import { Lightbulb } from 'lucide-react'

interface StepCardShellProps {
  stepNumber: number
  totalSteps: number
  prompt: string
  hint: string | null
  children: React.ReactNode
  showCheckButton: boolean
  canCheck: boolean
  onCheck: () => void
}

const StepCardShell = ({
  stepNumber,
  totalSteps,
  prompt,
  hint,
  children,
  showCheckButton,
  canCheck,
  onCheck,
}: StepCardShellProps) => {
  return (
    <div className="flex flex-col flex-1">
      <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden mb-8">
        <div className="h-full bg-coral rounded-full transition-[width] duration-300"
          style={{ width: `${(stepNumber / totalSteps) * 100}%` }} />
      </div>

      <div className="flex-1 flex flex-col">
        <div className="p-6 bg-gray-50 rounded-2xl border border-gray-200 mb-6">
          <p className="text-[20px] font-bold leading-[1.3]">{prompt}</p>
        </div>

        <div className="flex-1">{children}</div>
      </div>

      {/* Hint and Check form the pre-answer bar; the feedback sheet takes its place once answered */}
      {showCheckButton && (
        <div className="mt-8 flex flex-col gap-3 shrink-0">
          {hint && (
            <div className="flex items-start gap-2 px-4 py-3 bg-brand-blue/5 border border-brand-blue/15 rounded-xl">
              <Lightbulb className="w-4.5 h-4.5 text-brand-blue shrink-0 mt-0.5" />
              <p className="text-[14px] text-brand-blue leading-[1.4]">{hint}</p>
            </div>
          )}

          <button
            onClick={onCheck}
            disabled={!canCheck}
            className="w-full h-14.5 bg-coral-strong text-white rounded-full text-[17px] font-semibold tracking-[-0.2px] flex items-center justify-center cursor-pointer border-none active:opacity-85 active:scale-[0.985] transition-[opacity,transform] duration-150 disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100"
          >
            Check
          </button>
        </div>
      )}
    </div>
  )
}

export default StepCardShell
