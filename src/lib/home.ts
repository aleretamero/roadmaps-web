import type { Schemas } from '@/lib/api/client'

type HomePage = Schemas['Preferences']['homePage']

/** Rota da "página inicial" escolhida nas preferências. */
export function homePath(page: HomePage | undefined) {
  if (page === 'roadmaps') return '/roadmaps' as const
  if (page === 'schedule') return '/schedule' as const
  return '/dashboard' as const
}
