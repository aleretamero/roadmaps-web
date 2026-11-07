import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useSuspenseQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { toast } from 'sonner'
import { LazyNotesPanel } from '@/components/notes/LazyNotesPanel'
import { AddTopicsDialog } from '@/features/module/AddTopicsDialog'
import { EditModuleDialog } from '@/features/module/EditModuleDialog'
import { ModulePage } from '@/features/module/ModulePage'
import { ModuleTimeline } from '@/features/module/ModuleTimeline'
import { errorMessage } from '@/lib/api/errors'
import {
  moduleQuery,
  useCreateTopics,
  useUpdateModule,
} from '@/lib/api/queries'

type ModuleSearch = { tab?: 'timeline' | 'notes'; add?: 1; edit?: 1 }

export const Route = createFileRoute('/_app/modules/$moduleId')({
  validateSearch: (search: Record<string, unknown>): ModuleSearch => ({
    ...(search.tab === 'timeline' || search.tab === 'notes'
      ? { tab: search.tab }
      : {}),
    ...(search.add === 1 || search.add === '1' ? { add: 1 as const } : {}),
    ...(search.edit === 1 || search.edit === '1' ? { edit: 1 as const } : {}),
  }),
  loader: ({ context, params }) =>
    context.queryClient.ensureQueryData(moduleQuery(Number(params.moduleId))),
  head: ({ loaderData }) => ({
    meta: [{ title: `${loaderData?.title ?? 'Módulo'} · Roadmaps` }],
  }),
  component: Module,
})

function Module() {
  const { moduleId } = Route.useParams()
  const search = Route.useSearch()
  const id = Number(moduleId)
  const { data } = useSuspenseQuery(moduleQuery(id))
  const navigate = useNavigate({ from: Route.fullPath })
  const update = useUpdateModule(id)
  const create = useCreateTopics(id)
  const [editError, setEditError] = useState<string | null>(null)
  const [addError, setAddError] = useState<string | null>(null)
  const setSearch = (next: ModuleSearch) =>
    void navigate({ search: next, replace: true })

  return (
    <>
      <ModulePage
        module={data}
        tab={search.tab ?? 'topics'}
        onTabChange={(tab) =>
          setSearch({ ...(tab === 'topics' ? {} : { tab }) })
        }
        onEdit={() => setSearch({ ...search, edit: 1 })}
        onAddTopics={() => setSearch({ ...search, add: 1 })}
        adding={create.isPending}
        onQuickAdd={async (title) => {
          try {
            await create.mutateAsync([{ title }])
            toast.success('Tópico adicionado')
          } catch (e) {
            toast.error(errorMessage(e))
          }
        }}
        timeline={<ModuleTimeline moduleId={id} />}
        notes={<LazyNotesPanel owner={{ kind: 'module', id }} />}
      />
      <AddTopicsDialog
        open={!!search.add}
        onOpenChange={(o) => {
          setAddError(null)
          if (!o) setSearch({ ...search, add: undefined })
        }}
        moduleTitle={data.title}
        roadmapName={data.roadmapName}
        existingTitles={data.topics.map((t) => t.title)}
        saving={create.isPending}
        error={addError}
        onSave={(topics) =>
          create.mutate(topics, {
            onSuccess: () => {
              toast.success(
                topics.length === 1
                  ? 'Tópico adicionado'
                  : `${topics.length} tópicos adicionados`,
              )
              setSearch({ ...search, add: undefined })
            },
            onError: (e) => setAddError(errorMessage(e)),
          })
        }
      />
      <EditModuleDialog
        key={data.updatedAt}
        open={!!search.edit}
        onOpenChange={(o) => {
          setEditError(null)
          if (!o) setSearch({ ...search, edit: undefined })
        }}
        initial={{ title: data.title, description: data.description ?? '' }}
        saving={update.isPending}
        error={editError}
        onSave={(values) =>
          update.mutate(
            { title: values.title, description: values.description || null },
            {
              onSuccess: () => {
                toast.success('Módulo atualizado')
                setSearch({ ...search, edit: undefined })
              },
              onError: (e) => setEditError(errorMessage(e)),
            },
          )
        }
      />
    </>
  )
}
