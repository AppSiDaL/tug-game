import Link from "next/link"
import { redirect } from "next/navigation"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { CATEGORY_META, MODE_META, type Category, type GameMode, type SessionRow } from "@/lib/supabase/types"
import { signOutAction } from "../actions"
import { NewSessionForm } from "./new-session-form"

export const dynamic = "force-dynamic"

export default async function TeacherDashboardPage() {
  const supabase = await createSupabaseServerClient()
  const { data: userData } = await supabase.auth.getUser()
  if (!userData.user) redirect("/teacher/login")

  const { data: sessions } = await supabase
    .from("sessions")
    .select("*")
    .eq("teacher_id", userData.user.id)
    .order("created_at", { ascending: false })
    .limit(20)

  return (
    <main className="min-h-screen bg-linear-to-br from-blue-50 via-white to-red-50 p-6">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Mis duelos</h1>
            <p className="text-sm text-gray-500">{userData.user.email}</p>
          </div>
          <form action={signOutAction}>
            <button type="submit" className="text-sm text-gray-500 hover:text-gray-800 underline">
              Cerrar sesión
            </button>
          </form>
        </div>

        <h2 className="text-lg font-semibold text-gray-700 mb-3">Nuevo duelo</h2>
        <NewSessionForm />

        <h2 className="text-lg font-semibold text-gray-700 mb-3">Recientes</h2>
        <div className="flex flex-col gap-2">
          {(sessions ?? []).length === 0 && (
            <p className="text-gray-400 text-sm">Aún no has creado duelos.</p>
          )}
          {(sessions as SessionRow[] | null)?.map((s) => {
            const cat  = CATEGORY_META[s.category as Category]  ?? { emoji: "?", label: s.category }
            const mode = MODE_META[s.game_mode as GameMode]      ?? { emoji: "?", label: s.game_mode }
            return (
              <Link
                key={s.id}
                href={`/teacher/session/${s.code}`}
                className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow p-4 flex items-center justify-between"
              >
                <div className="flex flex-col gap-1">
                  <span className="font-mono font-bold text-xl tracking-widest text-gray-800">
                    {s.code}
                  </span>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-medium bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                      {cat.emoji} {cat.label}
                    </span>
                    <span className="text-xs font-medium bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                      {mode.emoji} {mode.label}
                    </span>
                    <span className="text-xs text-gray-400">
                      {new Date(s.created_at).toLocaleString()}
                    </span>
                  </div>
                </div>
                <span className={statusBadgeClass(s.status)}>{statusLabel(s.status)}</span>
              </Link>
            )
          })}
        </div>
      </div>
    </main>
  )
}

function statusLabel(status: SessionRow["status"]): string {
  switch (status) {
    case "waiting":  return "Esperando"
    case "active":   return "En curso"
    case "finished": return "Finalizado"
  }
}

function statusBadgeClass(status: SessionRow["status"]): string {
  const base = "text-xs font-medium px-3 py-1 rounded-full shrink-0"
  switch (status) {
    case "waiting":  return `${base} bg-yellow-100 text-yellow-800`
    case "active":   return `${base} bg-green-100 text-green-800`
    case "finished": return `${base} bg-gray-100 text-gray-600`
  }
}
