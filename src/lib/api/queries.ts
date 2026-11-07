import {
  queryOptions,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query'
import type { QueryClient } from '@tanstack/react-query'
import { api, unwrap } from './client'
import type { Schemas } from './client'
import { keys } from './keys'

/*
 * Leituras: `queryOptions` para usar tanto em `useQuery`/`useSuspenseQuery`
 * quanto no `loader` das rotas (`queryClient.ensureQueryData(...)`).
 */

const id = (n: number) => ({ params: { path: { id: n } } })

export const meQuery = () =>
  queryOptions({
    queryKey: keys.me,
    queryFn: () => unwrap(api.GET('/me')),
    staleTime: 5 * 60_000,
    // A guarda da rota `_app` trata o 401 do /me com o `redirect` certo.
    meta: { handlesUnauthorized: true },
  })

export const preferencesQuery = () =>
  queryOptions({
    queryKey: keys.preferences,
    queryFn: () => unwrap(api.GET('/me/preferences')),
  })

export const dashboardQuery = () =>
  queryOptions({
    queryKey: keys.dashboard.summary(),
    queryFn: () => unwrap(api.GET('/dashboard')),
  })

export const activityQuery = (weeks = 24) =>
  queryOptions({
    queryKey: keys.dashboard.activity(weeks),
    queryFn: () =>
      unwrap(api.GET('/dashboard/activity', { params: { query: { weeks } } })),
  })

export const roadmapsQuery = (archived = false) =>
  queryOptions({
    queryKey: keys.roadmaps.list(archived),
    queryFn: () =>
      unwrap(api.GET('/roadmaps', { params: { query: { archived } } })),
  })

export const roadmapQuery = (roadmapId: number) =>
  queryOptions({
    queryKey: keys.roadmaps.detail(roadmapId),
    queryFn: () => unwrap(api.GET('/roadmaps/{id}', id(roadmapId))),
  })

export const roadmapProgressQuery = (roadmapId: number) =>
  queryOptions({
    queryKey: keys.roadmaps.progress(roadmapId),
    queryFn: () => unwrap(api.GET('/roadmaps/{id}/progress', id(roadmapId))),
  })

export const moduleQuery = (moduleId: number) =>
  queryOptions({
    queryKey: keys.modules.detail(moduleId),
    queryFn: () => unwrap(api.GET('/modules/{id}', id(moduleId))),
  })

export const topicQuery = (topicId: number) =>
  queryOptions({
    queryKey: keys.topics.detail(topicId),
    queryFn: () => unwrap(api.GET('/topics/{id}', id(topicId))),
  })

export const topicTimelineQuery = (
  topicId: number,
  type: 'sessions' | 'changes',
) =>
  queryOptions({
    queryKey: keys.topics.timeline(topicId, type),
    queryFn: () =>
      unwrap(
        api.GET('/topics/{id}/timeline', {
          params: { path: { id: topicId }, query: { type } },
        }),
      ),
  })

export const moduleTimelineQuery = (
  moduleId: number,
  type: 'progress' | 'changes',
) =>
  queryOptions({
    queryKey: keys.modules.timeline(moduleId, type),
    queryFn: () =>
      unwrap(
        api.GET('/modules/{id}/timeline', {
          params: { path: { id: moduleId }, query: { type } },
        }),
      ),
  })

export const topicNotesQuery = (topicId: number) =>
  queryOptions({
    queryKey: keys.topics.notes(topicId),
    queryFn: () => unwrap(api.GET('/topics/{id}/notes', id(topicId))),
  })

export const moduleNotesQuery = (moduleId: number) =>
  queryOptions({
    queryKey: keys.modules.notes(moduleId),
    queryFn: () => unwrap(api.GET('/modules/{id}/notes', id(moduleId))),
  })

export const resourcesQuery = (topicId: number) =>
  queryOptions({
    queryKey: keys.topics.resources(topicId),
    queryFn: () => unwrap(api.GET('/topics/{id}/resources', id(topicId))),
  })

export const filesQuery = (topicId: number) =>
  queryOptions({
    queryKey: keys.topics.files(topicId),
    queryFn: () => unwrap(api.GET('/topics/{id}/files', id(topicId))),
    retry: false,
  })

export const scheduleQuery = (from: string, to: string) =>
  queryOptions({
    queryKey: keys.schedule.range(from, to),
    queryFn: () =>
      unwrap(api.GET('/schedule', { params: { query: { from, to } } })),
  })

export const searchQuery = (q: string, type?: 'topics' | 'notes' | 'files') =>
  queryOptions({
    queryKey: keys.search(q, type),
    queryFn: () =>
      unwrap(api.GET('/search', { params: { query: { q, type } } })),
    enabled: q.trim().length >= 2,
  })

export const integrationsQuery = () =>
  queryOptions({
    queryKey: keys.integrations,
    queryFn: () => unwrap(api.GET('/integrations')),
  })

/*
 * Mutações: cada uma invalida o que a tela precisa recarregar.
 */

/** O que muda quando o estudo de um tópico muda (sessão, data, etapa). */
export function invalidateStudy(qc: QueryClient, topicId?: number) {
  void qc.invalidateQueries({ queryKey: keys.dashboard.all })
  void qc.invalidateQueries({ queryKey: keys.roadmaps.all })
  void qc.invalidateQueries({ queryKey: keys.modules.all })
  void qc.invalidateQueries({ queryKey: keys.schedule.all })
  void qc.invalidateQueries({ queryKey: keys.sessions.all })
  if (topicId !== undefined)
    void qc.invalidateQueries({ queryKey: keys.topics.detail(topicId) })
  void qc.invalidateQueries({ queryKey: keys.topics.all })
}

export function useRegisterSession(topicId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: Schemas['RegisterSessionRequest']) =>
      unwrap(api.POST('/topics/{id}/sessions', { ...id(topicId), body })),
    onSuccess: () => invalidateStudy(qc, topicId),
  })
}

export function useCreateRoadmap() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: Schemas['CreateRoadmapRequest']) =>
      unwrap(api.POST('/roadmaps', { body })),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.roadmaps.all }),
  })
}

export function useArchiveRoadmap() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      roadmapId,
      archive,
    }: {
      roadmapId: number
      archive: boolean
    }) =>
      unwrap(
        archive
          ? api.POST('/roadmaps/{id}/archive', id(roadmapId))
          : api.POST('/roadmaps/{id}/unarchive', id(roadmapId)),
      ),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: keys.roadmaps.all })
      void qc.invalidateQueries({ queryKey: keys.dashboard.all })
    },
  })
}

export function useDeleteRoadmap() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (roadmapId: number) =>
      unwrap(api.DELETE('/roadmaps/{id}', id(roadmapId))),
    onSuccess: (_data, roadmapId) => {
      qc.removeQueries({ queryKey: keys.roadmaps.detail(roadmapId) })
      invalidateStudy(qc)
    },
  })
}

export function useCreateTopics(moduleId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (topics: Array<Schemas['NewTopic']>) =>
      unwrap(
        api.POST('/modules/{id}/topics', { ...id(moduleId), body: { topics } }),
      ),
    onSuccess: () => invalidateStudy(qc),
  })
}

export function useUpdateTopic(topicId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: Schemas['UpdateTopicRequest']) =>
      unwrap(api.PATCH('/topics/{id}', { ...id(topicId), body })),
    onSuccess: () => invalidateStudy(qc, topicId),
  })
}

export function useUpdatePreferences() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: Schemas['Preferences']) =>
      unwrap(api.PUT('/me/preferences', { body })),
    onSuccess: (data) => qc.setQueryData(keys.preferences, data),
  })
}

/** Encerra a sessão e limpa o cache (nada da conta fica na tela depois de sair). */
export function useLogout() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => unwrap(api.POST('/auth/logout')),
    onSuccess: () => qc.clear(),
  })
}
