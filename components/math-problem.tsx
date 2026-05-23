"use client"

interface MathProblemProps {
  num1: number
  num2: number
  operator: string
  currentTeam: "blue" | "red"
  speedMode?: boolean
}

export function MathProblem({ num1, num2, operator, currentTeam, speedMode = false }: MathProblemProps) {
  const teamColor = currentTeam === "blue" ? "text-blue-500" : "text-red-500"
  const teamName  = currentTeam === "blue" ? "Equipo Azul" : "Equipo Rojo"

  return (
    <div className="text-center mb-4">
      {speedMode ? (
        <p className="text-sm font-medium text-purple-600 mb-2 animate-pulse">
          ⚡ ¡El primero en contestar gana el punto!
        </p>
      ) : (
        <p className={`text-sm font-medium ${teamColor} mb-2`}>
          Turno de: {teamName}
        </p>
      )}
      <div className="bg-white rounded-xl shadow-md px-6 py-4 inline-block">
        <span className="text-3xl font-bold text-gray-800">
          {num1} {operator} {num2} = ?
        </span>
      </div>
    </div>
  )
}
