"use client"

const LABELS = ["A", "B", "C", "D"]
const LABEL_COLORS = ["bg-sky-500","bg-orange-500","bg-green-500","bg-pink-500"]

interface QuestionDisplayProps {
  text: string
  options: string[]
  correctIndex?: number | null   // undefined/null = hide; number = highlight
  className?: string
}

export function QuestionDisplay({ text, options, correctIndex = null, className = "" }: QuestionDisplayProps) {
  return (
    <div className={`w-full ${className}`}>
      <div className="bg-white rounded-2xl shadow-md px-6 py-5 mb-4 text-center">
        <p className="text-xl md:text-2xl font-bold text-gray-800 leading-snug">{text}</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {options.map((opt, i) => {
          const isCorrect = correctIndex === i
          return (
            <div
              key={i}
              className={`
                flex items-start gap-2 rounded-xl px-4 py-3 text-sm font-semibold
                transition-all duration-300
                ${isCorrect
                  ? "bg-green-100 border-2 border-green-400 text-green-800 ring-2 ring-green-300"
                  : "bg-white border border-gray-200 text-gray-700 opacity-70"
                }
              `}
            >
              <span className={`${LABEL_COLORS[i]} text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5`}>
                {LABELS[i]}
              </span>
              <span className="leading-snug">{opt}</span>
              {isCorrect && <span className="ml-auto shrink-0">✅</span>}
            </div>
          )
        })}
      </div>
    </div>
  )
}
