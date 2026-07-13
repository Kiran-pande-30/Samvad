interface StepCardShellProps {
  stepNumber: number
  totalSteps: number
  prompt: string
  children: React.ReactNode
  canContinue: boolean
  onContinue: () => void
  continueLabel?: string
}

export default function StepCardShell({
  stepNumber,
  totalSteps,
  prompt,
  children,
  canContinue,
  onContinue,
  continueLabel = 'Continue',
}: StepCardShellProps) {
  return (
    <div className="flex flex-col flex-1">
      <div className="w-full h-2 bg-[#F0F0F0] rounded-full overflow-hidden mb-8">
        <div className="h-full bg-[#111111] rounded-full transition-[width] duration-300"
          style={{ width: `${(stepNumber / totalSteps) * 100}%` }} />
      </div>

      <div className="flex-1 flex flex-col">
        <div className="p-6 bg-[#F9F9F9] rounded-2xl border border-[#E0E0E0] mb-6">
          <p className="text-[20px] font-bold text-[#111111] leading-[1.3]">{prompt}</p>
        </div>

        <div className="flex-1">{children}</div>
      </div>

      <button
        onClick={onContinue}
        disabled={!canContinue}
        className="w-full h-14.5 mt-8 bg-[#111111] text-white rounded-full text-[17px] font-semibold tracking-[-0.2px] flex items-center justify-center cursor-pointer border-none active:opacity-85 active:scale-[0.985] transition-[opacity,transform] duration-150 shrink-0 disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100"
      >
        {continueLabel}
      </button>
    </div>
  )
}
