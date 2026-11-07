import { createFileRoute } from '@tanstack/react-router'
import { PageContainer, PageIntro } from '@/components/PageIntro'

type ScheduleSearch = { day?: string }

// Tela provisória do shell (FS10); a Agenda chega na FU14 (o modal do dia abre por `?day=`).
export const Route = createFileRoute('/_app/schedule')({
  validateSearch: (search: Record<string, unknown>): ScheduleSearch =>
    typeof search.day === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(search.day)
      ? { day: search.day }
      : {},
  component: Page,
})

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
