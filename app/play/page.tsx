import Link from "next/link"
import { JoinForm } from "./join-form"

export default function PlayJoinPage() {
  return (
    <main className="min-h-screen flex items-center justify-center p-6 bg-linear-to-br from-blue-50 via-white to-red-50">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl p-8">
        <Link href="/" className="text-sm text-gray-500 hover:text-gray-700">
          ← Volver
        </Link>
        <h1 className="text-2xl font-bold text-gray-800 mt-3 mb-1">
          Unirse a un duelo
        </h1>
        <p className="text-sm text-gray-500 mb-6">
          Ingresa el código que aparece en la pantalla del profesor.
        </p>
        <JoinForm />
      </div>
    </main>
  )
}
