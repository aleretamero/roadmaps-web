import { MutationCache, QueryCache, QueryClient } from '@tanstack/react-query'
import { ApiError } from './errors'

type Options = {
  /** Chamado quando a API responde 401 (sessão expirada). */
  onUnauthorized?: () => void
}

/** Só tenta de novo quando a falha foi de rede ou do servidor, nunca em 4xx. */
function shouldRetry(failureCount: number, error: unknown) {
  if (error instanceof ApiError && error.status >= 400 && error.status < 500)
    return false
  return failureCount < 2
}

export function createQueryClient({ onUnauthorized }: Options = {}) {
  const handle = (error: unknown) => {
    if (error instanceof ApiError && error.status === 401) onUnauthorized?.()
  }
  return new QueryClient({
    queryCache: new QueryCache({ onError: handle }),
    mutationCache: new MutationCache({ onError: handle }),
    defaultOptions: {
      queries: { staleTime: 30_000, retry: shouldRetry },
      mutations: { retry: false },
    },
  })
}
