import { createFileRoute } from '@tanstack/react-router'
import { PageContainer, PageIntro } from '@/components/PageIntro'

// Tela provisória do shell (FS10); o conteúdo chega na issue da Agenda.
export const Route = createFileRoute('/_app/schedule')({ component: Page })

function Page() {
  return (
    <PageContainer>
      <PageIntro
        title="Agenda"
        description="Esta tela está sendo construída."
      />
    </PageContainer>
  )
}
