"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { createSupabaseBrowserClient } from "@/lib/supabase/client"

export function LoginForm() {
  const router = useRouter()
  const [name, setName] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  const trimmed = name.trim()
  const isValid = trimmed.length >= 2 && trimmed.length <= 30

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!isValid) return
    setError(null)
    startTransition(async () => {
      const supabase = createSupabaseBrowserClient()
      const { data, error } = await supabase.auth.signInAnonymously()
      if (error || !data?.user) {
        setError(error?.message ?? "No se pudo iniciar la sesión.")
        return
      }
      const { error: updateError } = await supabase.auth.updateUser({
        data: { name: trimmed },
      })
      if (updateError) {
        console.warn("No se pudo guardar el nombre:", updateError.message)
      }
      router.refresh()
      router.push("/teacher/dashboard")
    })
  }

  return (
    <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">
      <Link href="/" className="text-sm text-gray-500 hover:text-gray-700">
        ← Volver
      </Link>
      <h1 className="text-2xl font-bold text-gray-800 mt-3 mb-1">
        Entrar como profesor
      </h1>
      <p className="text-sm text-gray-500 mb-6">
        Escribe tu nombre para crear y presentar duelos.
      </p>

      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium text-gray-700">Tu nombre</span>
          <input
            type="text"
            required
            minLength={2}
            maxLength={30}
            autoComplete="name"
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ej. Ana"
            className="rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </label>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
        )}

        <button
          type="submit"
          disabled={pending || !isValid}
          className="rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 transition-colors disabled:opacity-50"
        >
          {pending ? "..." : "Entrar"}
        </button>
      </form>
    </div>
  )
}
