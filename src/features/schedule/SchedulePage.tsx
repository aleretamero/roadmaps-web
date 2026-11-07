import { Link } from '@tanstack/react-router'
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react'
import { ActionMark } from '@/components/ActionMark'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { ACTIONS, ACTION_LABEL, actionWords } from '@/lib/actions'
import type { Schemas } from '@/lib/api/client'
import {
  addDays,
  capitalize,
  formatWeekdayDay,
  parseISODate,
  relativeDay,
} from '@/lib/date'
import { cn } from '@/lib/utils'
import {
  dayAriaLabel,
  dayItems,
  monthGrid,
  monthLabel,
  monthName,
  monthOf,
  monthStats,
  upcomingEntries,
  weekLabel,
} from './calendar'
import type { CalendarItem } from './calendar'

type Day = Schemas['ScheduleDay']
export type ScheduleView = 'month' | 'week'

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

function itemLabel(it: CalendarItem) {
  if (it.kind === 'work')
    return `${it.topic.title} — ${actionWords(it.actions).toLocaleLowerCase('pt-BR')}`
  return `${it.topic.title} — ${it.kind === 'late' ? 'atrasado' : 'agendado'}`
}

function ItemChip({
  item,
  compact = false,
}: {
  item: CalendarItem
  compact?: boolean
}) {
  return (
    <Link
      to="/topics/$topicId"
      params={{ topicId: String(item.topic.id) }}
      aria-label={itemLabel(item)}
      title={itemLabel(item)}
      className={cn(
        'relative z-[1] flex min-h-[26px] w-full items-center gap-0.5 overflow-hidden rounded-[7px] py-0.5 pr-1.5 pl-[3px] text-xs whitespace-nowrap',
        item.kind === 'work' &&
          'border border-line bg-surface font-medium text-ink',
        item.kind === 'plan' &&
          'border border-dashed border-line-control text-ink-muted',
        item.kind === 'late' &&
          'border border-dashed border-danger bg-danger-soft text-danger',
        compact && 'max-sm:justify-center max-sm:px-0',
      )}
    >
      {item.kind === 'work' ? (
        item.actions.map((a) => (
          <ActionMark key={a} action={a} size="sm" className="size-[18px]" />
        ))
      ) : (
        <ActionMark action="planned" size="sm" className="size-[18px]" />
      )}
      <span
        className={cn(
          'ml-[3px] min-w-0 flex-1 truncate',
          compact && 'max-sm:hidden',
        )}
      >
        {item.topic.title}
      </span>
    </Link>
  )
}

function Legend() {
  return (
    <ul
      aria-label="Legenda"
      className="flex flex-wrap gap-x-4 gap-y-2 text-[13px] text-ink-muted"
    >
      {ACTIONS.map((a) => (
        <li key={a} className="inline-flex items-center gap-1.5">
          <ActionMark action={a} size="sm" />
          {ACTION_LABEL[a]}
        </li>
      ))}
      <li className="inline-flex items-center gap-1.5">
        <ActionMark action="planned" size="sm" />
        Agendado
      </li>
      <li className="inline-flex items-center gap-1.5">
        <span
          aria-hidden="true"
          className="size-3.5 rounded-[4px] border border-dashed border-danger bg-danger-soft"
        />
        Atrasado
      </li>
    </ul>
  )
}

function DayCell({
  date,
  day,
  today,
  inMonth,
  onOpenDay,
}: {
  date: string
  day: Day | undefined
  today: string
  inMonth: boolean
  onOpenDay: (date: string) => void
}) {
  const items = day ? dayItems(day, today) : []
  const shown = items.slice(0, 3)
  const isToday = date === today
  return (
    <div
      role="gridcell"
      className={cn(
        'relative flex min-h-[96px] min-w-0 flex-col gap-1 rounded-[10px] p-1 sm:min-h-[112px] sm:p-[5px]',
        inMonth
          ? 'bg-canvas shadow-[inset_0_0_0_1px_var(--color-line-soft)]'
          : 'opacity-55',
      )}
    >
      <button
        type="button"
        onClick={() => onOpenDay(date)}
        aria-label={dayAriaLabel(date, items, today)}
        aria-current={isToday ? 'date' : undefined}
        className="absolute inset-0 rounded-[10px] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-link"
      />
      <span
        aria-hidden="true"
        className={cn(
          'grid size-7 place-items-center rounded-full text-sm sm:ml-1',
          isToday
            ? 'bg-ink font-semibold text-surface'
            : inMonth
              ? 'font-medium text-ink'
              : 'text-ink-muted',
        )}
      >
        {parseISODate(date).getDate()}
      </span>
      {shown.map((it) => (
        <ItemChip key={it.key} item={it} compact />
      ))}
      {items.length > 3 && (
        <span className="relative px-1 text-[11px] text-ink-muted">
          +{items.length - 3} mais
        </span>
      )}
    </div>
  )
}

function MonthGrid({
  month,
  days,
  today,
  onOpenDay,
}: {
  month: string
  days: Map<string, Day>
  today: string
  onOpenDay: (date: string) => void
}) {
  return (
    <div
      role="grid"
      aria-label={monthLabel(month)}
      className="flex flex-col gap-1"
    >
      <div role="row" className="grid grid-cols-7 gap-1">
        {WEEKDAYS.map((w) => (
          <span
            key={w}
            role="columnheader"
            className="px-1 text-[11px] font-medium tracking-[0.04em] text-ink-muted uppercase sm:px-2"
          >
            {w}
          </span>
        ))}
      </div>
      {monthGrid(month).map((week) => (
        <div role="row" key={week[0]} className="grid grid-cols-7 gap-1">
          {week.map((d) => (
            <DayCell
              key={d}
              date={d}
              day={days.get(d)}
              today={today}
              inMonth={monthOf(d) === month}
              onOpenDay={onOpenDay}
            />
          ))}
        </div>
      ))}
    </div>
  )
}

function WeekList({
  start,
  days,
  today,
  onOpenDay,
}: {
  start: string
  days: Map<string, Day>
  today: string
  onOpenDay: (date: string) => void
}) {
  const dates = Array.from({ length: 7 }, (_, i) => addDays(start, i))
  return (
    <ol aria-label={`Semana de ${weekLabel(start)}`} className="flex flex-col">
      {dates.map((date) => {
        const day = days.get(date)
        const items = day ? dayItems(day, today) : []
        return (
          <li
            key={date}
            className="flex flex-wrap items-start gap-x-4 gap-y-2 border-t border-line-soft py-3 first:border-t-0"
          >
            <span
              className={cn(
                'w-16 flex-none pt-1 text-sm',
                date === today ? 'font-semibold text-ink' : 'text-ink-strong',
              )}
            >
              {formatWeekdayDay(date)}
              {date === today && (
                <span className="block text-xs font-normal text-ink-muted">
                  Hoje
                </span>
              )}
            </span>
            <div className="flex min-w-0 flex-[1_1_200px] flex-col gap-1.5">
              {items.length ? (
                items.map((it) => <ItemChip key={it.key} item={it} />)
              ) : (
                <span className="pt-1 text-sm text-ink-soft">
                  Nada neste dia
                </span>
              )}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onOpenDay(date)}
              aria-label={`Abrir ${dayAriaLabel(date, items, today)}`}
            >
              Abrir dia
            </Button>
          </li>
        )
      })}
    </ol>
  )
}

function MonthSummary({
  month,
  days,
}: {
  month: string
  days: ReadonlyArray<Day>
}) {
  const { daysWorked, counts } = monthStats(days, month)
  return (
    <section
      aria-labelledby="ms-title"
      className="flex flex-col gap-3.5 rounded-2xl border border-line bg-surface p-5"
    >
      <div className="flex flex-col gap-0.5">
        <h2 id="ms-title" className="text-lg font-semibold">
          Em {monthName(month)}
        </h2>
        <span className="text-[13px] text-ink-muted">
          {daysWorked
            ? `${daysWorked} ${daysWorked === 1 ? 'dia com registro' : 'dias com registro'}`
            : 'Nenhum registro neste mês ainda'}
        </span>
      </div>
      <dl className="grid grid-cols-3 gap-2">
        {ACTIONS.map((a) => (
          <div
            key={a}
            className="flex flex-col gap-1.5 rounded-xl bg-canvas p-2.5"
          >
            <ActionMark action={a} size="md" />
            <dd className="font-mono text-xl">{counts[a]}</dd>
            <dt className="order-last text-xs text-ink-muted">
              {ACTION_LABEL[a]}
            </dt>
          </div>
        ))}
      </dl>
    </section>
  )
}

function Upcoming({
  days,
  today,
}: {
  days: ReadonlyArray<Day> | undefined
  today: string
}) {
  const list = days ? upcomingEntries(days, today) : []
  return (
    <section
      aria-labelledby="up-title"
      className="flex flex-col gap-2 rounded-2xl border border-line bg-surface p-5"
    >
      <h2 id="up-title" className="text-lg font-semibold">
        Próximos agendamentos
      </h2>
      {!days ? (
        <Skeleton className="h-24 w-full" />
      ) : list.length === 0 ? (
        <p className="text-sm text-ink-muted">
          Nada agendado para as próximas duas semanas. Clique num dia do
          calendário para agendar.
        </p>
      ) : (
        <ul className="flex flex-col">
          {list.map((e) => (
            <li key={e.entry.id} className="border-t border-line-soft">
              <Link
                to="/topics/$topicId"
                params={{ topicId: String(e.topic.id) }}
                className="flex min-h-11 items-center justify-between gap-2.5 py-2 hover:bg-canvas"
              >
                <span className="flex min-w-0 flex-col">
                  <span className="font-medium">{e.topic.title}</span>
                  <span className="text-xs text-ink-muted">
                    {e.topic.roadmapName} › {e.topic.moduleTitle}
                  </span>
                </span>
                <span className="flex-none text-[13px] font-medium text-ink-strong">
                  {capitalize(relativeDay(e.date, today))}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

export type SchedulePageProps = {
  view: ScheduleView
  /** "yyyy-mm" no mês; domingo da semana em "yyyy-mm-dd" na semana. */
  period: string
  today: string
  days: ReadonlyArray<Day> | undefined
  error?: string | null
  upcoming: ReadonlyArray<Day> | undefined
  onViewChange: (view: ScheduleView) => void
  onPrev: () => void
  onNext: () => void
  onToday: () => void
  onOpenDay: (date: string) => void
  onRetry?: () => void
}

/** Agenda: calendário do mês (ou lista da semana), resumo do mês e próximos agendamentos. */
export function SchedulePage({
  view,
  period,
  today,
  days,
  error,
  upcoming,
  onViewChange,
  onPrev,
  onNext,
  onToday,
  onOpenDay,
  onRetry,
}: SchedulePageProps) {
  const byDate = new Map((days ?? []).map((d) => [d.date, d]))
  const month = view === 'month' ? period : monthOf(period)
  const isMonth = view === 'month'
  return (
    <div className="mx-auto flex w-full max-w-[1264px] flex-col gap-6 px-4 pt-8 pb-16 sm:px-8 sm:pt-10">
      <div className="flex flex-col items-start gap-3">
        <h1 className="text-[32px] leading-tight font-semibold tracking-tight text-ink-strong">
          Agenda
        </h1>
        <p className="text-ink-muted">
          O que você estudou, praticou ou concluiu, e o que está agendado daqui
          para frente. Clique num dia para agendar ou registrar o que fez.
        </p>
        <button
          type="button"
          disabled
          className="inline-flex h-11 items-center gap-2 rounded-xl border border-dashed border-line-control px-3.5 text-ink-strong"
        >
          <CalendarDays className="size-4 text-ink-muted" aria-hidden="true" />
          Conectar Google Agenda
          <span className="rounded-full bg-surface-sunken px-2 py-0.5 text-xs">
            Em breve
          </span>
        </button>
      </div>
      <div className="flex flex-wrap items-start gap-5">
        <section
          aria-labelledby="cal-title"
          className="flex min-w-0 flex-[1_1_640px] flex-col gap-4 rounded-2xl border border-line bg-surface p-3 sm:p-[18px]"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 id="cal-title" className="text-xl font-semibold">
              {isMonth ? monthLabel(period) : `Semana de ${weekLabel(period)}`}
            </h2>
            <div className="flex flex-wrap items-center gap-2">
              <div
                role="group"
                aria-label="Ver por"
                className="inline-flex rounded-xl bg-surface-sunken p-1"
              >
                {(
                  [
                    ['month', 'Mês'],
                    ['week', 'Semana'],
                  ] as const
                ).map(([k, label]) => (
                  <button
                    key={k}
                    type="button"
                    aria-pressed={view === k}
                    onClick={() => onViewChange(k)}
                    className={cn(
                      'h-8 rounded-lg px-3 text-sm',
                      view === k
                        ? 'bg-surface font-medium text-ink shadow-[0_1px_2px_rgb(21_23_26/0.12)]'
                        : 'text-ink-strong',
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <Button variant="outline" onClick={onToday}>
                Hoje
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={onPrev}
                aria-label={isMonth ? 'Mês anterior' : 'Semana anterior'}
              >
                <ChevronLeft />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={onNext}
                aria-label={isMonth ? 'Próximo mês' : 'Próxima semana'}
              >
                <ChevronRight />
              </Button>
            </div>
          </div>
          <Legend />
          {error ? (
            <div
              role="alert"
              className="flex flex-col items-start gap-3 rounded-xl bg-danger-soft p-4 text-danger"
            >
              Não foi possível carregar a agenda. {error}
              {onRetry && (
                <Button variant="outline" size="sm" onClick={onRetry}>
                  Tentar de novo
                </Button>
              )}
            </div>
          ) : !days ? (
            <div role="status" aria-label="Carregando a agenda">
              <Skeleton className="h-[520px] w-full" />
            </div>
          ) : isMonth ? (
            <MonthGrid
              month={period}
              days={byDate}
              today={today}
              onOpenDay={onOpenDay}
            />
          ) : (
            <WeekList
              start={period}
              days={byDate}
              today={today}
              onOpenDay={onOpenDay}
            />
          )}
        </section>
        <aside className="flex min-w-0 flex-[1_1_280px] flex-col gap-5 lg:max-w-[300px]">
          <MonthSummary month={month} days={days ?? []} />
          <Upcoming days={upcoming} today={today} />
        </aside>
      </div>
    </div>
  )
}
