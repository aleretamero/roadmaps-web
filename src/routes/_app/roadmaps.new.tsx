import {
  createFileRoute,
  useBlocker,
  useNavigate,
} from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { useCallback, useRef, useState } from 'react'
import { toast } from 'sonner'
import { PagePending } from '@/components/RouteStates'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { BuilderPage } from '@/features/builder/BuilderPage'
import type { BuilderDestination } from '@/features/builder/BuilderPage'
import {
  apiProblems,
  fromImportModules,
  parseImportJson,
  toImportModules,
} from '@/features/builder/model'
import { errorMessage, isApiError } from '@/lib/api/errors'
import {
  importDryRun,
  roadmapQuery,
  useCreateRoadmap,
  useImportIntoRoadmap,
} from '@/lib/api/queries'

type NewSearch = { roadmapId?: number }

/**
 * Criador de roadmap. Com `?roadmapId=` adiciona módulos a um roadmap que já
 * existe (mesma tela, "Adicionando a …").
 */
export const Route = createFileRoute('/_app/roadmaps/new')({
  validateSearch: (search: Record<string, unknown>): NewSearch => {
    const id = Number(search.roadmapId)
    return Number.isInteger(id) && id > 0 ? { roadmapId: id } : {}
  },
  loaderDeps: ({ search }) => ({ roadmapId: search.roadmapId }),
  loader: ({ context, deps }) =>
    deps.roadmapId
      ? context.queryClient.ensureQueryData(roadmapQuery(deps.roadmapId))
      : null,
  head: () => ({ meta: [{ title: 'Novo roadmap · Roadmaps' }] }),
  component: NewRoadmap,
})

function NewRoadmap() {
  const { roadmapId } = Route.useSearch()
  const existing = useQuery({
    ...roadmapQuery(roadmapId ?? 0),
    enabled: !!roadmapId,
  })
  const navigate = useNavigate()
  const create = useCreateRoadmap()
  const addTo = useImportIntoRoadmap(roadmapId ?? 0)
  const [dirty, setDirty] = useState(false)
  // Ref (e não state): a navegação logo depois de salvar já precisa ver o valor novo.
  const saved = useRef(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const blocker = useBlocker({
    shouldBlockFn: () => dirty && !saved.current,
    enableBeforeUnload: () => dirty && !saved.current,
    withResolver: true,
  })
  const onDirtyChange = useCallback((d: boolean) => setDirty(d), [])

  if (roadmapId && !existing.data) return <PagePending />
  const destination: BuilderDestination =
    roadmapId && existing.data
      ? {
          kind: 'existing',
          id: roadmapId,
          name: existing.data.name,
          moduleTitles: existing.data.modules.map((m) => m.title),
        }
      : { kind: 'new' }
  const existingTitles =
    destination.kind === 'existing' ? destination.moduleTitles : []
  const lastExisting = existingTitles.at(-1) ?? null

  return (
    <>
      <BuilderPage
        destination={destination}
        submitting={create.isPending || addTo.isPending}
        submitError={submitError}
        onDirtyChange={onDirtyChange}
        onCancel={() =>
          void navigate(
            destination.kind === 'existing'
              ? {
                  to: '/roadmaps/$roadmapId',
                  params: { roadmapId: String(destination.id) },
                }
              : { to: '/roadmaps' },
          )
        }
        onImport={async (text) => {
          const parsed = parseImportJson(text)
          if (!parsed.ok) return parsed
          const { modules, name, goal } = parsed.value
          try {
            await (destination.kind === 'existing'
              ? importDryRun({ roadmapId: destination.id, body: { modules } })
              : importDryRun({
                  body: { name: name || 'Importação', goal, modules },
                }))
          } catch (e) {
            return {
              ok: false,
              problems:
                isApiError(e) && Object.keys(e.fieldErrors).length
                  ? apiProblems(e.fieldErrors, text, modules)
                  : [{ text: errorMessage(e) }],
            }
          }
          return {
            ok: true,
            modules: fromImportModules(modules, existingTitles),
            name,
            goal,
          }
        }}
        onSubmit={async (values) => {
          setSubmitError(null)
          const modules = toImportModules(values.modules, lastExisting)
          try {
            if (destination.kind === 'existing') {
              await addTo.mutateAsync({ modules })
              saved.current = true
              toast.success(`Módulos adicionados a “${destination.name}”`)
              await navigate({
                to: '/roadmaps/$roadmapId',
                params: { roadmapId: String(destination.id) },
              })
            } else {
              const r = await create.mutateAsync({
                name: values.name.trim(),
                goal: values.goal.trim() || null,
                modules,
              })
              saved.current = true
              toast.success(`Roadmap “${r.name}” criado`)
              await navigate({
                to: '/roadmaps/$roadmapId',
                params: { roadmapId: String(r.id) },
              })
            }
          } catch (e) {
            setSubmitError(errorMessage(e))
          }
        }}
      />
      <AlertDialog open={blocker.status === 'blocked'}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Sair sem salvar?</AlertDialogTitle>
            <AlertDialogDescription>
              Os módulos e tópicos que você montou aqui vão se perder.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => blocker.reset?.()}>
              Continuar editando
            </AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => blocker.proceed?.()}
            >
              Sair sem salvar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
