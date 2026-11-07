/**
 * Chaves do TanStack Query. Sempre use estas fábricas: invalidar `keys.roadmaps.all`
 * derruba listas e detalhes de roadmaps de uma vez.
 */
export const keys = {
  me: ['me'] as const,
  preferences: ['me', 'preferences'] as const,
  dashboard: {
    all: ['dashboard'] as const,
    summary: () => [...keys.dashboard.all, 'summary'] as const,
    activity: (weeks: number) =>
      [...keys.dashboard.all, 'activity', weeks] as const,
  },
  roadmaps: {
    all: ['roadmaps'] as const,
    list: (archived: boolean) =>
      [...keys.roadmaps.all, 'list', { archived }] as const,
    detail: (id: number) => [...keys.roadmaps.all, 'detail', id] as const,
    progress: (id: number) => [...keys.roadmaps.all, 'progress', id] as const,
    changelog: (id: number) => [...keys.roadmaps.all, 'changelog', id] as const,
  },
  modules: {
    all: ['modules'] as const,
    detail: (id: number) => [...keys.modules.all, 'detail', id] as const,
    timeline: (id: number, type: 'progress' | 'changes') =>
      [...keys.modules.all, 'timeline', id, type] as const,
    notes: (id: number) => [...keys.modules.all, 'notes', id] as const,
  },
  topics: {
    all: ['topics'] as const,
    detail: (id: number) => [...keys.topics.all, 'detail', id] as const,
    timeline: (id: number, type: 'sessions' | 'changes') =>
      [...keys.topics.all, 'timeline', id, type] as const,
    notes: (id: number) => [...keys.topics.all, 'notes', id] as const,
    resources: (id: number) => [...keys.topics.all, 'resources', id] as const,
    files: (id: number) => [...keys.topics.all, 'files', id] as const,
  },
  schedule: {
    all: ['schedule'] as const,
    range: (from: string, to: string) =>
      [...keys.schedule.all, from, to] as const,
  },
  sessions: {
    all: ['sessions'] as const,
    range: (from: string, to: string) =>
      [...keys.sessions.all, from, to] as const,
  },
  search: (q: string, type?: string) => ['search', q, type ?? 'all'] as const,
  integrations: ['integrations'] as const,
} as const
