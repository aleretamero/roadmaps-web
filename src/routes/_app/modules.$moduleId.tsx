import { createFileRoute } from '@tanstack/react-router'
import { PageContainer, PageIntro } from '@/components/PageIntro'

type ModuleSearch = { tab?: string }

// Tela provisória: o detalhe do módulo chega na FU10.
export const Route = createFileRoute('/_app/modules/$moduleId')({
  validateSearch: (search: Record<string, unknown>): ModuleSearch =>
    typeof search.tab === 'string' ? { tab: search.tab } : {},
  component: Page,
})

function Page() {
  return (
    <PageContainer>
      <PageIntro
        title="Módulo"
        description="Esta tela está sendo construída."
      />
    </PageContainer>
  )
}
