export type Team = "blue" | "red"
export type SessionStatus = "waiting" | "active" | "finished"
export type GameMode = "turns" | "speed" | "countdown" | "rounds"
export type Category = "math" | "historia" | "ciencias" | "geografia" | "lengua" | "cultura"

export interface MathProblemData {
  type: "math"
  num1: number
  num2: number
  operator: string
  answer: number
}

export interface MCProblemData {
  type: "mc"
  id: string
  text: string
  options: string[]
  correct: number
}

export type ProblemData = MathProblemData | MCProblemData

export interface SessionRow {
  id: string
  code: string
  teacher_id: string
  status: SessionStatus
  game_mode: GameMode
  category: Category
  winning_score: number
  blue_score: number
  red_score: number
  current_team: Team
  current_problem: ProblemData | null
  winner: Team | null
  time_per_question: number   // 0 = no timer
  total_rounds: number        // 0 = first-to-N
  current_round: number
  question_started_at: string | null
  created_at: string
  started_at: string | null
  ended_at: string | null
}

export interface PlayerRow {
  id: string
  session_id: string
  nickname: string
  team: Team
  joined_at: string
  connected: boolean
}

export const CATEGORY_META: Record<Category, { label: string; emoji: string; color: string }> = {
  math:      { label: "Matemáticas",        emoji: "🔢", color: "bg-blue-500" },
  historia:  { label: "Historia",           emoji: "🏛️", color: "bg-amber-500" },
  ciencias:  { label: "Ciencias Naturales", emoji: "🔬", color: "bg-green-500" },
  geografia: { label: "Geografía",          emoji: "🌍", color: "bg-teal-500" },
  lengua:    { label: "Lengua y Literatura", emoji: "📚", color: "bg-purple-500" },
  cultura:   { label: "Cultura General",    emoji: "🌐", color: "bg-pink-500" },
}

export const MODE_META: Record<GameMode, { label: string; emoji: string; description: string }> = {
  turns:     { label: "Turnos",       emoji: "🔄", description: "Se alternan los turnos. Solo el equipo en turno puede responder." },
  speed:     { label: "Rapidez",      emoji: "⚡", description: "Ambos responden a la vez. El primero en acertar gana el punto." },
  countdown: { label: "Contrarreloj", emoji: "⏱️", description: "Como turnos, pero con 15 s por pregunta. Si se acaba el tiempo, pasa el turno." },
  rounds:    { label: "Rondas",       emoji: "🎯", description: "N preguntas en total. Ambos compiten. Gana quien acumule más puntos." },
}
