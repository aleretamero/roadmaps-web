import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { toast } from 'sonner'
import { useLogSession } from '@/components/LogSession'
import { useReschedule } from '@/components/Reschedule'
import { DayDialog } from '@/features/schedule/DayDialog'
import { SchedulePage } from '@/features/schedule/SchedulePage'
import {
  monthGrid,
  monthOf,
  shiftMonth,
  weekStart,
} from '@/features/schedule/calendar'
import { errorMessage } from '@/lib/api/errors'
import {
  scheduleQuery,
  useDeleteScheduleEntry,
  useScheduleTopic,
} from '@/lib/api/queries'
import { addDays, formatShort, todayISO } from '@/lib/date'

type ScheduleSearch = {
  view?: 'week'
  month?: string
  week?: string
  day?: string
}

const isDate = (v: unknown): v is string =>
  typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v)
const isMonth = (v: unknown): v is string =>
  typeof v === 'string' && /^\d{4}-\d{2}$/.test(v)

export const Route = createFileRoute('/_app/schedule')({
  validateSearch: (search: Record<string, unknown>): ScheduleSearch => ({
    ...(search.view === 'week' ? { view: 'week' as const } : {}),
    ...(isMonth(search.month) ? { month: search.month } : {}),
    ...(isDate(search.week) ? { week: weekStart(search.week) } : {}),
    ...(isDate(search.day) ? { day: search.day } : {}),
  }),
  head: () => ({ meta: [{ title: 'Agenda · Roadmaps' }] }),
  component: Schedule,
})

function Schedule() {
  const search = Route.useSearch()
  const navigate = useNavigate({ from: Route.fullPath })
  const [today] = useState(todayISO)
  const view = search.view === 'week' ? 'week' : 'month'
  const period =
    view === 'month'
      ? (search.month ?? monthOf(today))
      : (search.week ?? weekStart(today))
  const grid = view === 'month' ? monthGrid(period) : null
  const from = grid ? grid[0]![0]! : period
  const to = grid ? grid.at(-1)![6]! : addDays(period, 6)

  const days = useQuery(scheduleQuery(from, to))
  const upcoming = useQuery(scheduleQuery(today, addDays(today, 14)))
  const dayData = useQuery({
    ...scheduleQuery(search.day ?? today, search.day ?? today),
    enabled: !!search.day,
  })
  const log = useLogSession()
  const reschedule = useReschedule()
  const add = useScheduleTopic()
  const remove = useDeleteScheduleEntry()

  const setSearch = (next: ScheduleSearch) =>
    void navigate({ search: next, replace: true })
  const go = (next: ScheduleSearch) => void navigate({ search: next })
  const closeDay = () => setSearch({ ...search, day: undefined })

  return (
    <>
      <SchedulePage
        view={view}
        period={period}
        today={today}
        days={days.data?.days}
        error={days.error ? errorMessage(days.error) : null}
        onRetry={() => void days.refetch()}
        upcoming={upcoming.data?.days}
        onViewChange={(v) =>
          go(
            v === 'week'
              ? {
                  view: 'week',
                  week: weekStart(
                    monthOf(today) === period ? today : `${period}-01`,
                  ),
                }
              : { month: monthOf(period) },
          )
        }
        onPrev={() =>
          go(
            view === 'month'
              ? { month: shiftMonth(period, -1) }
              : { view: 'week', week: addDays(period, -7) },
          )
        }
        onNext={() =>
          go(
            view === 'month'
              ? { month: shiftMonth(period, 1) }
              : { view: 'week', week: addDays(period, 7) },
          )
        }
        onToday={() => go(view === 'month' ? {} : { view: 'week' })}
        onOpenDay={(date) => setSearch({ ...search, day: date })}
      />
      <DayDialog
        date={search.day ?? null}
        today={today}
        day={dayData.data?.days[0]}
        onOpenChange={(o) => {
          if (!o) closeDay()
        }}
        scheduling={add.isPending}
        onLog={(topicId) => {
          const day = search.day
          closeDay()
          log(topicId, { day })
        }}
        onMove={(topicId, entryId) => {
          closeDay()
          reschedule(topicId, { mode: 'move', fromId: entryId })
        }}
        onSchedule={(topicId) => {
          const date = search.day!
          add.mutate(
            { topicId, date },
            {
              onSuccess: () =>
                toast.success(`Agendado para ${formatShort(date)}`),
              onError: (e) => toast.error(errorMessage(e)),
            },
          )
        }}
        onRemove={(entryId, title) =>
          remove.mutate(entryId, {
            onSuccess: () => toast.success(`${title} saiu deste dia`),
            onError: (e) => toast.error(errorMessage(e)),
          })
        }
      />
    </>
  )
}
