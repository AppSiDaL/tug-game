"use client"

interface CalculatorProps {
  team: "blue" | "red"
  teamName: string
  score: number
  maxScore?: number
  value: string
  disabled?: boolean
  feedback?: "correct" | "wrong" | null
  onNumberClick: (num: string) => void
  onClear: () => void
  onSubmit: () => void
}

const BUTTONS = [
  ["7", "8", "9"],
  ["4", "5", "6"],
  ["1", "2", "3"],
  ["C", "0", "OK"],
]

export function Calculator({
  team,
  teamName,
  score,
  maxScore = 5,
  value,
  disabled = false,
  feedback = null,
  onNumberClick,
  onClear,
  onSubmit,
}: CalculatorProps) {
  const isBlue = team === "blue"

  const headerGradient = isBlue
    ? "from-blue-500 to-blue-600"
    : "from-red-500 to-red-600"

  const okGradient = isBlue
    ? "from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
    : "from-red-500 to-red-600 hover:from-red-600 hover:to-red-700"

  const ringColor = isBlue ? "ring-blue-400" : "ring-red-400"

  const feedbackBg =
    feedback === "correct"
      ? "bg-green-50"
      : feedback === "wrong"
      ? "bg-red-50"
      : "bg-gray-50"

  const feedbackBorder =
    feedback === "correct"
      ? "border-green-400"
      : feedback === "wrong"
      ? "border-red-400"
      : "border-gray-200"

  const handleClick = (label: string) => {
    if (disabled) return
    if (label === "C") onClear()
    else if (label === "OK") onSubmit()
    else onNumberClick(label)
  }

  return (
    <div
      className={`
        w-full max-w-75 rounded-3xl overflow-hidden shadow-xl
        transition-all duration-300
        ${disabled ? "opacity-40 grayscale scale-95" : `ring-4 ${ringColor} scale-100`}
      `}
    >
      {/* Header */}
      <div className={`bg-linear-to-br ${headerGradient} px-5 py-4`}>
        <div className="flex items-center justify-between mb-3">
          <span className="text-white font-bold text-base tracking-wide">{teamName}</span>
          {!disabled && (
            <span className="text-white/80 text-xs font-medium bg-white/20 rounded-full px-2 py-0.5">
              Tu turno
            </span>
          )}
        </div>

        {/* Score dots */}
        <div className="flex items-center gap-1.5">
          {Array.from({ length: maxScore }).map((_, i) => (
            <div
              key={i}
              className={`
                h-3 rounded-full transition-all duration-300
                ${i < score
                  ? "bg-white w-5"
                  : "bg-white/30 w-3"
                }
              `}
            />
          ))}
          <span className="text-white/90 text-sm font-bold ml-2">{score}</span>
        </div>
      </div>

      {/* Display */}
      <div className={`px-4 pt-4 pb-2 bg-white`}>
        <div
          className={`
            rounded-2xl border-2 ${feedbackBorder} ${feedbackBg}
            px-4 py-3 min-h-16 flex items-center justify-between
            transition-colors duration-300
          `}
        >
          <span className="text-3xl font-bold text-gray-800 tracking-wider min-w-[2ch]">
            {value || <span className="text-gray-300">_</span>}
          </span>
          {feedback === "correct" && <span className="text-2xl">✅</span>}
          {feedback === "wrong"   && <span className="text-2xl">❌</span>}
          {!feedback && !disabled && (
            <span className="w-0.5 h-7 bg-gray-400 animate-pulse rounded-full" />
          )}
        </div>
      </div>

      {/* Keypad */}
      <div className="bg-white px-4 pb-4 pt-1">
        <div className="grid grid-cols-3 gap-2">
          {BUTTONS.flat().map((label) => {
            const isOk    = label === "OK"
            const isClear = label === "C"

            const base =
              "rounded-2xl font-bold text-xl h-14 flex items-center justify-center " +
              "transition-all active:scale-95 select-none cursor-pointer "

            const style = isOk
              ? `bg-linear-to-br ${okGradient} text-white shadow-md`
              : isClear
              ? "bg-red-100 hover:bg-red-200 text-red-600"
              : "bg-gray-100 hover:bg-gray-200 text-gray-800"

            return (
              <button
                key={label}
                type="button"
                disabled={disabled}
                onClick={() => handleClick(label)}
                className={`${base} ${style} disabled:cursor-not-allowed`}
              >
                {label}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
