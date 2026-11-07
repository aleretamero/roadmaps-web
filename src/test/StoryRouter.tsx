import {
  Outlet,
  RouterProvider,
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
} from '@tanstack/react-router'
import { useState } from 'react'
import type { Decorator } from '@storybook/react-vite'

/**
 * Router em memória para stories e testes de componentes que usam `Link`.
 * Qualquer caminho casa com a rota curinga, então a navegação funciona sem
 * a árvore de rotas real.
 */
export function StoryRouter({
  path = '/',
  children,
}: {
  path?: string
  children: React.ReactNode
}) {
  const [router] = useState(() => {
    const rootRoute = createRootRoute({
      component: () => (
        <>
          {children}
          <Outlet />
        </>
      ),
    })
    const splat = createRoute({
      getParentRoute: () => rootRoute,
      path: '$',
      component: () => null,
    })
    return createRouter({
      routeTree: rootRoute.addChildren([splat]),
      history: createMemoryHistory({ initialEntries: [path] }),
    })
  })
  return <RouterProvider router={router} />
}

/** Decorator de story: `decorators: [withRouter('/dashboard')]`. */
export const withRouter =
  (path = '/'): Decorator =>
  (Story) => (
    <StoryRouter path={path}>
      <Story />
    </StoryRouter>
  )
