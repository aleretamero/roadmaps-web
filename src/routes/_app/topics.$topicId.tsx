import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useSuspenseQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { toast } from 'sonner'
import {
  EditTopicDialog,
  ReopenStageDialog,
} from '@/features/topic/TopicDialogs'
import { TopicPage } from '@/features/topic/TopicPage'
import { TopicTimeline } from '@/features/topic/TopicTimeline'
import { LogSessionDialog } from '@/components/LogSession'
import { NotesPanel } from '@/components/notes/NotesPanel'
import type { TopicTab } from '@/features/topic/TopicPage'
import { errorMessage } from '@/lib/api/errors'
import {
  topicQuery,
  useAddScheduleEntry,
  useDeleteScheduleEntry,
  useReopenTopic,
  useUpdateTopic,
} from '@/lib/api/queries'
import { formatPlan } from '@/lib/date'
import { stageLabel } from '@/lib/stage'

type TopicSearch = { tab?: Exclude<TopicTab, 'timeline'>; log?: 1; edit?: 1 }
const TABS = ['files', 'resources', 'notes'] as const

const placeholder = (text: string) => (
  <p className="rounded-2xl border border-dashed border-line-control bg-surface p-8 text-center text-ink-muted">
    {text}
  </p>
)

// `?log=1` abre o modal Registrar sessão (link do lembrete e do botão da tela).
export const Route = createFileRoute('/_app/topics/$topicId')({
  validateSearch: (search: Record<string, unknown>): TopicSearch => ({
    ...(TABS.includes(search.tab as (typeof TABS)[number])
      ? { tab: search.tab as (typeof TABS)[number] }
      : {}),
    ...(search.log === 1 || search.log === '1' ? { log: 1 as const } : {}),
    ...(search.edit === 1 || search.edit === '1' ? { edit: 1 as const } : {}),
  }),
  loader: ({ context, params }) =>
    context.queryClient.ensureQueryData(topicQuery(Number(params.topicId))),
  head: ({ loaderData }) => ({
    meta: [{ title: `${loaderData?.title ?? 'Tópico'} · Roadmaps` }],
  }),
  component: Topic,
})

function Topic() {
  const { topicId } = Route.useParams()
  const search = Route.useSearch()
  const id = Number(topicId)
  const { data } = useSuspenseQuery(topicQuery(id))
  const navigate = useNavigate({ from: Route.fullPath })
  const update = useUpdateTopic(id)
  const reopen = useReopenTopic(id)
  const addDay = useAddScheduleEntry(id)
  const removeDay = useDeleteScheduleEntry(id)
  const [editError, setEditError] = useState<string | null>(null)
  const [reopening, setReopening] = useState(false)
  const setSearch = (next: TopicSearch) =>
    void navigate({ search: next, replace: true })

  return (
    <>
      <TopicPage
        topic={data}
        tab={search.tab ?? 'timeline'}
        onTabChange={(tab) =>
          setSearch({ ...search, tab: tab === 'timeline' ? undefined : tab })
        }
        onRegister={() => setSearch({ ...search, log: 1 })}
        onEdit={() => setSearch({ ...search, edit: 1 })}
        onReopen={() => setReopening(true)}
        onAddDay={(date) =>
          addDay.mutate(date, {
            onSuccess: () => toast.success(`Agendado para ${formatPlan(date)}`),
            onError: (e) => toast.error(errorMessage(e)),
          })
        }
        onRemoveDay={(entryId) => {
          const entry = data.scheduleEntries.find((e) => e.id === entryId)
          removeDay.mutate(entryId, {
            onSuccess: () =>
              entry &&
              toast.success(`${formatPlan(entry.date)} saiu da agenda`),
            onError: (e) => toast.error(errorMessage(e)),
          })
        }}
        panels={{
          timeline: <TopicTimeline topic={data} />,
          files: placeholder('Os arquivos do tópico estão sendo construídos.'),
          resources: placeholder(
            'As referências do tópico estão sendo construídas.',
          ),
          notes: <NotesPanel owner={{ kind: 'topic', id }} />,
        }}
      />
      <LogSessionDialog
        topicId={id}
        open={!!search.log}
        onOpenChange={(o) => {
          if (!o) setSearch({ ...search, log: undefined })
        }}
      />
      <EditTopicDialog
        key={data.updatedAt}
        open={!!search.edit}
        onOpenChange={(o) => {
          setEditError(null)
          if (!o) setSearch({ ...search, edit: undefined })
        }}
        initial={{
          title: data.title,
          description: data.description ?? '',
          isOptional: data.isOptional,
        }}
        saving={update.isPending}
        error={editError}
        onSave={(v) =>
          update.mutate(
            {
              title: v.title,
              description: v.description || null,
              isOptional: v.isOptional,
            },
            {
              onSuccess: () => {
                toast.success('Tópico atualizado')
                setSearch({ ...search, edit: undefined })
              },
              onError: (e) => setEditError(errorMessage(e)),
            },
          )
        }
      />
      {data.stage !== 'planned' && (
        <ReopenStageDialog
          open={reopening}
          onOpenChange={setReopening}
          current={data.stage}
          saving={reopen.isPending}
          onConfirm={(stage) =>
            reopen.mutate(stage, {
              onSuccess: () => {
                toast.success(`Tópico voltou para ${stageLabel[stage]}`)
                setReopening(false)
              },
              onError: (e) => toast.error(errorMessage(e)),
            })
          }
        />
      )}
    </>
  )
}
