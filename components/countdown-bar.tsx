"use client"

interface CountdownBarProps {
  secondsLeft: number
  timeLimit: number
  className?: string
}

export function CountdownBar({ secondsLeft, timeLimit, className = "" }: CountdownBarProps) {
  const progress = timeLimit > 0 ? secondsLeft / timeLimit : 1
  const isUrgent = secondsLeft <= 5 && secondsLeft > 0
  const isDone   = secondsLeft === 0

  const barColor = isDone
    ? "bg-gray-400"
    : isUrgent
    ? "bg-red-500"
    : progress > 0.5
    ? "bg-green-500"
    : "bg-yellow-500"

  return (
    <div className={`w-full flex items-center gap-3 ${className}`}>
      <span
        className={`
          text-2xl font-bold tabular-nums min-w-[2.5rem] text-right
          ${isDone ? "text-gray-400" : isUrgent ? "text-red-600 animate-pulse" : "text-gray-700"}
        `}
      >
        {secondsLeft}
      </span>
      <div className="flex-1 h-3 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${barColor}`}
          style={{ width: `${progress * 100}%` }}
        />
      </div>
    </div>
  )
}
