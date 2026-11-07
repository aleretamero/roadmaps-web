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
    onSuccess: () => invalidateStudy(qc),
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
    onSuccess: (data) => {
      qc.setQueryData(keys.topics.detail(topicId), data)
      invalidateStudy(qc, topicId)
    },
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

/** Confere uma importação sem gravar (`?dryRun=true`). Lança `ApiError` com os erros por campo. */
export function importDryRun(
  target:
    | { roadmapId: number; body: Schemas['ImportModulesRequest'] }
    | { roadmapId?: undefined; body: Schemas['ImportRoadmapRequest'] },
) {
  return target.roadmapId === undefined
    ? unwrap(
        api.POST('/roadmaps/import', {
          params: { query: { dryRun: true } },
          body: target.body,
        }),
      )
    : unwrap(
        api.POST('/roadmaps/{id}/import', {
          params: { path: { id: target.roadmapId }, query: { dryRun: true } },
          body: target.body,
        }),
      )
}

/** Adiciona módulos (com tópicos) a um roadmap existente. */
export function useImportIntoRoadmap(roadmapId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: Schemas['ImportModulesRequest']) =>
      unwrap(
        api.POST('/roadmaps/{id}/import', {
          params: { path: { id: roadmapId } },
          body,
        }),
      ),
    onSuccess: () => invalidateStudy(qc),
  })
}

export function useChoosePath(roadmapId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      branchModuleId,
      chosenModuleId,
    }: {
      branchModuleId: number
      chosenModuleId: number
    }) =>
      unwrap(
        api.PUT('/roadmaps/{id}/path-choices/{branchModuleId}', {
          params: { path: { id: roadmapId, branchModuleId } },
          body: { chosenModuleId },
        }),
      ),
    onSuccess: () => invalidateStudy(qc),
  })
}

type RoadmapDetail = Schemas['RoadmapDetail']

/**
 * Mudanças de ordem no roadmap (tópicos, módulos, mover entre módulos) com
 * atualização otimista: a lista muda na hora e volta se a API recusar.
 */
export function useRoadmapReorder(roadmapId: number) {
  const qc = useQueryClient()
  const key = roadmapQuery(roadmapId).queryKey
  return useMutation({
    mutationFn: async (change: {
      next: RoadmapDetail
      call:
        | { kind: 'topics'; moduleId: number; ids: Array<number> }
        | { kind: 'modules'; ids: Array<number> }
        | { kind: 'move'; topicId: number; moduleId: number; position: number }
    }) => {
      const c = change.call
      if (c.kind === 'topics')
        return unwrap(
          api.PUT('/modules/{id}/topics/order', {
            ...id(c.moduleId),
            body: { ids: c.ids },
          }),
        )
      if (c.kind === 'modules')
        return unwrap(
          api.PUT('/roadmaps/{id}/modules/order', {
            ...id(roadmapId),
            body: { ids: c.ids },
          }),
        )
      return unwrap(
        api.POST('/topics/{id}/move', {
          ...id(c.topicId),
          body: { moduleId: c.moduleId, position: c.position },
        }),
      )
    },
    onMutate: async ({ next }) => {
      await qc.cancelQueries({ queryKey: key })
      const previous = qc.getQueryData(key)
      qc.setQueryData(key, next)
      return { previous }
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.previous) qc.setQueryData(key, ctx.previous)
    },
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: key })
      void qc.invalidateQueries({ queryKey: keys.modules.all })
      void qc.invalidateQueries({ queryKey: keys.dashboard.all })
    },
  })
}

export function useUpdateModule(moduleId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: Schemas['UpdateModuleRequest']) =>
      unwrap(api.PATCH('/modules/{id}', { ...id(moduleId), body })),
    onSuccess: (data) => {
      qc.setQueryData(keys.modules.detail(moduleId), data)
      invalidateStudy(qc)
    },
  })
}

export function useReopenTopic(topicId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (stage: Schemas['Stage']) =>
      unwrap(
        api.POST('/topics/{id}/reopen', { ...id(topicId), body: { stage } }),
      ),
    onSuccess: (data) => {
      qc.setQueryData(keys.topics.detail(topicId), data)
      invalidateStudy(qc, topicId)
    },
  })
}

export function useAddScheduleEntry(topicId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (date: string) =>
      unwrap(
        api.POST('/topics/{id}/schedule-entries', {
          ...id(topicId),
          body: { date },
        }),
      ),
    onSuccess: () => invalidateStudy(qc, topicId),
  })
}

export function useDeleteScheduleEntry(topicId?: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (entryId: number) =>
      unwrap(api.DELETE('/schedule-entries/{id}', id(entryId))),
    onSuccess: () => invalidateStudy(qc, topicId),
  })
}
