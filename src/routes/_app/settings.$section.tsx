import { createFileRoute } from '@tanstack/react-router'
import { Breadcrumbs } from '@/components/Breadcrumbs'
import { PageContainer, PageIntro } from '@/components/PageIntro'

// Tela provisória do shell (FS10); o conteúdo chega nas issues de Configurações.
export const Route = createFileRoute('/_app/settings/$section')({
  component: Page,
})

function Page() {
  return (
    <PageContainer>
      <Breadcrumbs
        items={[
          { label: 'Painel', link: { to: '/dashboard' } },
          { label: 'Configurações' },
        ]}
      />
      <div className="mt-4">
        <PageIntro
          title="Configurações"
          description="Esta tela está sendo construída."
        />
      </div>
    </PageContainer>
  )
}
