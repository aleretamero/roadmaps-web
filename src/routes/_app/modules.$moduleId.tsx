import { createFileRoute } from '@tanstack/react-router'
import { PageContainer, PageIntro } from '@/components/PageIntro'

type ModuleSearch = { tab?: string; add?: 1; edit?: 1 }

// Tela provisória: o detalhe do módulo chega na FU10.
export const Route = createFileRoute('/_app/modules/$moduleId')({
  validateSearch: (search: Record<string, unknown>): ModuleSearch => ({
    ...(typeof search.tab === 'string' ? { tab: search.tab } : {}),
    ...(search.add === 1 || search.add === '1' ? { add: 1 as const } : {}),
    ...(search.edit === 1 || search.edit === '1' ? { edit: 1 as const } : {}),
  }),
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
