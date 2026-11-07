import { useNavigate } from '@tanstack/react-router'
import { useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { meQuery, preferencesQuery } from '@/lib/api/queries'
import { homePath } from '@/lib/home'

/**
 * Quem já tem sessão sai da landing/login: vai para `to` ou para a página
 * inicial das preferências. Roda só no cliente (a sessão vive no navegador).
 */
export function useRedirectWhenLoggedIn(to?: string) {
  const qc = useQueryClient()
  const navigate = useNavigate()
  useEffect(() => {
    let cancelled = false
    qc.fetchQuery(meQuery())
      .then(
        async () =>
          to ?? homePath((await qc.fetchQuery(preferencesQuery())).homePage),
      )
      .then((target) => {
        if (!cancelled) void navigate({ to: target, replace: true })
      })
      .catch(() => {
        /* sem sessão: fica na página */
      })
    return () => {
      cancelled = true
    }
  }, [qc, navigate, to])
}
