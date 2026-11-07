import { createFileRoute } from '@tanstack/react-router'
import { useSuspenseQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import { RoadmapsPage } from '@/features/roadmaps/RoadmapsPage'
import { errorMessage } from '@/lib/api/errors'
import {
  roadmapsQuery,
  useArchiveRoadmap,
  useDeleteRoadmap,
} from '@/lib/api/queries'

type RoadmapsSearch = { archived?: true }

export const Route = createFileRoute('/_app/roadmaps/')({
  validateSearch: (search: Record<string, unknown>): RoadmapsSearch =>
    search.archived === true || search.archived === 'true'
      ? { archived: true }
      : {},
  loader: ({ context }) =>
    Promise.all([
      context.queryClient.ensureQueryData(roadmapsQuery(false)),
      context.queryClient.ensureQueryData(roadmapsQuery(true)),
    ]),
  head: () => ({ meta: [{ title: 'Meus roadmaps · Roadmaps' }] }),
  component: Roadmaps,
})

function Roadmaps() {
  const { archived } = Route.useSearch()
  const { data: active } = useSuspenseQuery(roadmapsQuery(false))
  const { data: archivedList } = useSuspenseQuery(roadmapsQuery(true))
  const archive = useArchiveRoadmap()
  const remove = useDeleteRoadmap()
  return (
    <RoadmapsPage
      active={active}
      archived={archivedList}
      showArchived={!!archived}
      deleting={remove.isPending}
      onArchive={(r, a) =>
        archive.mutate(
          { roadmapId: r.id, archive: a },
          {
            onSuccess: () =>
              toast.success(
                a
                  ? `“${r.name}” arquivado`
                  : `“${r.name}” voltou para os ativos`,
              ),
            onError: (e) => toast.error(errorMessage(e)),
          },
        )
      }
      onDelete={(r) =>
        remove.mutate(r.id, {
          onSuccess: () => toast.success(`“${r.name}” apagado`),
          onError: (e) => toast.error(errorMessage(e)),
        })
      }
    />
  )
}
