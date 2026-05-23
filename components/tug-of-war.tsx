"use client"

interface TugOfWarProps {
  blueScore: number
  redScore: number
  maxScore: number
}

export function TugOfWar({ blueScore, redScore, maxScore }: TugOfWarProps) {
  // Calculate position: -100 to 100, where negative = blue winning, positive = red winning
  const scoreDiff = redScore - blueScore
  const maxDiff = maxScore
  const position = Math.max(-maxDiff, Math.min(maxDiff, scoreDiff))
  const translatePercent = (position / maxDiff) * 40 // Max 40% movement

  return (
    <div className="flex flex-col items-center justify-center h-full w-full relative">
      {/* Center Line */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-1 h-32 bg-yellow-400 z-10" />
      
      {/* Tug of War GIF */}
      <div 
        className="transition-transform duration-500 ease-out"
        style={{ transform: `translateX(${translatePercent}%)` }}
      >
        <img
          src="https://mathtug.com/personss.gif"
          alt="Tug of War"
          className="w-full max-w-[400px] h-auto"
        />
      </div>

      {/* Score indicator */}
      <div className="mt-4 text-center">
        <p className="text-gray-500 text-sm">
          {blueScore === redScore
            ? "¡Empate!"
            : blueScore > redScore
            ? `Equipo Azul gana por ${blueScore - redScore}`
            : `Equipo Rojo gana por ${redScore - blueScore}`}
        </p>
      </div>
    </div>
  )
}
