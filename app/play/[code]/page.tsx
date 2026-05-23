import { notFound } from "next/navigation"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import type { PlayerRow, SessionRow } from "@/lib/supabase/types"
import { PlayerView } from "./player-view"

export const dynamic = "force-dynamic"

export default async function PlayGamePage({
  params,
}: {
  params: Promise<{ code: string }>
}) {
  const { code: rawCode } = await params
  const code = rawCode.toUpperCase()

  const supabase = await createSupabaseServerClient()

  const { data: session, error } = await supabase
    .from("sessions")
    .select("*")
    .eq("code", code)
    .single()

  if (error || !session) notFound()

  const { data: players } = await supabase
    .from("players")
    .select("*")
    .eq("session_id", session.id)
    .order("joined_at", { ascending: true })

  return (
    <PlayerView
      initialSession={session as SessionRow}
      initialPlayers={(players as PlayerRow[]) ?? []}
    />
  )
}
