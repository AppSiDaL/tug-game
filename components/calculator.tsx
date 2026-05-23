"use client"

interface CalculatorProps {
  team: "blue" | "red"
  teamName: string
  score: number
  value: string
  onNumberClick: (num: string) => void
  onClear: () => void
  onSubmit: () => void
}

export function Calculator({
  team,
  teamName,
  score,
  value,
  onNumberClick,
  onClear,
  onSubmit,
}: CalculatorProps) {
  const isBlue = team === "blue"
  const headerBg = isBlue ? "bg-blue-500" : "bg-red-600"
  const okBg = isBlue ? "bg-blue-500 hover:bg-blue-600" : "bg-red-400 hover:bg-red-500"

  const renderScoreIcons = () => {
    const icons = []
    for (let i = 0; i < score; i++) {
      icons.push(
        <span key={i} className="text-2xl">
          {isBlue ? "🍌" : "🐱"}
        </span>
      )
    }
    return icons
  }

  return (
    <div className="w-full max-w-[280px] bg-white rounded-2xl shadow-lg overflow-hidden">
      {/* Header */}
      <div className={`${headerBg} p-4 text-center`}>
        <h2 className="text-white font-bold text-xl mb-2">{teamName}</h2>
        <div className="bg-white/20 rounded-lg p-2 min-h-[40px] flex items-center justify-center gap-1">
          {renderScoreIcons()}
        </div>
      </div>

      {/* Display */}
      <div className="p-4">
        <div className="bg-gray-100 rounded-lg p-3 mb-4 min-h-[50px] flex items-center">
          <span className="text-2xl font-medium text-gray-800">{value || ""}</span>
          <span className="animate-pulse ml-1 text-2xl text-gray-400">|</span>
        </div>

        {/* Number Pad */}
        <div className="grid grid-cols-3 gap-2">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
            <button
              key={num}
              onClick={() => onNumberClick(num.toString())}
              className="bg-gray-100 hover:bg-gray-200 active:bg-gray-300 rounded-xl py-4 text-xl font-medium text-gray-700 transition-colors"
            >
              {num}
            </button>
          ))}
          <button
            onClick={onClear}
            className="bg-red-100 hover:bg-red-200 active:bg-red-300 rounded-xl py-4 text-xl font-bold text-red-500 transition-colors"
          >
            C
          </button>
          <button
            onClick={() => onNumberClick("0")}
            className="bg-gray-100 hover:bg-gray-200 active:bg-gray-300 rounded-xl py-4 text-xl font-medium text-gray-700 transition-colors"
          >
            0
          </button>
          <button
            onClick={onSubmit}
            className={`${okBg} rounded-xl py-4 text-xl font-bold text-white transition-colors`}
          >
            OK
          </button>
        </div>
      </div>
    </div>
  )
}
