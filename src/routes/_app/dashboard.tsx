import { createFileRoute } from '@tanstack/react-router'
import { PageContainer, PageIntro } from '@/components/PageIntro'

// Tela provisória do shell (FS10); o conteúdo chega na FU03.
export const Route = createFileRoute('/_app/dashboard')({ component: Page })

function Page() {
  return (
    <PageContainer>
      <PageIntro
        title="Painel"
        description="Esta tela está sendo construída."
      />
    </PageContainer>
  )
}
