"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { createSupabaseBrowserClient } from "@/lib/supabase/client"
import { normalizeSessionCode, SESSION_CODE_LENGTH } from "@/lib/game/code"

export function JoinForm() {
  const router = useRouter()
  const [code, setCode] = useState("")
  const [nickname, setNickname] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    const cleanCode = normalizeSessionCode(code)
    const cleanNick = nickname.trim()

    if (cleanCode.length !== SESSION_CODE_LENGTH) {
      setError(`El código debe tener ${SESSION_CODE_LENGTH} caracteres.`)
      return
    }
    if (cleanNick.length === 0) {
      setError("Escribe tu nombre.")
      return
    }

    startTransition(async () => {
      const supabase = createSupabaseBrowserClient()
      const { data, error: rpcError } = await supabase.rpc("join_session", {
        p_code: cleanCode,
        p_nickname: cleanNick,
      })

      if (rpcError) {
        const msg = rpcError.message
        if (msg.includes("invalid_session")) setError("Código incorrecto o sesión ya iniciada.")
        else if (msg.includes("session_not_waiting")) setError("El duelo ya comenzó, no se puede unir.")
        else if (msg.includes("session_full")) setError("El duelo ya tiene dos jugadores.")
        else setError(`Error: ${msg}`)
        return
      }

      const { player_id, code: sessionCode } = data as { player_id: string; code: string; team: string }
      localStorage.setItem(`tug:${sessionCode}`, player_id)
      router.push(`/play/${sessionCode}`)
    })
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium text-gray-700">Código del duelo</span>
        <input
          type="text"
          required
          maxLength={SESSION_CODE_LENGTH}
          placeholder="EJ: K7M3X9"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          className="rounded-lg border border-gray-300 px-3 py-2 font-mono text-xl tracking-widest uppercase focus:outline-none focus:ring-2 focus:ring-blue-400 text-center"
        />
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium text-gray-700">Tu nombre</span>
        <input
          type="text"
          required
          maxLength={24}
          placeholder="Ej: Ana"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
      </label>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold py-2.5 transition-colors disabled:opacity-50"
      >
        {pending ? "Uniéndome…" : "Entrar al duelo"}
      </button>
    </form>
  )
}
