import Link from "next/link"

export default function Home() {
  return (
    <main className="min-h-screen bg-linear-to-br from-blue-50 via-white to-red-50 flex items-center justify-center p-6">
      <div className="w-full max-w-md text-center">
        <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-3">
          🎮 Jalar la Cuerda
        </h1>
        <p className="text-gray-600 mb-10">
          Duelo de matemáticas 1 vs 1 en tiempo real.
        </p>

        <div className="flex flex-col gap-4">
          <Link
            href="/teacher/login"
            className="w-full rounded-xl bg-linear-to-r from-blue-500 to-blue-600 hover:opacity-90 text-white font-bold py-4 text-lg shadow-lg transition-opacity"
          >
            👩‍🏫 Soy profesor
          </Link>
          <Link
            href="/play"
            className="w-full rounded-xl bg-linear-to-r from-red-500 to-red-600 hover:opacity-90 text-white font-bold py-4 text-lg shadow-lg transition-opacity"
          >
            🎒 Unirme con código
          </Link>
        </div>
      </div>
    </main>
  )
}
