import { createFileRoute } from '@tanstack/react-router'
import { useSuspenseQuery } from '@tanstack/react-query'
import { DashboardPage } from '@/features/dashboard/DashboardPage'
import { dashboardQuery } from '@/lib/api/queries'
import { todayISO } from '@/lib/date'

export const Route = createFileRoute('/_app/dashboard')({
  loader: ({ context }) =>
    context.queryClient.ensureQueryData(dashboardQuery()),
  head: () => ({ meta: [{ title: 'Painel · Roadmaps' }] }),
  component: Dashboard,
})

function Dashboard() {
  const { data } = useSuspenseQuery(dashboardQuery())
  return (
    <DashboardPage data={data} date={todayISO()} hour={new Date().getHours()} />
  )
}
