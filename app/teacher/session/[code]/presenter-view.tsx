"use client"

import { useEffect, useMemo, useState, useTransition } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { MathProblem } from "@/components/math-problem"
import { QuestionDisplay } from "@/components/question-display"
import { TugOfWar } from "@/components/tug-of-war"
import { CountdownBar } from "@/components/countdown-bar"
import { createSupabaseBrowserClient } from "@/lib/supabase/client"
import { useCountdown } from "@/hooks/use-countdown"
import { CATEGORY_META, MODE_META, type PlayerRow, type SessionRow, type Team, type MCProblemData, type MathProblemData } from "@/lib/supabase/types"
import { endSessionAction, startSessionAction } from "../../actions"

interface Props {
  initialSession: SessionRow
  initialPlayers: PlayerRow[]
}

export function PresenterView({ initialSession, initialPlayers }: Props) {
  const [session, setSession] = useState<SessionRow>(initialSession)
  const [players, setPlayers] = useState<PlayerRow[]>(initialPlayers)
  const [pending, startTransition] = useTransition()

  useEffect(() => {
    const supabase = createSupabaseBrowserClient()
    const channel = supabase
      .channel(`session:${session.id}`)
      .on("postgres_changes",
        { event: "UPDATE", schema: "public", table: "sessions", filter: `id=eq.${session.id}` },
        (payload) => setSession(payload.new as SessionRow))
      .on("postgres_changes",
        { event: "INSERT", schema: "public", table: "players", filter: `session_id=eq.${session.id}` },
        (payload) => setPlayers((prev) => [...prev, payload.new as PlayerRow]))
      .on("postgres_changes",
        { event: "DELETE", schema: "public", table: "players", filter: `session_id=eq.${session.id}` },
        (payload) => setPlayers((prev) => prev.filter((p) => p.id !== (payload.old as PlayerRow).id)))
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [session.id])

  const bluePlayer = useMemo(() => players.find((p) => p.team === "blue"), [players])
  const redPlayer  = useMemo(() => players.find((p) => p.team === "red"),  [players])
  const canStart   = !!bluePlayer && !!redPlayer && session.status === "waiting"

  const cat  = CATEGORY_META[session.category]  ?? { emoji: "?", label: session.category }
  const mode = MODE_META[session.game_mode] ?? { emoji: "?", label: session.game_mode }

  const handleStart = () => startTransition(async () => {
    try { await startSessionAction(session.id, session.code) }
    catch (e) { alert((e as Error).message) }
  })

  const handleEnd = () => {
    if (!confirm("¿Terminar el duelo?")) return
    startTransition(async () => {
      try { await endSessionAction(session.id, session.code) }
      catch (e) { alert((e as Error).message) }
    })
  }

  return (
    <main className="min-h-screen bg-linear-to-br from-blue-50 via-white to-red-50 p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        {/* Topbar */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Link href="/teacher/dashboard" className="text-sm text-gray-500 hover:text-gray-800">← Dashboard</Link>
            <span className="text-xs font-semibold bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
              {cat.emoji} {cat.label}
            </span>
            <span className="text-xs font-semibold bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
              {mode.emoji} {mode.label}
            </span>
          </div>
          {session.status !== "finished" && (
            <button onClick={handleEnd} disabled={pending}
              className="text-sm text-gray-500 hover:text-red-600 underline disabled:opacity-50">
              Terminar duelo
            </button>
          )}
        </div>

        {session.status === "waiting" && (
          <WaitingLobby
            code={session.code} bluePlayer={bluePlayer} redPlayer={redPlayer}
            canStart={canStart} pending={pending} onStart={handleStart}
          />
        )}
        {session.status === "active" && session.current_problem && (
          <ActiveGame session={session} bluePlayer={bluePlayer} redPlayer={redPlayer} />
        )}
        {session.status === "finished" && (
          <FinishedScreen session={session} bluePlayer={bluePlayer} redPlayer={redPlayer} />
        )}
      </div>
    </main>
  )
}

function WaitingLobby({ code, bluePlayer, redPlayer, canStart, pending, onStart }: {
  code: string; bluePlayer?: PlayerRow; redPlayer?: PlayerRow
  canStart: boolean; pending: boolean; onStart: () => void
}) {
  return (
    <div className="text-center">
      <p className="text-gray-600 mb-2">Comparte este código:</p>
      <div className="bg-white rounded-2xl shadow-xl px-8 py-6 inline-block mb-8">
        <p className="font-mono font-bold text-6xl md:text-7xl tracking-[0.3em] text-gray-800">{code}</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <PlayerSlot team="blue" player={bluePlayer} />
        <PlayerSlot team="red"  player={redPlayer}  />
      </div>
      <button onClick={onStart} disabled={!canStart || pending}
        className="rounded-xl bg-linear-to-r from-blue-500 to-red-500 hover:opacity-90 text-white font-bold px-8 py-4 text-lg shadow-lg transition-opacity disabled:opacity-40 disabled:cursor-not-allowed">
        {canStart ? "🚀 Iniciar duelo" : "Esperando jugadores…"}
      </button>
    </div>
  )
}

function PlayerSlot({ team, player }: { team: Team; player?: PlayerRow }) {
  const isBlue = team === "blue"
  return (
    <div className={`${isBlue ? "bg-blue-500" : "bg-red-600"} rounded-2xl p-6 text-white shadow-lg`}>
      <p className="text-sm font-medium opacity-90">{isBlue ? "🔵" : "🔴"} {isBlue ? "Equipo Azul" : "Equipo Rojo"}</p>
      <p className="text-2xl font-bold mt-2 min-h-8">{player ? player.nickname : "Esperando…"}</p>
    </div>
  )
}

function ActiveGame({ session, bluePlayer, redPlayer }: {
  session: SessionRow; bluePlayer?: PlayerRow; redPlayer?: PlayerRow
}) {
  const p       = session.current_problem!
  const isMath  = p.type === "math"
  const isBothActive = session.game_mode === "speed" || session.game_mode === "rounds"
  const hasTimer = session.time_per_question > 0

  const { secondsLeft } = useCountdown(
    hasTimer ? session.question_started_at : null,
    session.time_per_question,
  )

  return (
    <div>
      {/* Scores + round info */}
      <div className="grid grid-cols-2 gap-4 mb-5">
        <ScorePanel team="blue" player={bluePlayer} score={session.blue_score}
          isCurrent={isBothActive || session.current_team === "blue"} speedMode={isBothActive} />
        <ScorePanel team="red"  player={redPlayer}  score={session.red_score}
          isCurrent={isBothActive || session.current_team === "red"}  speedMode={isBothActive} />
      </div>

      {/* Round progress (rounds mode) */}
      {session.game_mode === "rounds" && session.total_rounds > 0 && (
        <div className="text-center mb-3">
          <span className="text-sm font-medium text-gray-500">
            Ronda {session.current_round + 1} / {session.total_rounds}
          </span>
          <div className="h-1.5 bg-gray-200 rounded-full mt-1.5 overflow-hidden">
            <div className="h-full bg-teal-500 rounded-full transition-all"
              style={{ width: `${(session.current_round / session.total_rounds) * 100}%` }} />
          </div>
        </div>
      )}

      {/* Timer */}
      {hasTimer && (
        <div className="mb-4 px-2">
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
          speedMode={isBothActive}
        />
      ) : (
        <QuestionDisplay
          text={(p as MCProblemData).text}
          options={(p as MCProblemData).options}
          className="mb-4"
        />
      )}

      {/* Tug of war */}
      <div className="h-56 md:h-72 mt-4">
        <TugOfWar blueScore={session.blue_score} redScore={session.red_score} maxScore={session.winning_score} />
      </div>
    </div>
  )
}

function ScorePanel({ team, player, score, isCurrent, speedMode = false }: {
  team: Team; player?: PlayerRow; score: number; isCurrent: boolean; speedMode?: boolean
}) {
  const isBlue = team === "blue"
  return (
    <div className={`
      ${isBlue ? "bg-blue-500" : "bg-red-600"}
      ${isCurrent ? "ring-4 ring-yellow-400" : ""}
      rounded-2xl p-4 md:p-6 text-white shadow-lg transition-all
    `}>
      <p className="text-xs md:text-sm uppercase opacity-90">
        {isBlue ? "Azul" : "Rojo"} {!speedMode && isCurrent && "· su turno"}
        {speedMode && "⚡"}
      </p>
      <p className="text-xl md:text-2xl font-bold mt-1 truncate">{player?.nickname ?? "—"}</p>
      <p className="text-3xl md:text-4xl font-bold mt-2">{score}</p>
    </div>
  )
}

function FinishedScreen({ session, bluePlayer, redPlayer }: {
  session: SessionRow; bluePlayer?: PlayerRow; redPlayer?: PlayerRow
}) {
  const router = useRouter()
  const winner      = session.winner
  const winnerPlayer = winner === "blue" ? bluePlayer : redPlayer
  const winnerLabel  = winner === "blue" ? "Equipo Azul 🔵" : winner === "red" ? "Equipo Rojo 🔴" : null

  return (
    <div className="text-center">
      {winnerLabel ? (
        <>
          <h2 className="text-4xl md:text-5xl font-bold text-gray-800 mb-3">🎉 ¡{winnerLabel} gana!</h2>
          {winnerPlayer && <p className="text-xl text-gray-600 mb-2">{winnerPlayer.nickname}</p>}
        </>
      ) : (
        <h2 className="text-4xl md:text-5xl font-bold text-gray-800 mb-3">🤝 ¡Empate!</h2>
      )}
      <p className="text-gray-500 mb-8">Azul {session.blue_score} · Rojo {session.red_score}</p>
      <button onClick={() => router.push("/teacher/dashboard")}
        className="rounded-xl bg-linear-to-r from-blue-500 to-red-500 hover:opacity-90 text-white font-bold px-8 py-4 text-lg shadow-lg">
        Nuevo duelo →
      </button>
    </div>
  )
}
