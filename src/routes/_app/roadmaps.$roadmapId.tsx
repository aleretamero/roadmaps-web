import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useQuery, useSuspenseQuery } from '@tanstack/react-query'
import { PagePending, RouteError } from '@/components/RouteStates'
import { toast } from 'sonner'
import { AutoScheduleDialog } from '@/features/roadmap/AutoScheduleDialog'
import { ProgressTab } from '@/features/roadmap/ProgressTab'
import { RoadmapList } from '@/features/roadmap/RoadmapList'
import { RoadmapPage } from '@/features/roadmap/RoadmapPage'
import { errorMessage } from '@/lib/api/errors'
import {
  roadmapProgressQuery,
  roadmapQuery,
  useArchiveRoadmap,
  useChoosePath,
  useRoadmapReorder,
} from '@/lib/api/queries'

type RoadmapSearch = { view?: 'list'; tab?: 'progress'; auto?: 1 }

export const Route = createFileRoute('/_app/roadmaps/$roadmapId')({
  params: {
    parse: (p) => ({ roadmapId: p.roadmapId }),
  },
  validateSearch: (search: Record<string, unknown>): RoadmapSearch => ({
    ...(search.view === 'list' ? { view: 'list' as const } : {}),
    ...(search.tab === 'progress' ? { tab: 'progress' as const } : {}),
    ...(search.auto === 1 || search.auto === '1' ? { auto: 1 as const } : {}),
  }),
  loaderDeps: ({ search }) => ({ tab: search.tab }),
  loader: async ({ context, params, deps }) => {
    const id = Number(params.roadmapId)
    if (deps.tab === 'progress')
      void context.queryClient.prefetchQuery(roadmapProgressQuery(id))
    return context.queryClient.ensureQueryData(roadmapQuery(id))
  },
  head: ({ loaderData }) => ({
    meta: [
      {
        title: loaderData
          ? `${loaderData.name} · Roadmaps`
          : 'Roadmap · Roadmaps',
      },
    ],
  }),
  component: Roadmap,
})

function Roadmap() {
  const { roadmapId } = Route.useParams()
  const search = Route.useSearch()
  const { view, tab } = search
  const navigate = useNavigate({ from: Route.fullPath })
  const setAuto = (on: boolean) =>
    void navigate({
      search: { ...search, auto: on ? 1 : undefined },
      replace: true,
    })
  const id = Number(roadmapId)
  const { data } = useSuspenseQuery(roadmapQuery(id))
  const archive = useArchiveRoadmap()
  const choose = useChoosePath(id)
  const reorder = useRoadmapReorder(id)
  return (
    <>
      <RoadmapPage
        roadmap={data}
        onAutoSchedule={() => setAuto(true)}
        tab={tab === 'progress' ? 'progress' : 'roadmap'}
        view={view === 'list' ? 'list' : 'map'}
        activeModules={
          data.modules.filter((m) => m.status === 'inProgress').length
        }
        choosing={choose.isPending}
        onArchive={(a) =>
          archive.mutate(
            { roadmapId: id, archive: a },
            {
              onSuccess: () =>
                toast.success(a ? 'Roadmap arquivado' : 'Roadmap restaurado'),
              onError: (e) => toast.error(errorMessage(e)),
            },
          )
        }
        onChoose={(branchModuleId, chosenModuleId) =>
          choose.mutate(
            { branchModuleId, chosenModuleId },
            {
              onSuccess: () => toast.success('Caminho escolhido'),
              onError: (e) => toast.error(errorMessage(e)),
            },
          )
        }
        list={
          <RoadmapList
            roadmap={data}
            onReorder={(change) =>
              reorder.mutate(change, {
                onError: (e) =>
                  toast.error(`Não foi possível mover: ${errorMessage(e)}`),
              })
            }
          />
        }
        progress={<Progress roadmapId={id} />}
      />
      <AutoScheduleDialog
        roadmap={data}
        open={!!search.auto}
        onOpenChange={(o) => {
          if (!o) setAuto(false)
        }}
      />
    </>
  )
}

function Progress({ roadmapId }: { roadmapId: number }) {
  const q = useQuery(roadmapProgressQuery(roadmapId))
  if (q.isPending) return <PagePending />
  if (q.isError)
    return (
      <RouteError
        error={q.error}
        reset={() => void q.refetch()}
        info={undefined}
      />
    )
  return <ProgressTab data={q.data} />
}
