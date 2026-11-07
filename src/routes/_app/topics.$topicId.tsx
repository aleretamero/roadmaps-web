import { createFileRoute } from '@tanstack/react-router'
import { PageContainer, PageIntro } from '@/components/PageIntro'

type TopicSearch = { tab?: string; log?: 1 }

// Tela provisória: o detalhe do tópico chega na FU12 e o modal de sessão
// (aberto por `?log=1`) na FU13.
export const Route = createFileRoute('/_app/topics/$topicId')({
  validateSearch: (search: Record<string, unknown>): TopicSearch => ({
    ...(typeof search.tab === 'string' ? { tab: search.tab } : {}),
    ...(search.log === 1 || search.log === '1' ? { log: 1 as const } : {}),
  }),
  component: Page,
})

function Page() {
  return (
    <PageContainer>
      <PageIntro
        title="Tópico"
        description="Esta tela está sendo construída."
      />
    </PageContainer>
  )
}
