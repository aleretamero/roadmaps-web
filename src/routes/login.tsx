import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { LoginCard } from '@/features/auth/LoginCard'
import { preferencesQuery } from '@/lib/api/queries'
import { AUTH_PROVIDERS, startLogin } from '@/lib/auth'
import type { AuthProvider } from '@/lib/auth'
import { homePath } from '@/lib/home'
import { safeRedirect } from '@/lib/redirect'
import { useRedirectWhenLoggedIn } from '@/lib/useRedirectWhenLoggedIn'

type LoginSearch = { redirect?: string; error?: string }

/** Erros que o callback do OAuth devolve em `?error=`. */
const ERRORS: Record<string, string> = {
  access_denied:
    'Não foi possível entrar: a autorização foi cancelada no GitHub. Tente de novo.',
}
const GENERIC_ERROR = 'Não foi possível entrar agora. Tente de novo.'

export const Route = createFileRoute('/login')({
  validateSearch: (search: Record<string, unknown>): LoginSearch => {
    const redirect = safeRedirect(search.redirect)
    const error = typeof search.error === 'string' ? search.error : undefined
    return { ...(redirect ? { redirect } : {}), ...(error ? { error } : {}) }
  },
  head: () => ({ meta: [{ title: 'Entrar · Roadmaps' }] }),
  component: Login,
})

function Login() {
  const search = Route.useSearch()
  // Confere de novo: o Router mantém na busca chaves que o validateSearch descartou.
  const redirect = safeRedirect(search.redirect)
  const error = search.error
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [busy, setBusy] = useState<AuthProvider | null>(null)
  const [failed, setFailed] = useState(false)
  useRedirectWhenLoggedIn(redirect)

  const login = async (provider: AuthProvider) => {
    setBusy(provider)
    setFailed(false)
    try {
      const navigateHere = await startLogin(provider, redirect)
      if (!navigateHere) return // o navegador já está indo para o provedor
      const target =
        redirect ?? homePath((await qc.fetchQuery(preferencesQuery())).homePage)
      await navigate({ href: target, replace: true })
    } catch {
      setFailed(true)
      setBusy(null)
    }
  }

  const message = failed
    ? GENERIC_ERROR
    : error
      ? (ERRORS[error] ?? GENERIC_ERROR)
      : null

  return (
    <LoginCard
      providers={AUTH_PROVIDERS}
      busy={busy}
      error={message}
      onLogin={(p) => void login(p)}
    />
  )
}
