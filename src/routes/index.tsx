import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/')({ component: Home })

function Home() {
  return (
    <main className="mx-auto max-w-3xl p-8">
      <h1 className="text-4xl font-bold">Roadmaps</h1>
      <p className="mt-4 text-lg text-ink-muted">
        Organize o que você quer aprender em módulos e tópicos.
      </p>
    </main>
  )
}
