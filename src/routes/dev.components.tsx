import { createFileRoute, notFound } from '@tanstack/react-router'
import { ComponentsPage } from '@/features/design-tokens/ComponentsPage'

export const Route = createFileRoute('/dev/components')({
  beforeLoad: () => {
    if (!import.meta.env.DEV) throw notFound()
  },
  head: () => ({ meta: [{ title: 'Componentes · Roadmaps' }] }),
  component: ComponentsPage,
})
