import { createFileRoute } from '@tanstack/react-router'
import { PageContainer, PageIntro } from '@/components/PageIntro'

// Tela provisória: o criador de roadmap e a importação chegam na FU06.
export const Route = createFileRoute('/_app/roadmaps/new')({ component: Page })

function Page() {
  return (
    <PageContainer>
      <PageIntro
        title="Novo roadmap"
        description="Esta tela está sendo construída."
      />
    </PageContainer>
  )
}
