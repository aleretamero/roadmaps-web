import { createFileRoute } from '@tanstack/react-router'
import { PageContainer, PageIntro } from '@/components/PageIntro'

// Tela provisória do shell (FS10); o conteúdo chega na FU04.
export const Route = createFileRoute('/_app/roadmaps/')({ component: Page })

function Page() {
  return (
    <PageContainer>
      <PageIntro
        title="Meus roadmaps"
        description="Esta tela está sendo construída."
      />
    </PageContainer>
  )
}
