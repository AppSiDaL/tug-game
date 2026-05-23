"use client"

const LABELS = ["A", "B", "C", "D"]

const OPTION_COLORS = [
  { idle: "bg-sky-100 hover:bg-sky-200 text-sky-800 border-sky-300",     label: "bg-sky-500"    },
  { idle: "bg-orange-100 hover:bg-orange-200 text-orange-800 border-orange-300", label: "bg-orange-500" },
  { idle: "bg-green-100 hover:bg-green-200 text-green-800 border-green-300",   label: "bg-green-500"  },
  { idle: "bg-pink-100 hover:bg-pink-200 text-pink-800 border-pink-300",       label: "bg-pink-500"   },
]

interface MultipleChoiceProps {
  options: string[]
  selected?: number | null
  feedback?: "correct" | "wrong" | null
  correctIndex?: number | null   // show answer after feedback
  disabled?: boolean
  onSelect: (index: number) => void
}

export function MultipleChoice({
  options,
  selected = null,
  feedback = null,
  correctIndex = null,
  disabled = false,
  onSelect,
}: MultipleChoiceProps) {
  return (
    <div className="grid grid-cols-1 gap-3 w-full max-w-sm">
      {options.map((text, i) => {
        const isSelected = selected === i
        const isCorrect  = correctIndex !== null && i === correctIndex
        const isWrong    = feedback === "wrong" && isSelected

        let extraStyle = ""
        if (feedback) {
          if (isCorrect)  extraStyle = "ring-4 ring-green-400 bg-green-100 border-green-400 text-green-800"
          else if (isWrong) extraStyle = "ring-4 ring-red-400 bg-red-100 border-red-400 text-red-800 opacity-70"
          else            extraStyle = "opacity-40"
        } else if (isSelected) {
          extraStyle = "ring-4 ring-blue-400"
        }

        return (
          <button
            key={i}
            type="button"
            disabled={disabled || !!feedback}
            onClick={() => onSelect(i)}
            className={`
              flex items-center gap-3 rounded-2xl border-2 px-4 py-3
              font-semibold text-left transition-all duration-200 active:scale-95
              disabled:cursor-not-allowed
              ${!feedback && !disabled ? OPTION_COLORS[i].idle : ""}
              ${extraStyle || (!feedback && !disabled ? "border-transparent" : "")}
            `}
          >
            <span className={`
              ${OPTION_COLORS[i].label} text-white rounded-full w-8 h-8 flex items-center
              justify-center text-sm font-bold shrink-0
            `}>
              {LABELS[i]}
            </span>
            <span className="text-base leading-snug">{text}</span>
            {feedback && isCorrect  && <span className="ml-auto text-xl">✅</span>}
            {feedback && isWrong    && <span className="ml-auto text-xl">❌</span>}
          </button>
        )
      })}
    </div>
  )
}
