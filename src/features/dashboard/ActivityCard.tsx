import { ActionMark } from '@/components/ActionMark'
import { ActivityHeatmap } from '@/components/ActivityHeatmap'
import type { Schemas } from '@/lib/api/client'
import { ACTIONS, ACTION_LABEL } from '@/lib/actions'
import { cn } from '@/lib/utils'
import { DashCard } from './DashCard'

const BAR = {
  studied: 'bg-chart-studying',
  practiced: 'bg-chart-practicing',
  completed: 'bg-chart-completed',
} as const

/** Atividade: mapa de calor + "O que você fez" nas últimas semanas. */
export function ActivityCard({
  activity,
  today,
  streak,
  onSelectDay,
}: {
  activity: Schemas['Activity']
  today: string
  streak?: number
  onSelectDay?: (date: string) => void
}) {
  const t = activity.totals
  const n = {
    studied: t.studied,
    practiced: t.practiced,
    completed: t.completed,
  }
  return (
    <DashCard title="Atividade">
      <div className="flex flex-wrap gap-x-8 gap-y-5">
        <ActivityHeatmap
          days={activity.days}
          weeks={activity.weeks}
          today={today}
          streak={streak}
          onSelectDay={onSelectDay}
          className="min-w-0 flex-[3_1_520px]"
        />
        <div className="flex min-w-0 flex-[1_1_240px] flex-col gap-3">
          <h3 className="text-[13px] font-medium text-ink-muted">
            O que você fez · últimas {activity.weeks} semanas
          </h3>
          <div aria-hidden="true" className="flex h-2.5 gap-0.5">
            {ACTIONS.filter((a) => n[a] > 0).map((a) => (
              <span
                key={a}
                className={cn('h-full rounded-[4px]', BAR[a])}
                style={{ flex: `${n[a]} 1 0` }}
              />
            ))}
            {ACTIONS.every((a) => n[a] === 0) && (
              <span className="flex-1 rounded-[4px] bg-surface-sunken" />
            )}
          </div>
          <ul className="flex flex-col gap-2">
            {ACTIONS.map((a) => (
              <li key={a} className="flex items-center gap-2 text-sm">
                <ActionMark action={a} size="sm" className="size-[22px]" />
                <span className="flex-1">{ACTION_LABEL[a]}</span>
                <span className="font-mono font-medium">{n[a]}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </DashCard>
  )
}
