import { createFileRoute } from '@tanstack/react-router'
import { LandingPage } from '@/features/landing/LandingPage'
import { META } from '@/features/landing/content'
import { useRedirectWhenLoggedIn } from '@/lib/useRedirectWhenLoggedIn'

export const Route = createFileRoute('/')({
  head: () => ({
    meta: [
      { title: META.title },
      { name: 'description', content: META.description },
      { property: 'og:type', content: 'website' },
      { property: 'og:title', content: META.title },
      { property: 'og:description', content: META.description },
      { property: 'og:locale', content: 'pt_BR' },
      { name: 'twitter:card', content: 'summary' },
    ],
  }),
  component: Home,
})

function Home() {
  useRedirectWhenLoggedIn()
  return <LandingPage />
}
