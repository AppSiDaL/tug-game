"use server"

import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"
import { createSupabaseServerClient } from "@/lib/supabase/server"

export async function createSessionAction(formData: FormData) {
  const supabase = await createSupabaseServerClient()
  const { data: userData } = await supabase.auth.getUser()
  if (!userData.user) redirect("/teacher/login")

  const category          = String(formData.get("category")          ?? "math")
  const gameMode          = String(formData.get("game_mode")         ?? "turns")
  const timePerQuestion   = Number(formData.get("time_per_question") ?? 0)
  const totalRounds       = Number(formData.get("total_rounds")      ?? 0)

  const { data, error } = await supabase.rpc("create_session", {
    p_game_mode:         gameMode,
    p_category:          category,
    p_time_per_question: timePerQuestion,
    p_total_rounds:      totalRounds,
  })
  if (error || !data) throw new Error(error?.message ?? "could_not_create_session")
  redirect(`/teacher/session/${data.code}`)
}

export async function startSessionAction(sessionId: string, code: string) {
  const supabase = await createSupabaseServerClient()
  const { error } = await supabase.rpc("start_session", { p_session_id: sessionId })
  if (error) throw new Error(error.message)
  revalidatePath(`/teacher/session/${code}`)
}

export async function endSessionAction(sessionId: string, code: string) {
  const supabase = await createSupabaseServerClient()
  const { error } = await supabase.rpc("end_session", { p_session_id: sessionId })
  if (error) throw new Error(error.message)
  revalidatePath(`/teacher/session/${code}`)
  revalidatePath("/teacher/dashboard")
}

export async function signOutAction() {
  const supabase = await createSupabaseServerClient()
  await supabase.auth.signOut()
  redirect("/")
}
