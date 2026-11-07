import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useSuspenseQuery } from '@tanstack/react-query'
import { ActivityCard } from '@/features/dashboard/ActivityCard'
import { DashboardPage } from '@/features/dashboard/DashboardPage'
import { activityQuery, dashboardQuery } from '@/lib/api/queries'
import { todayISO } from '@/lib/date'

const WEEKS = 24

export const Route = createFileRoute('/_app/dashboard')({
  loader: ({ context }) =>
    Promise.all([
      context.queryClient.ensureQueryData(dashboardQuery()),
      context.queryClient.ensureQueryData(activityQuery(WEEKS)),
    ]),
  head: () => ({ meta: [{ title: 'Painel · Roadmaps' }] }),
  component: Dashboard,
})

function Dashboard() {
  const { data } = useSuspenseQuery(dashboardQuery())
  const { data: activity } = useSuspenseQuery(activityQuery(WEEKS))
  const navigate = useNavigate()
  const today = todayISO()
  return (
    <DashboardPage
      data={data}
      date={today}
      hour={new Date().getHours()}
      activity={
        <ActivityCard
          activity={activity}
          today={today}
          streak={data.streak.current}
          // O modal do dia é da Agenda (FU14): abre por `?day=`.
          onSelectDay={(day) =>
            void navigate({ to: '/schedule', search: { day } })
          }
        />
      }
    />
  )
}
