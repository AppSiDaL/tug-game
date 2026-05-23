import { notFound, redirect } from "next/navigation"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import type { PlayerRow, SessionRow } from "@/lib/supabase/types"
import { PresenterView } from "./presenter-view"

export const dynamic = "force-dynamic"

export default async function TeacherSessionPage({
  params,
}: {
  params: Promise<{ code: string }>
}) {
  const { code: rawCode } = await params
  const code = rawCode.toUpperCase()

  const supabase = await createSupabaseServerClient()
  const { data: userData } = await supabase.auth.getUser()
  if (!userData.user) redirect("/teacher/login")

  const { data: session, error } = await supabase
    .from("sessions")
    .select("*")
    .eq("code", code)
    .single()
  if (error || !session) notFound()
  if (session.teacher_id !== userData.user.id) redirect("/teacher/dashboard")

  const { data: players } = await supabase
    .from("players")
    .select("*")
    .eq("session_id", session.id)
    .order("joined_at", { ascending: true })

  return (
    <PresenterView
      initialSession={session as SessionRow}
      initialPlayers={(players as PlayerRow[]) ?? []}
    />
  )
}
