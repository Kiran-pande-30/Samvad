interface MultipleChoiceOptionsProps {
  options: string[]
  selected: string | null
  revealed: boolean
  correctAnswer: string | null
  onSelect: (option: string) => void
}

export default function MultipleChoiceOptions({
  options,
  selected,
  revealed,
  correctAnswer,
  onSelect,
}: MultipleChoiceOptionsProps) {
  return (
    <div className="flex flex-col gap-3">
      {options.map((option) => {
        const isSelected = selected === option
        const isCorrectOption = revealed && option === correctAnswer
        const isWrongSelection = revealed && isSelected && option !== correctAnswer

        return (
          <button
            key={option}
            onClick={() => !revealed && onSelect(option)}
            disabled={revealed}
            className={`w-full text-left px-5 py-4 rounded-xl border text-[16px] font-medium transition-colors duration-150 ${
              isCorrectOption
                ? 'border-[#2E7D32] bg-[#EAF6EB] text-[#2E7D32]'
                : isWrongSelection
                  ? 'border-[#d45656] bg-[#FDECEC] text-[#d45656]'
                  : isSelected
                    ? 'border-[#111111] bg-[#F9F9F9] text-[#111111]'
                    : 'border-[#E0E0E0] bg-white text-[#111111]'
            }`}
          >
            {option}
          </button>
        )
      })}
    </div>
  )
}
