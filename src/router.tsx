import { createRouter as createTanStackRouter } from '@tanstack/react-router'
import { setupRouterSsrQueryIntegration } from '@tanstack/react-router-ssr-query'
import { routeTree } from './routeTree.gen'
import { createQueryClient } from '@/lib/api/query-client'
import { NotFound, PagePending, RouteError } from '@/components/RouteStates'

export function getRouter() {
  const queryClient = createQueryClient({
    onUnauthorized: () => {
      const { pathname, searchStr } = router.state.location
      if (pathname === '/login') return
      void router.navigate({
        href: `/login?redirect=${encodeURIComponent(pathname + searchStr)}`,
      })
    },
  })

  const router = createTanStackRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    defaultPreload: 'intent',
    // O TanStack Query cuida do cache; o router sempre pergunta a ele.
    defaultPreloadStaleTime: 0,
    defaultPendingComponent: PagePending,
    defaultPendingMs: 300,
    defaultErrorComponent: RouteError,
    defaultNotFoundComponent: NotFound,
  })

  setupRouterSsrQueryIntegration({ router, queryClient })

  return router
}

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof getRouter>
  }
}
