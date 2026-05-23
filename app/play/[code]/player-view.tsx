"use client"

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Calculator } from "@/components/calculator"
import { MathProblem } from "@/components/math-problem"
import { MultipleChoice } from "@/components/multiple-choice"
import { CountdownBar } from "@/components/countdown-bar"
import { createSupabaseBrowserClient } from "@/lib/supabase/client"
import { useSound } from "@/hooks/use-sound"
import { useCountdown } from "@/hooks/use-countdown"
import {
  CATEGORY_META, MODE_META,
  type MCProblemData, type MathProblemData,
  type PlayerRow, type SessionRow, type Team,
} from "@/lib/supabase/types"

interface Props { initialSession: SessionRow; initialPlayers: PlayerRow[] }

export function PlayerView({ initialSession, initialPlayers }: Props) {
  const router  = useRouter()
  const sound   = useSound()

  const [session,   setSession]   = useState<SessionRow>(initialSession)
  const [players,   setPlayers]   = useState<PlayerRow[]>(initialPlayers)
  const [playerId,  setPlayerId]  = useState<string | null>(null)
  const [input,     setInput]     = useState("")
  const [selected,  setSelected]  = useState<number | null>(null)
  const [feedback,  setFeedback]  = useState<"correct" | "wrong" | null>(null)
  const [correctIdx, setCorrectIdx] = useState<number | null>(null)
  const [pending,   startTransition] = useTransition()
  const timeoutCalledRef = useRef(false)

  useEffect(() => {
    const stored = localStorage.getItem(`tug:${session.code}`)
    if (!stored) { router.replace("/play"); return }
    setPlayerId(stored)
  }, [session.code, router])

  useEffect(() => {
    const supabase = createSupabaseBrowserClient()
    const channel = supabase.channel(`play:${session.id}`)
      .on("postgres_changes",
        { event: "UPDATE", schema: "public", table: "sessions", filter: `id=eq.${session.id}` },
        (payload) => {
          setSession(payload.new as SessionRow)
          setInput(""); setSelected(null); setFeedback(null); setCorrectIdx(null)
          timeoutCalledRef.current = false
        })
      .on("postgres_changes",
        { event: "INSERT", schema: "public", table: "players", filter: `session_id=eq.${session.id}` },
        (payload) => setPlayers((prev) => [...prev, payload.new as PlayerRow]))
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [session.id])

  const myPlayer  = useMemo(() => playerId ? players.find((p) => p.id === playerId) : undefined, [players, playerId])
  const isMath    = session.current_problem?.type === "math"
  const isSpeedLike = session.game_mode === "speed" || session.game_mode === "rounds"
  const hasTimer  = session.time_per_question > 0

  const isMyTurn  = isSpeedLike
    ? session.status === "active"
    : myPlayer?.team === session.current_team && session.status === "active"

  // Timer
  const onTick = useCallback((left: number) => {
    if (left <= 5 && left > 0 && isMyTurn) sound.playTick()
  }, [isMyTurn, sound])

  const onExpire = useCallback(() => {
    if (timeoutCalledRef.current || !session.question_started_at) return
    timeoutCalledRef.current = true
    sound.playExpire()
    // Only the current team player (or any in speed/rounds) calls timeout
    if (!isMyTurn && !isSpeedLike) return
    const qStartedAt = session.question_started_at
    startTransition(async () => {
      const supabase = createSupabaseBrowserClient()
      await supabase.rpc("timeout_question", {
        p_session_id:          session.id,
        p_question_started_at: qStartedAt,
      })
    })
  }, [session.id, session.question_started_at, isMyTurn, isSpeedLike, sound])

  const { secondsLeft } = useCountdown(
    hasTimer ? session.question_started_at : null,
    session.time_per_question,
    onTick,
    onExpire,
  )

  const submitAnswer = useCallback((answer: number) => {
    if (!playerId || pending) return
    startTransition(async () => {
      const supabase = createSupabaseBrowserClient()
      const { data, error } = await supabase.rpc("submit_answer", {
        p_player_id: playerId,
        p_answer:    answer,
      })
      if (error) { sound.playWrong(); setInput(""); setSelected(null); return }
      const result = data as { is_correct: boolean }
      if (result.is_correct) {
        sound.playCorrect()
        setFeedback("correct")
        if (!isMath && session.current_problem?.type === "mc") {
          setCorrectIdx((session.current_problem as MCProblemData).correct)
        }
      } else {
        sound.playWrong()
        setFeedback("wrong")
        if (!isMath && session.current_problem?.type === "mc") {
          setCorrectIdx((session.current_problem as MCProblemData).correct)
        }
        if (isSpeedLike) {
          setTimeout(() => { setFeedback(null); setSelected(null); setCorrectIdx(null) }, 1500)
        }
        setInput("")
      }
    })
  }, [playerId, pending, isMath, isSpeedLike, session.current_problem, sound])

  // Calculator handlers (math only)
  const handleNumberClick = useCallback((num: string) => {
    if (isMyTurn && !pending && !feedback) setInput((prev) => prev + num)
  }, [isMyTurn, pending, feedback])
  const handleClear   = useCallback(() => { if (isMyTurn) setInput("") }, [isMyTurn])
  const handleSubmit  = useCallback(() => {
    const answer = parseInt(input, 10)
    if (isNaN(answer)) return
    submitAnswer(answer)
  }, [input, submitAnswer])

  // MC handler
  const handleSelect = useCallback((idx: number) => {
    if (!isMyTurn || pending || feedback) return
    setSelected(idx)
    submitAnswer(idx)
  }, [isMyTurn, pending, feedback, submitAnswer])

  if (!myPlayer && session.status !== "finished") {
    return <main className="min-h-screen flex items-center justify-center"><p className="text-gray-400">Conectando…</p></main>
  }
  if (session.status === "finished") return <FinishedScreen session={session} myPlayer={myPlayer} />
  if (session.status === "waiting")  return <WaitingScreen  session={session} myPlayer={myPlayer} players={players} />

  const p = session.current_problem!
  const cat  = CATEGORY_META[session.category]
  const mode = MODE_META[session.game_mode]

  return (
    <main className="min-h-screen bg-gray-100 flex flex-col items-center py-5 px-4 gap-4">
      {/* Score */}
      <ScoreBar session={session} myPlayer={myPlayer!} />

      {/* Mode badge */}
      <div className="flex gap-2">
        <span className="text-xs font-semibold bg-white px-3 py-1 rounded-full shadow-sm text-gray-600">
          {cat.emoji} {cat.label}
        </span>
        <span className="text-xs font-semibold bg-white px-3 py-1 rounded-full shadow-sm text-gray-600">
          {mode.emoji} {mode.label}
        </span>
        {session.game_mode === "rounds" && (
          <span className="text-xs font-semibold bg-white px-3 py-1 rounded-full shadow-sm text-gray-600">
            {session.current_round + 1}/{session.total_rounds}
          </span>
        )}
      </div>

      {/* Timer */}
      {hasTimer && (
        <div className="w-full max-w-sm px-2">
          <CountdownBar secondsLeft={secondsLeft} timeLimit={session.time_per_question} />
        </div>
      )}

      {/* Question */}
      {isMath ? (
        <MathProblem
          num1={(p as MathProblemData).num1}
          num2={(p as MathProblemData).num2}
          operator={(p as MathProblemData).operator}
          currentTeam={session.current_team}
          speedMode={isSpeedLike}
        />
      ) : (
        <div className="w-full max-w-sm bg-white rounded-2xl shadow-md px-5 py-4">
          <p className="text-lg font-bold text-gray-800 leading-snug text-center">
            {(p as MCProblemData).text}
          </p>
        </div>
      )}

      {/* Answer input */}
      {isMath ? (
        <Calculator
          team={myPlayer!.team}
          teamName={myPlayer!.team === "blue" ? "AZUL" : "ROJO"}
          score={myPlayer!.team === "blue" ? session.blue_score : session.red_score}
          maxScore={session.winning_score}
          value={input}
          disabled={!isMyTurn}
          feedback={feedback}
          onNumberClick={handleNumberClick}
          onClear={handleClear}
          onSubmit={handleSubmit}
        />
      ) : (
        <MultipleChoice
          options={(p as MCProblemData).options}
          selected={selected}
          feedback={feedback}
          correctIndex={correctIdx}
          disabled={!isMyTurn}
          onSelect={handleSelect}
        />
      )}

      {!isMyTurn && session.status === "active" && !isSpeedLike && (
        <p className="text-gray-400 text-sm animate-pulse">Espera tu turno…</p>
      )}
    </main>
  )
}

function ScoreBar({ session, myPlayer }: { session: SessionRow; myPlayer: PlayerRow }) {
  const myScore    = myPlayer.team === "blue" ? session.blue_score : session.red_score
  const otherScore = myPlayer.team === "blue" ? session.red_score  : session.blue_score
  const myColor    = myPlayer.team === "blue" ? "text-blue-600"   : "text-red-600"
  return (
    <div className="w-full max-w-sm bg-white rounded-2xl shadow-md p-4 flex justify-between items-center">
      <div className="text-center">
        <p className={`text-xs font-semibold ${myColor} mb-0.5`}>Tú</p>
        <p className="text-3xl font-bold text-gray-800">{myScore}</p>
      </div>
      <div className="text-gray-300 text-xl">vs</div>
      <div className="text-center">
        <p className="text-xs font-semibold text-gray-400 mb-0.5">Rival</p>
        <p className="text-3xl font-bold text-gray-800">{otherScore}</p>
      </div>
    </div>
  )
}

function WaitingScreen({ session, myPlayer, players }: {
  session: SessionRow; myPlayer?: PlayerRow; players: PlayerRow[]
}) {
  const bluePlayer = players.find((p) => p.team === "blue")
  const redPlayer  = players.find((p) => p.team === "red")
  const teamColor  = myPlayer?.team === "blue" ? "text-blue-600" : "text-red-600"
  const teamLabel  = myPlayer?.team === "blue" ? "Equipo Azul 🔵" : "Equipo Rojo 🔴"
  const cat        = CATEGORY_META[session.category]
  const mode       = MODE_META[session.game_mode]
  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-6 p-6 bg-linear-to-br from-blue-50 via-white to-red-50">
      <div className="text-center">
        <p className={`text-sm font-semibold ${teamColor} mb-1`}>{teamLabel}</p>
        <p className="text-2xl font-bold text-gray-800">Hola, {myPlayer?.nickname ?? "…"}</p>
      </div>
      <div className="bg-white rounded-2xl shadow-md p-6 w-full max-w-xs text-center">
        <p className="text-xs text-gray-400 mb-1">Código</p>
        <p className="font-mono font-bold text-4xl tracking-widest text-gray-800">{session.code}</p>
        <div className="flex justify-center gap-2 mt-3">
          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{cat.emoji} {cat.label}</span>
          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{mode.emoji} {mode.label}</span>
        </div>
      </div>
      <div className="flex gap-4">
        {(["blue", "red"] as Team[]).map((t) => {
          const pl = t === "blue" ? bluePlayer : redPlayer
          const bg = t === "blue" ? "bg-blue-100 text-blue-700" : "bg-red-100 text-red-700"
          return (
            <div key={t} className={`${bg} rounded-xl px-4 py-3 text-center min-w-28`}>
              <p className="text-xs font-medium">{t === "blue" ? "Azul" : "Rojo"}</p>
              <p className="font-bold truncate">{pl?.nickname ?? "—"}</p>
            </div>
          )
        })}
      </div>
      <p className="text-gray-400 text-sm animate-pulse">Esperando que el profesor inicie…</p>
    </main>
  )
}

function FinishedScreen({ session, myPlayer }: { session: SessionRow; myPlayer?: PlayerRow }) {
  const router  = useRouter()
  const iWon    = myPlayer?.team === session.winner
  const isDraw  = !session.winner
  const winnerLabel = session.winner === "blue" ? "Equipo Azul" : "Equipo Rojo"
  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-6 p-6 bg-linear-to-br from-blue-50 via-white to-red-50 text-center">
      <p className="text-6xl">{isDraw ? "🤝" : iWon ? "🏆" : "😔"}</p>
      <h2 className="text-3xl font-bold text-gray-800">
        {isDraw ? "¡Empate!" : iWon ? "¡Ganaste!" : "¡Perdiste!"}
      </h2>
      {!isDraw && <p className="text-gray-600">{winnerLabel} gana</p>}
      <p className="text-gray-400 text-lg font-semibold">{session.blue_score} – {session.red_score}</p>
      <button onClick={() => router.push("/")}
        className="mt-2 rounded-xl bg-linear-to-r from-blue-500 to-red-500 hover:opacity-90 text-white font-bold px-8 py-3 shadow-lg">
        Volver al inicio
      </button>
    </main>
  )
}
