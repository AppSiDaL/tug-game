"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { createSupabaseBrowserClient } from "@/lib/supabase/client"

type Mode = "signin" | "signup"

export function LoginForm() {
  const router = useRouter()
  const [mode, setMode] = useState<Mode>("signin")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setInfo(null)
    startTransition(async () => {
      const supabase = createSupabaseBrowserClient()
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) {
          setError(error.message)
          return
        }
        router.refresh()
        router.push("/teacher/dashboard")
      } else {
        const { data, error } = await supabase.auth.signUp({ email, password })
        if (error) {
          setError(error.message)
          return
        }
        if (data.session) {
          router.refresh()
          router.push("/teacher/dashboard")
        } else {
          setInfo("Revisa tu email para confirmar la cuenta y luego inicia sesión.")
        }
      }
    })
  }

  return (
    <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">
      <Link href="/" className="text-sm text-gray-500 hover:text-gray-700">
        ← Volver
      </Link>
      <h1 className="text-2xl font-bold text-gray-800 mt-3 mb-1">
        {mode === "signin" ? "Iniciar sesión" : "Crear cuenta de profesor"}
      </h1>
      <p className="text-sm text-gray-500 mb-6">
        Necesitas una cuenta para crear y presentar duelos.
      </p>

      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium text-gray-700">Email</span>
          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium text-gray-700">Contraseña</span>
          <input
            type="password"
            required
            minLength={6}
            autoComplete={mode === "signin" ? "current-password" : "new-password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </label>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
        )}
        {info && (
          <p className="text-sm text-blue-700 bg-blue-50 rounded-lg px-3 py-2">{info}</p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 transition-colors disabled:opacity-50"
        >
          {pending
            ? "..."
            : mode === "signin"
            ? "Iniciar sesión"
            : "Crear cuenta"}
        </button>
      </form>

      <button
        type="button"
        onClick={() => {
          setMode(mode === "signin" ? "signup" : "signin")
          setError(null)
          setInfo(null)
        }}
        className="mt-4 w-full text-sm text-blue-600 hover:underline"
      >
        {mode === "signin"
          ? "¿No tienes cuenta? Crear una"
          : "¿Ya tienes cuenta? Iniciar sesión"}
      </button>
    </div>
  )
}
