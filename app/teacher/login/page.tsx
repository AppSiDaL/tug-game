import { redirect } from "next/navigation"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { LoginForm } from "./login-form"

export default async function TeacherLoginPage() {
  const supabase = await createSupabaseServerClient()
  const { data } = await supabase.auth.getUser()
  if (data.user) {
    redirect("/teacher/dashboard")
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-6 bg-linear-to-br from-blue-50 via-white to-red-50">
      <LoginForm />
    </main>
  )
}
