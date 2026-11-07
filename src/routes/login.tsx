import { createFileRoute } from '@tanstack/react-router'
import { LogoMark } from '@/components/Logo'
import { safeRedirect } from '@/lib/redirect'

type LoginSearch = { redirect?: string }

// Tela provisória do shell (FS10): recebe o `redirect` da guarda de rota.
// Os provedores e o fluxo de entrar chegam na FU02.
export const Route = createFileRoute('/login')({
  validateSearch: (search: Record<string, unknown>): LoginSearch => {
    const redirect = safeRedirect(search.redirect)
    return redirect ? { redirect } : {}
  },
  component: Login,
})

function Login() {
  return (
    <main className="grid min-h-dvh place-items-center bg-canvas px-4">
      <div className="w-full max-w-sm rounded-xl border border-line bg-surface p-8 text-center">
        <LogoMark className="mx-auto text-ink-strong" />
        <h1 className="mt-4 text-2xl font-semibold text-ink-strong">Entrar</h1>
        <p className="mt-2 text-ink-muted">Entre para ver seus roadmaps.</p>
      </div>
    </main>
  )
}
