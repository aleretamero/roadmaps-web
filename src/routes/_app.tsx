import {
  Outlet,
  createFileRoute,
  redirect,
  useNavigate,
} from '@tanstack/react-router'
import { useSuspenseQuery } from '@tanstack/react-query'
import { useEffect } from 'react'
import { toast } from 'sonner'
import { AppHeader } from '@/features/app-shell/AppHeader'
import { LogSessionProvider } from '@/components/LogSession'
import { PagePending, RouteError } from '@/components/RouteStates'
import { isApiError } from '@/lib/api/errors'
import { meQuery, useLogout } from '@/lib/api/queries'
import { takeWelcome } from '@/lib/auth'

/**
 * Layout das telas logadas. Sem sessão (`GET /me` → 401) manda para
 * `/login?redirect=<onde estava>`.
 *
 * `ssr: false`: a sessão vive no cookie da API e o mock só existe no navegador,
 * então as telas logadas renderizam no cliente.
 */
export const Route = createFileRoute('/_app')({
  ssr: false,
  beforeLoad: async ({ context, location }) => {
    try {
      await context.queryClient.ensureQueryData(meQuery())
    } catch (error) {
      if (isApiError(error, 'unauthorized'))
        throw redirect({ to: '/login', search: { redirect: location.href } })
      throw error
    }
  },
  // Enquanto confere a sessão ainda não há usuário para o cabeçalho.
  pendingComponent: PagePending,
  errorComponent: RouteError,
  component: AppLayout,
})

function AppLayout() {
  return (
    <LogSessionProvider>
      <Shell>
        <Outlet />
      </Shell>
    </LogSessionProvider>
  )
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh overflow-x-clip bg-canvas">
      <a
        href="#conteudo"
        className="sr-only z-50 rounded-md bg-surface px-3 py-2 font-medium text-ink-strong focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:shadow-menu"
      >
        Pular para o conteúdo
      </a>
      <Header />
      <main id="conteudo" tabIndex={-1} className="outline-none">
        {children}
      </main>
    </div>
  )
}

function Header() {
  const { data: me } = useSuspenseQuery(meQuery())
  const logout = useLogout()
  const navigate = useNavigate()
  const firstName = me.name.split(' ')[0]
  // Acabou de entrar: "Olá, Marina!" uma vez, como no protótipo.
  useEffect(() => {
    if (takeWelcome()) toast.success(`Olá, ${firstName}!`)
  }, [firstName])
  return (
    <AppHeader
      name={me.name}
      email={me.email}
      onLogout={() =>
        logout.mutate(undefined, {
          onSuccess: () => void navigate({ to: '/' }),
          onError: () => toast.error('Não foi possível sair. Tente de novo.'),
        })
      }
    />
  )
}
