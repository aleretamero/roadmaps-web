import { createFileRoute, notFound } from '@tanstack/react-router'
import { TokensPage } from '@/features/design-tokens/TokensPage'

export const Route = createFileRoute('/dev/tokens')({
  beforeLoad: () => {
    if (!import.meta.env.DEV) throw notFound()
  },
  head: () => ({ meta: [{ title: 'Tokens · Roadmaps' }] }),
  component: TokensPage,
})
