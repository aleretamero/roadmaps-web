import { createFileRoute } from '@tanstack/react-router'
import { PageContainer, PageIntro } from '@/components/PageIntro'

// Tela provisória: o roadmap (mapa, lista e progresso) chega nas FU07–FU09.
export const Route = createFileRoute('/_app/roadmaps/$roadmapId')({
  component: Page,
})

function Page() {
  return (
    <PageContainer>
      <PageIntro
        title="Roadmap"
        description="Esta tela está sendo construída."
      />
    </PageContainer>
  )
}
