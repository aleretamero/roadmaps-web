import {
  createFileRoute,
  notFound,
  useBlocker,
  useNavigate,
  useRouter,
} from '@tanstack/react-router'
import { useQuery, useSuspenseQuery } from '@tanstack/react-query'
import { useCallback, useState } from 'react'
import { toast } from 'sonner'
import { PagePending, RouteError } from '@/components/RouteStates'
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
import {
  AccountSection,
  IntegrationsSection,
  SECTIONS,
  SettingsLayout,
  StudySection,
} from '@/features/settings/SettingsPage'
import type { SettingsSection } from '@/features/settings/SettingsPage'
import { errorMessage } from '@/lib/api/errors'
import {
  integrationsQuery,
  meQuery,
  preferencesQuery,
  useDisconnectDrive,
  useLogout,
  useUpdateMe,
  useUpdatePreferences,
} from '@/lib/api/queries'
import { startDriveConnect } from '@/lib/integrations'
import { safeRedirect } from '@/lib/redirect'

type SettingsSearch = { returnTo?: string }

const isSection = (s: string): s is SettingsSection =>
  SECTIONS.some((x) => x.id === s)

export const Route = createFileRoute('/_app/settings/$section')({
  validateSearch: (search: Record<string, unknown>): SettingsSearch => {
    const r = safeRedirect(search.returnTo)
    return r ? { returnTo: r } : {}
  },
  beforeLoad: ({ params }) => {
    if (!isSection(params.section)) throw notFound()
  },
  head: () => ({ meta: [{ title: 'Configurações · Roadmaps' }] }),
  component: Settings,
})

function Settings() {
  const { section } = Route.useParams()
  const { returnTo } = Route.useSearch()
  const current = section as SettingsSection
  const [dirty, setDirty] = useState(false)
  const onDirtyChange = useCallback((d: boolean) => setDirty(d), [])
  const blocker = useBlocker({
    shouldBlockFn: () => dirty,
    enableBeforeUnload: () => dirty,
    withResolver: true,
  })
  return (
    <SettingsLayout section={current}>
      {current === 'account' && <Account onDirtyChange={onDirtyChange} />}
      {current === 'study' && <Study onDirtyChange={onDirtyChange} />}
      {current === 'integrations' && <Integrations returnTo={returnTo} />}
      <AlertDialog open={blocker.status === 'blocked'}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Sair sem salvar?</AlertDialogTitle>
            <AlertDialogDescription>
              Você mudou configurações que ainda não foram salvas. Se sair
              agora, essas mudanças se perdem.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => blocker.reset?.()}>
              Continuar editando
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setDirty(false)
                blocker.proceed?.()
              }}
            >
              Sair sem salvar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </SettingsLayout>
  )
}

function Account({ onDirtyChange }: { onDirtyChange: (d: boolean) => void }) {
  const { data: me } = useSuspenseQuery(meQuery())
  const update = useUpdateMe()
  const logout = useLogout()
  const navigate = useNavigate()
  return (
    <AccountSection
      key={`${me.name}|${me.timeZone}`}
      me={me}
      saving={update.isPending}
      error={update.error ? errorMessage(update.error) : null}
      onDirtyChange={onDirtyChange}
      onSave={(values) =>
        update.mutate(values, {
          onSuccess: () => {
            onDirtyChange(false)
            toast.success('Conta atualizada')
          },
        })
      }
      onLogout={() =>
        logout.mutate(undefined, {
          onSuccess: () => void navigate({ to: '/' }),
          onError: () => toast.error('Não foi possível sair. Tente de novo.'),
        })
      }
    />
  )
}

function Study({ onDirtyChange }: { onDirtyChange: (d: boolean) => void }) {
  const q = useQuery(preferencesQuery())
  const update = useUpdatePreferences()
  if (q.isPending) return <PagePending />
  if (q.error)
    return (
      <RouteError
        error={q.error}
        reset={() => void q.refetch()}
        info={undefined}
      />
    )
  const p = q.data
  return (
    <StudySection
      key={JSON.stringify(p)}
      prefs={p}
      saving={update.isPending}
      error={update.error ? errorMessage(update.error) : null}
      onDirtyChange={onDirtyChange}
      onSave={(prefs) =>
        update.mutate(prefs, {
          onSuccess: () => {
            onDirtyChange(false)
            toast.success('Preferências salvas')
          },
        })
      }
    />
  )
}

function Integrations({ returnTo }: { returnTo?: string }) {
  const q = useQuery(integrationsQuery())
  const disconnect = useDisconnectDrive()
  const router = useRouter()
  const [connecting, setConnecting] = useState(false)
  if (q.isPending) return <PagePending />
  if (q.error)
    return (
      <RouteError
        error={q.error}
        reset={() => void q.refetch()}
        info={undefined}
      />
    )
  const back = returnTo ?? '/settings/integrations'
  return (
    <IntegrationsSection
      integrations={q.data}
      connecting={connecting}
      disconnecting={disconnect.isPending}
      returnTo={returnTo}
      onBack={() => returnTo && router.history.push(returnTo)}
      onConnect={async () => {
        setConnecting(true)
        try {
          const navigateHere = await startDriveConnect(back)
          if (navigateHere) {
            await router.invalidate()
            await q.refetch()
            toast.success('Google Drive conectado')
            if (returnTo) router.history.push(returnTo)
          }
        } catch {
          toast.error(
            'Não foi possível conectar o Google Drive. Tente de novo.',
          )
        } finally {
          setConnecting(false)
        }
      }}
      onDisconnect={() =>
        disconnect.mutate(undefined, {
          onSuccess: () => toast.success('Google Drive desconectado'),
          onError: (e) => toast.error(errorMessage(e)),
        })
      }
    />
  )
}
