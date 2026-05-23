"use client"

import { useState, useCallback } from "react"
import { Calculator } from "./calculator"
import { TugOfWar } from "./tug-of-war"
import { MathProblem } from "./math-problem"

type Team = "blue" | "red"

interface GameState {
  blueScore: number
  redScore: number
  blueInput: string
  redInput: string
  currentTeam: Team
  num1: number
  num2: number
  operator: string
  answer: number
  gameOver: boolean
  winner: Team | null
}

const WINNING_SCORE = 5

const generateProblem = () => {
  const operators = ["+", "-", "×"]
  const operator = operators[Math.floor(Math.random() * operators.length)]
  
  let num1: number, num2: number, answer: number
  
  switch (operator) {
    case "+":
      num1 = Math.floor(Math.random() * 10) + 1
      num2 = Math.floor(Math.random() * 10) + 1
      answer = num1 + num2
      break
    case "-":
      num1 = Math.floor(Math.random() * 10) + 5
      num2 = Math.floor(Math.random() * num1)
      answer = num1 - num2
      break
    case "×":
      num1 = Math.floor(Math.random() * 5) + 1
      num2 = Math.floor(Math.random() * 5) + 1
      answer = num1 * num2
      break
    default:
      num1 = 1
      num2 = 1
      answer = 2
  }
  
  return { num1, num2, operator, answer }
}

export function TugOfWarGame() {
  const [gameState, setGameState] = useState<GameState>(() => {
    const problem = generateProblem()
    return {
      blueScore: 0,
      redScore: 0,
      blueInput: "",
      redInput: "",
      currentTeam: "blue",
      ...problem,
      gameOver: false,
      winner: null,
    }
  })

  const handleNumberClick = useCallback((team: Team, num: string) => {
    if (gameState.gameOver) return
    
    setGameState((prev) => ({
      ...prev,
      [team === "blue" ? "blueInput" : "redInput"]:
        prev[team === "blue" ? "blueInput" : "redInput"] + num,
    }))
  }, [gameState.gameOver])

  const handleClear = useCallback((team: Team) => {
    if (gameState.gameOver) return
    
    setGameState((prev) => ({
      ...prev,
      [team === "blue" ? "blueInput" : "redInput"]: "",
    }))
  }, [gameState.gameOver])

  const handleSubmit = useCallback((team: Team) => {
    if (gameState.gameOver || gameState.currentTeam !== team) return
    
    const input = team === "blue" ? gameState.blueInput : gameState.redInput
    const userAnswer = parseInt(input, 10)
    
    if (isNaN(userAnswer)) return
    
    const isCorrect = userAnswer === gameState.answer
    const newProblem = generateProblem()
    
    setGameState((prev) => {
      const newScore = isCorrect
        ? prev[team === "blue" ? "blueScore" : "redScore"] + 1
        : prev[team === "blue" ? "blueScore" : "redScore"]
      
      const isGameOver = newScore >= WINNING_SCORE
      
      return {
        ...prev,
        blueScore: team === "blue" && isCorrect ? newScore : prev.blueScore,
        redScore: team === "red" && isCorrect ? newScore : prev.redScore,
        blueInput: "",
        redInput: "",
        currentTeam: team === "blue" ? "red" : "blue",
        ...newProblem,
        gameOver: isGameOver,
        winner: isGameOver ? team : null,
      }
    })
  }, [gameState])

  const resetGame = useCallback(() => {
    const problem = generateProblem()
    setGameState({
      blueScore: 0,
      redScore: 0,
      blueInput: "",
      redInput: "",
      currentTeam: "blue",
      ...problem,
      gameOver: false,
      winner: null,
    })
  }, [])

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-8">
      {/* Header */}
      <div className="text-center mb-6">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2">
          🎮 Jalar la Cuerda Matemático
        </h1>
        <p className="text-gray-600">¡El primer equipo en llegar a {WINNING_SCORE} puntos gana!</p>
      </div>

      {/* Math Problem */}
      <MathProblem
        num1={gameState.num1}
        num2={gameState.num2}
        operator={gameState.operator}
        currentTeam={gameState.currentTeam}
      />

      {/* Game Area */}
      <div className="flex flex-col lg:flex-row items-center justify-center gap-4 lg:gap-8">
        {/* Blue Team Calculator */}
        <div className={`transition-opacity ${gameState.currentTeam === "blue" ? "opacity-100" : "opacity-50"}`}>
          <Calculator
            team="blue"
            teamName="EQUIPO AZUL"
            score={gameState.blueScore}
            value={gameState.blueInput}
            onNumberClick={(num) => handleNumberClick("blue", num)}
            onClear={() => handleClear("blue")}
            onSubmit={() => handleSubmit("blue")}
          />
        </div>

        {/* Tug of War Animation */}
        <div className="w-full lg:w-[400px] h-[200px] lg:h-[300px] flex items-center justify-center">
          <TugOfWar
            blueScore={gameState.blueScore}
            redScore={gameState.redScore}
            maxScore={WINNING_SCORE}
          />
        </div>

        {/* Red Team Calculator */}
        <div className={`transition-opacity ${gameState.currentTeam === "red" ? "opacity-100" : "opacity-50"}`}>
          <Calculator
            team="red"
            teamName="EQUIPO ROJO"
            score={gameState.redScore}
            value={gameState.redInput}
            onNumberClick={(num) => handleNumberClick("red", num)}
            onClear={() => handleClear("red")}
            onSubmit={() => handleSubmit("red")}
          />
        </div>
      </div>

      {/* Game Over Modal */}
      {gameState.gameOver && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 text-center shadow-2xl max-w-md mx-4">
            <h2 className="text-3xl font-bold mb-4">
              🎉 ¡{gameState.winner === "blue" ? "Equipo Azul" : "Equipo Rojo"} Gana! 🎉
            </h2>
            <p className="text-gray-600 mb-6">
              Puntaje final: Azul {gameState.blueScore} - Rojo {gameState.redScore}
            </p>
            <button
              onClick={resetGame}
              className="bg-gradient-to-r from-blue-500 to-red-500 text-white font-bold py-3 px-8 rounded-xl hover:opacity-90 transition-opacity"
            >
              Jugar de Nuevo
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
