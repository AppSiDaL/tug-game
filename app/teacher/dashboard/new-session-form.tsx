"use client"

import { useState, useTransition } from "react"
import { CATEGORY_META, MODE_META, type Category, type GameMode } from "@/lib/supabase/types"
import { createSessionAction } from "../actions"

const CATEGORIES = Object.entries(CATEGORY_META) as [Category, typeof CATEGORY_META[Category]][]
const MODES      = Object.entries(MODE_META)     as [GameMode, typeof MODE_META[GameMode]][]

const TIME_OPTIONS   = [10, 15, 20, 30]
const ROUNDS_OPTIONS = [5, 10, 15, 20]

export function NewSessionForm() {
  const [category, setCategory]   = useState<Category>("math")
  const [mode, setMode]           = useState<GameMode>("turns")
  const [timePerQ, setTimePerQ]   = useState(15)
  const [totalRounds, setTotalR]  = useState(10)
  const [pending, startTransition] = useTransition()
  const [error, setError]          = useState<string | null>(null)

  const needsTimer  = mode === "countdown" || mode === "rounds"
  const needsRounds = mode === "rounds"

  const handleCreate = () => {
    setError(null)
    startTransition(async () => {
      const fd = new FormData()
      fd.append("category",           category)
      fd.append("game_mode",          mode)
      fd.append("time_per_question",  String(needsTimer  ? timePerQ    : 0))
      fd.append("total_rounds",       String(needsRounds ? totalRounds : 0))
      try {
        await createSessionAction(fd)
      } catch (e) {
        setError((e as Error).message)
      }
    })
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-10">
      {/* CATEGORY */}
      <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">Categoría</p>
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mb-6">
        {CATEGORIES.map(([slug, meta]) => (
          <button
            key={slug}
            type="button"
            onClick={() => setCategory(slug)}
            className={`
              flex flex-col items-center gap-1 rounded-xl py-3 px-1 border-2 transition-all text-sm font-medium
              ${category === slug
                ? `${meta.color} text-white border-transparent shadow-md scale-105`
                : "bg-gray-50 text-gray-600 border-gray-200 hover:border-gray-300"}
            `}
          >
            <span className="text-2xl">{meta.emoji}</span>
            <span className="text-xs leading-tight text-center">{meta.label.split(" ")[0]}</span>
          </button>
        ))}
      </div>

      {/* MODE */}
      <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">Modo de juego</p>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-5">
        {MODES.map(([slug, meta]) => (
          <button
            key={slug}
            type="button"
            onClick={() => setMode(slug)}
            className={`
              rounded-xl p-3 border-2 text-left transition-all
              ${mode === slug
                ? "border-indigo-500 bg-indigo-50 text-indigo-800"
                : "border-gray-200 bg-gray-50 text-gray-600 hover:border-gray-300"}
            `}
          >
            <p className="text-xl mb-1">{meta.emoji}</p>
            <p className="font-bold text-sm">{meta.label}</p>
            <p className="text-xs mt-0.5 opacity-70 leading-tight">{meta.description}</p>
          </button>
        ))}
      </div>

      {/* TIMER (countdown/rounds) */}
      {needsTimer && (
        <div className="mb-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
            Segundos por pregunta
          </p>
          <div className="flex gap-2">
            {TIME_OPTIONS.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTimePerQ(t)}
                className={`
                  rounded-lg px-4 py-2 text-sm font-bold border-2 transition-all
                  ${timePerQ === t
                    ? "border-orange-500 bg-orange-50 text-orange-700"
                    : "border-gray-200 bg-gray-50 text-gray-600 hover:border-gray-300"}
                `}
              >
                {t}s
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ROUNDS */}
      {needsRounds && (
        <div className="mb-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
            Número de rondas
          </p>
          <div className="flex gap-2">
            {ROUNDS_OPTIONS.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setTotalR(r)}
                className={`
                  rounded-lg px-4 py-2 text-sm font-bold border-2 transition-all
                  ${totalRounds === r
                    ? "border-teal-500 bg-teal-50 text-teal-700"
                    : "border-gray-200 bg-gray-50 text-gray-600 hover:border-gray-300"}
                `}
              >
                {r}
              </button>
            ))}
          </div>
        </div>
      )}

      {error && (
        <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2 mb-3">{error}</p>
      )}

      <button
        type="button"
        disabled={pending}
        onClick={handleCreate}
        className="w-full rounded-xl bg-linear-to-r from-blue-500 to-red-500 hover:opacity-90 text-white font-bold py-3.5 text-base shadow-lg transition-opacity disabled:opacity-50"
      >
        {pending ? "Creando…" : `➕ Crear duelo · ${CATEGORY_META[category].emoji} ${MODE_META[mode].emoji}`}
      </button>
    </div>
  )
}
