import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { LandingPage } from '@/features/landing/LandingPage'
import { META } from '@/features/landing/content'
import { meQuery, preferencesQuery } from '@/lib/api/queries'
import { homePath } from '@/lib/home'

export const Route = createFileRoute('/')({
  head: () => ({
    meta: [
      { title: META.title },
      { name: 'description', content: META.description },
      { property: 'og:type', content: 'website' },
      { property: 'og:title', content: META.title },
      { property: 'og:description', content: META.description },
      { property: 'og:locale', content: 'pt_BR' },
      { name: 'twitter:card', content: 'summary' },
    ],
  }),
  component: Home,
})

/** Quem já tem sessão vai direto para a página inicial das preferências. */
function useRedirectWhenLoggedIn() {
  const qc = useQueryClient()
  const navigate = useNavigate()
  useEffect(() => {
    let cancelled = false
    qc.fetchQuery(meQuery())
      .then(() => qc.fetchQuery(preferencesQuery()))
      .then((prefs) => {
        if (!cancelled)
          void navigate({ to: homePath(prefs.homePage), replace: true })
      })
      .catch(() => {
        /* sem sessão: fica na landing */
      })
    return () => {
      cancelled = true
    }
  }, [qc, navigate])
}

function Home() {
  useRedirectWhenLoggedIn()
  return <LandingPage />
}
