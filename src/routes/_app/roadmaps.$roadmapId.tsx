import { createFileRoute } from '@tanstack/react-router'
import { useSuspenseQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import { RoadmapPage } from '@/features/roadmap/RoadmapPage'
import { errorMessage } from '@/lib/api/errors'
import {
  roadmapQuery,
  useArchiveRoadmap,
  useChoosePath,
} from '@/lib/api/queries'

type RoadmapSearch = { view?: 'list'; tab?: 'progress' }

export const Route = createFileRoute('/_app/roadmaps/$roadmapId')({
  params: {
    parse: (p) => ({ roadmapId: p.roadmapId }),
  },
  validateSearch: (search: Record<string, unknown>): RoadmapSearch => ({
    ...(search.view === 'list' ? { view: 'list' as const } : {}),
    ...(search.tab === 'progress' ? { tab: 'progress' as const } : {}),
  }),
  loader: ({ context, params }) =>
    context.queryClient.ensureQueryData(roadmapQuery(Number(params.roadmapId))),
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
  const { view, tab } = Route.useSearch()
  const id = Number(roadmapId)
  const { data } = useSuspenseQuery(roadmapQuery(id))
  const archive = useArchiveRoadmap()
  const choose = useChoosePath(id)
  return (
    <RoadmapPage
      roadmap={data}
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
        <p className="rounded-[14px] border border-dashed border-line-control bg-surface p-8 text-center text-ink-muted">
          A visão em lista está sendo construída.
        </p>
      }
      progress={
        <p className="rounded-[14px] border border-dashed border-line-control bg-surface p-8 text-center text-ink-muted">
          O progresso por módulo está sendo construído.
        </p>
      }
    />
  )
}
