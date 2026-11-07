import { Link } from '@tanstack/react-router'
import { Plus } from 'lucide-react'
import { ActionMark } from '@/components/ActionMark'
import type { Schemas } from '@/lib/api/client'
import { actionWords } from '@/lib/actions'
import {
  diffDays,
  formatPlan,
  formatShort,
  formatWeekdayDay,
  formatWeekdayLong,
  relativeDay,
} from '@/lib/date'
import { stageLabel } from '@/lib/stage'
import { cn } from '@/lib/utils'
import { DashCard } from './DashCard'
import { useLogSession } from '@/components/LogSession'
import { useReschedule } from '@/components/Reschedule'

type Dashboard = Schemas['Dashboard']
type DashTopic = Schemas['DashboardTopic']

const where = (t: DashTopic) =>
  `${t.topic.roadmapName} › ${t.topic.moduleTitle}`

function TopicLink({
  item,
  className,
  children,
}: {
  item: DashTopic
  className?: string
  children: React.ReactNode
}) {
  return (
    <Link
      to="/topics/$topicId"
      params={{ topicId: String(item.topic.id) }}
      className={cn(
        'flex min-w-0 flex-col rounded-md text-left text-ink hover:underline',
        className,
      )}
    >
      {children}
    </Link>
  )
}

function RegisterLink({ item }: { item: DashTopic }) {
  const log = useLogSession()
  return (
    <button
      type="button"
      onClick={() => log(item.topic.id)}
      aria-label={`Registrar sessão em ${item.topic.title}`}
      className="inline-flex h-9 flex-none items-center gap-1.5 rounded-[10px] border border-ink bg-surface px-3 text-sm font-medium hover:bg-canvas"
    >
      <Plus className="size-3" strokeWidth={2.4} aria-hidden="true" />
      Registrar
    </button>
  )
}

/* ---------- Hoje ---------- */

export function TodayCard({
  date,
  items,
  resume,
  className,
}: {
  date: string
  items: Dashboard['today']
  resume: Dashboard['resume']
  className?: string
}) {
  const log = useLogSession()
  // Pendentes primeiro, depois os já registrados hoje.
  const sorted = [...items].sort(
    (a, b) =>
      Number(a.todayActions.length > 0) - Number(b.todayActions.length > 0),
  )
  return (
    <DashCard
      title="Hoje"
      aside={
        <span className="text-[13px] text-ink-muted">{formatPlan(date)}</span>
      }
      className={className}
    >
      {sorted.length === 0 ? (
        <div className="flex flex-col items-start gap-2.5 rounded-xl bg-canvas px-4 py-3.5">
          <span className="text-ink-strong">Nada agendado para hoje.</span>
          {resume && (
            <>
              <button
                type="button"
                onClick={() => log(resume.topic.id)}
                className="inline-flex h-10 items-center rounded-[10px] bg-ink px-3.5 font-medium text-surface hover:opacity-90"
              >
                Continuar “{resume.topic.title}”
              </button>
              <span className="text-xs text-ink-soft">
                Último registro{' '}
                {resume.lastSessionOn
                  ? relativeDay(resume.lastSessionOn, date).toLocaleLowerCase(
                      'pt-BR',
                    )
                  : '—'}{' '}
                · {resume.topic.roadmapName}
              </span>
            </>
          )}
        </div>
      ) : (
        <ul className="flex flex-col">
          {sorted.map((item) => {
            const done = item.todayActions.length > 0
            return (
              <li
                key={item.topic.id}
                className="flex min-h-14 items-center gap-3 border-t border-line-soft py-1.5"
              >
                <TopicLink item={item} className="flex-1">
                  <span
                    className={cn('font-medium', done && 'text-ink-strong')}
                  >
                    {item.topic.title}
                  </span>
                  <span className="text-xs text-ink-soft">{where(item)}</span>
                </TopicLink>
                {done ? (
                  <span className="inline-flex flex-none items-center gap-1">
                    {item.todayActions.map((a) => (
                      <ActionMark key={a} action={a} />
                    ))}
                    <span className="ml-1 text-[13px] font-medium text-success">
                      {actionWords(item.todayActions)}
                    </span>
                  </span>
                ) : (
                  <RegisterLink item={item} />
                )}
              </li>
            )
          })}
        </ul>
      )}
    </DashCard>
  )
}

/* ---------- Sua semana ---------- */

const WEEK_LABEL = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
const DOT: Record<Schemas['SessionAction'], string> = {
  studied: 'bg-chart-studying',
  practiced: 'bg-chart-practicing',
  completed: 'bg-chart-completed',
}

const plural = (n: number, one: string, many: string) =>
  `${n} ${n === 1 ? one : many}`

const FlameIcon = () => (
  <svg
    viewBox="0 0 16 16"
    fill="currentColor"
    aria-hidden="true"
    className="size-3"
  >
    <path d="M8.5 1s.6 2.6-1.3 4.6C5.6 7.3 4 8.6 4 10.8 4 13.1 5.8 15 8 15s4-1.8 4-4.2c0-2.1-1.2-3.2-1.7-3.8 0 1.3-.7 2-1.4 2 .9-2.7-.4-5.6-.4-8z" />
  </svg>
)

export function WeekCard({
  date,
  week,
  streak,
  weekStats,
  topics,
  className,
}: {
  date: string
  week: Dashboard['week']
  streak: Dashboard['streak']
  weekStats: Dashboard['weekStats']
  topics: Dashboard['topics']
  className?: string
}) {
  const up = weekStats.topicsWorked >= weekStats.topicsWorkedLastWeek
  const stats = [
    {
      label: 'Tópicos nesta semana',
      value: weekStats.topicsWorked,
      sub: `${up ? '↑' : '↓'} antes ${weekStats.topicsWorkedLastWeek}`,
      tone: up ? 'text-success' : 'text-warning',
    },
    {
      label: 'Em andamento',
      value: topics.inProgress,
      sub: topics.stalled
        ? plural(topics.stalled, 'parado', 'parados')
        : 'nenhum parado',
      tone: topics.stalled ? 'text-warning' : 'text-ink-soft',
    },
    {
      label: 'Concluídos',
      value: topics.completed,
      sub: `de ${topics.required}`,
      tone: 'text-ink-soft',
    },
  ]
  return (
    <DashCard
      title="Sua semana"
      className={cn('gap-4', className)}
      aside={
        <span
          className={cn(
            'inline-flex h-[26px] items-center gap-1.5 rounded-full px-2.5 text-[13px] font-semibold',
            streak.current
              ? 'bg-stage-practicing text-stage-practicing-fg'
              : 'bg-surface-sunken text-ink-soft',
          )}
        >
          <FlameIcon />
          {streak.current
            ? plural(streak.current, 'dia seguido', 'dias seguidos')
            : 'Sem sequência'}
        </span>
      }
    >
      <ol
        aria-label="Dias desta semana"
        className="grid grid-cols-7 gap-1 sm:gap-1.5"
      >
        {week.map((d, i) => {
          const isToday = d.date === date
          const future = d.date > date
          const worked = d.workedActions.length
          const planned = d.date >= date ? d.plannedCount : 0
          const label = `${formatWeekdayLong(d.date)}: ${
            worked
              ? plural(worked, 'tópico trabalhado', 'tópicos trabalhados')
              : 'nada registrado'
          }${planned ? `, ${plural(planned, 'agendado', 'agendados')}` : ''}`
          return (
            <li
              key={d.date}
              aria-label={label}
              aria-current={isToday ? 'date' : undefined}
              className={cn(
                'flex min-w-0 flex-col items-center gap-1.5 rounded-xl px-0.5 py-2.5',
                isToday
                  ? 'bg-surface shadow-[inset_0_0_0_2px_var(--color-ink)]'
                  : worked
                    ? 'bg-day-active'
                    : future
                      ? 'bg-surface shadow-ring-inset'
                      : 'bg-canvas',
              )}
            >
              <span
                className={cn(
                  'text-[11px] font-semibold tracking-[0.04em] uppercase',
                  isToday ? 'text-ink' : 'text-ink-soft',
                )}
              >
                {WEEK_LABEL[i]}
              </span>
              <span
                className={cn(
                  'text-[15px] font-semibold',
                  future ? 'text-ink-soft' : 'text-ink',
                )}
              >
                {Number(d.date.slice(8))}
              </span>
              <span
                aria-hidden="true"
                className="flex h-2.5 items-center gap-0.5"
              >
                {d.workedActions.slice(0, 4).map((a, k) => (
                  <span
                    key={k}
                    className={cn('size-[7px] rounded-full', DOT[a])}
                  />
                ))}
                {Array.from(
                  { length: Math.max(0, Math.min(planned, 4 - worked)) },
                  (_, k) => (
                    <span
                      key={`p${k}`}
                      className="size-[7px] rounded-full border-[1.5px] border-dashed border-ink-faint"
                    />
                  ),
                )}
              </span>
            </li>
          )
        })}
      </ol>
      <dl className="grid grid-cols-3 gap-3 border-t border-surface-sunken pt-3.5">
        {stats.map((s) => (
          <div key={s.label} className="flex min-w-0 flex-col gap-0.5">
            <dt className="text-xs text-ink-soft">{s.label}</dt>
            <dd className="flex flex-wrap items-baseline gap-x-[5px]">
              <span className="font-mono text-[22px] leading-[1.1] font-medium">
                {s.value}
              </span>
              <span className={cn('text-xs', s.tone)}>{s.sub}</span>
            </dd>
          </div>
        ))}
      </dl>
    </DashCard>
  )
}

/* ---------- Roadmaps ---------- */

const SEGMENTS = [
  { key: 'completed', bar: 'bg-chart-completed' },
  { key: 'practicing', bar: 'bg-chart-practicing' },
  { key: 'studying', bar: 'bg-chart-studying' },
  { key: 'planned', bar: 'bg-chart-planned' },
] as const

export function roadmapLine(
  r: Schemas['RoadmapSummary'],
  today: string,
): string {
  if (!r.startedOn) return 'Não iniciado'
  const now = r.currentModules.length
    ? `Agora: ${r.currentModules.join(', ')}`
    : r.progress.percent === 100
      ? 'Concluído'
      : 'Nenhum módulo em andamento'
  const next =
    r.nextTopic && r.nextTopicDate
      ? ` · próximo: ${r.nextTopic.title} ${relativeDay(r.nextTopicDate, today).toLocaleLowerCase('pt-BR')}`
      : ''
  return now + next
}

export function RoadmapsCard({
  date,
  roadmaps,
  className,
}: {
  date: string
  roadmaps: Dashboard['roadmaps']
  className?: string
}) {
  const sorted = [...roadmaps].sort(
    (a, b) =>
      Number(!!b.startedOn) - Number(!!a.startedOn) ||
      b.progress.percent - a.progress.percent,
  )
  return (
    <DashCard
      title="Roadmaps"
      className={cn('gap-3.5', className)}
      aside={
        sorted.length > 0 && (
          <ul
            aria-label="Legenda"
            className="flex flex-wrap gap-x-3.5 gap-y-1 text-xs text-ink-muted"
          >
            {SEGMENTS.map((s) => (
              <li key={s.key} className="inline-flex items-center gap-1.5">
                <span
                  aria-hidden="true"
                  className={cn('size-2.5 rounded-[3px]', s.bar)}
                />
                {stageLabel[s.key]}
              </li>
            ))}
          </ul>
        )
      }
    >
      {sorted.length === 0 ? (
        <div className="flex flex-col items-start gap-2.5 rounded-xl bg-canvas px-4 py-3.5">
          <span className="text-ink-strong">Você ainda não tem roadmaps.</span>
          <Link
            to="/roadmaps/new"
            className="inline-flex h-10 items-center rounded-[10px] bg-ink px-3.5 font-medium text-surface hover:opacity-90"
          >
            Criar o primeiro roadmap
          </Link>
        </div>
      ) : (
        <ul className="flex flex-col">
          {sorted.map((r) => {
            const sub = roadmapLine(r, date)
            const total = SEGMENTS.reduce((n, s) => n + r.stageCounts[s.key], 0)
            return (
              <li key={r.id} className="border-t border-line-soft py-3">
                <Link
                  to="/roadmaps/$roadmapId"
                  params={{ roadmapId: String(r.id) }}
                  className="-mx-2 -my-1.5 flex flex-col gap-2 rounded-[10px] px-2 py-1.5 text-ink hover:bg-canvas"
                >
                  <span className="flex items-baseline justify-between gap-3">
                    <span className="font-semibold">{r.name}</span>
                    <span className="font-mono text-sm">
                      {r.progress.percent}%
                    </span>
                  </span>
                  <span aria-hidden="true" className="flex h-2.5 gap-0.5">
                    {total === 0 ? (
                      <span className="flex-1 rounded-[4px] bg-surface-sunken" />
                    ) : (
                      SEGMENTS.filter((s) => r.stageCounts[s.key] > 0).map(
                        (s) => (
                          <span
                            key={s.key}
                            title={`${stageLabel[s.key]}: ${r.stageCounts[s.key]}`}
                            className={cn('h-full rounded-[4px]', s.bar)}
                            style={{ flex: `${r.stageCounts[s.key]} 1 0` }}
                          />
                        ),
                      )
                    )}
                  </span>
                  <span className="text-[13px] text-ink-muted">{sub}</span>
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </DashCard>
  )
}

/* ---------- Próximos 7 dias ---------- */

export function NextDaysCard({
  date,
  days,
  className,
}: {
  date: string
  days: Dashboard['next7Days']
  className?: string
}) {
  const withTopics = days.filter((d) => d.topics.length > 0)
  return (
    <DashCard
      title="Próximos 7 dias"
      className={cn('gap-2.5', className)}
      aside={
        <Link to="/schedule" className="text-[13px] text-link hover:underline">
          Abrir agenda
        </Link>
      }
    >
      {withTopics.length === 0 ? (
        <p className="text-sm text-ink-soft">
          Nada agendado para os próximos dias.
        </p>
      ) : (
        withTopics.map((d) => (
          <div
            key={d.date}
            className="grid grid-cols-[72px_minmax(0,1fr)] gap-2.5 border-t border-line-soft py-2"
          >
            <span className="pt-[3px] text-[13px] font-semibold text-ink-strong">
              {diffDays(date, d.date) === 1
                ? 'Amanhã'
                : formatWeekdayDay(d.date)}
            </span>
            <div className="flex flex-wrap gap-1.5">
              {d.topics.map((t) => (
                <Link
                  key={t.topic.id}
                  to="/topics/$topicId"
                  params={{ topicId: String(t.topic.id) }}
                  title={where(t)}
                  className="inline-flex h-7 max-w-full items-center truncate rounded-full border border-dashed border-ink-faint bg-surface px-2.5 text-[13px] text-ink hover:bg-canvas"
                >
                  <span className="truncate">{t.topic.title}</span>
                </Link>
              ))}
            </div>
          </div>
        ))
      )}
    </DashCard>
  )
}

/* ---------- Precisa de atenção ---------- */

export function attentionReason(t: DashTopic, today: string): string {
  if (t.attentionReason === 'stalled') {
    const last = t.lastSessionOn
    return last
      ? `Sem sessão há ${diffDays(last, today)} dias`
      : 'Sem sessão recente'
  }
  return t.dueDate
    ? `Estava agendado para ${formatShort(t.dueDate)} e não começou`
    : 'Data perdida'
}

export function AttentionCard({
  date,
  items,
  className,
}: {
  date: string
  items: Dashboard['attention']
  className?: string
}) {
  const log = useLogSession()
  const reschedule = useReschedule()
  return (
    <DashCard
      title="Precisa de atenção"
      className={cn('gap-2.5', className)}
      aside={
        items.length ? (
          <span className="text-[13px] text-ink-muted">{items.length}</span>
        ) : undefined
      }
    >
      {items.length === 0 ? (
        <p className="text-sm text-success">
          Tudo em dia. Nenhum tópico parado ou com data perdida.
        </p>
      ) : (
        <ul className="flex flex-col">
          {items.slice(0, 6).map((t) => (
            <li
              key={`${t.attentionReason}-${t.topic.id}`}
              className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5 border-t border-line-soft py-2.5"
            >
              <TopicLink item={t} className="flex-[1_1_160px]">
                <span className="font-medium">{t.topic.title}</span>
                <span className="text-xs text-warning">
                  {attentionReason(t, date)} · {t.topic.roadmapName}
                </span>
              </TopicLink>
              {t.attentionReason === 'stalled' ? (
                <button
                  type="button"
                  onClick={() => log(t.topic.id)}
                  aria-label={`Registrar sessão em ${t.topic.title}`}
                  className="inline-flex h-8 flex-none items-center rounded-lg border border-line-strong bg-surface px-2.5 text-[13px] font-medium hover:bg-canvas"
                >
                  Registrar
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => reschedule(t.topic.id, { mode: 'move' })}
                  aria-label={`Reagendar ${t.topic.title}`}
                  className="inline-flex h-8 flex-none items-center rounded-lg border border-line-strong bg-surface px-2.5 text-[13px] font-medium hover:bg-canvas"
                >
                  Reagendar
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </DashCard>
  )
}
