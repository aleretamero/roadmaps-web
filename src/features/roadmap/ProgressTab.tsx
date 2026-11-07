import { Link } from '@tanstack/react-router'
import { Plus } from 'lucide-react'
import { StageChip } from '@/components/StageChip'
import type { Schemas } from '@/lib/api/client'
import { formatShort, relativeDay, todayISO } from '@/lib/date'
import { stageLabel } from '@/lib/stage'
import { cn } from '@/lib/utils'

type Progress = Schemas['RoadmapProgress']
type ModuleNode = Schemas['ModuleNode']
type Topic = Schemas['TopicSummary']

const SEG = [
  { key: 'completed', bar: 'bg-chart-completed' },
  { key: 'practicing', bar: 'bg-chart-practicing' },
  { key: 'studying', bar: 'bg-chart-studying' },
  { key: 'planned', bar: 'bg-chart-planned' },
] as const

const plural = (n: number, one: string, many: string) =>
  `${n} ${n === 1 ? one : many}`

/** "Estudando desde 6 de nov · previsto hoje", "Não iniciado · atrasado (4 de nov)". */
export function topicMeta(
  t: Topic,
  today: string,
): { text: string; late: boolean } {
  const late = !!t.dueDate && t.dueDate < today && !t.startedOn
  const parts = [
    t.isOptional ? 'Opcional' : null,
    t.startedOn
      ? `${stageLabel[t.stage]} desde ${formatShort(t.startedOn)}`
      : 'Não iniciado',
    t.dueDate
      ? late
        ? `atrasado (${formatShort(t.dueDate)})`
        : t.dueDate >= today
          ? `previsto ${relativeDay(t.dueDate, today).toLocaleLowerCase('pt-BR')}`
          : null
      : null,
  ].filter(Boolean)
  return { text: parts.join(' · '), late }
}

const required = (m: ModuleNode) => m.topics.filter((t) => !t.isOptional)

function ModuleLink({
  m,
  className,
  children,
}: {
  m: ModuleNode
  className?: string
  children: React.ReactNode
}) {
  return (
    <Link
      to="/modules/$moduleId"
      params={{ moduleId: String(m.id) }}
      className={className}
    >
      {children}
    </Link>
  )
}

function ActiveModuleCard({ m, today }: { m: ModuleNode; today: string }) {
  const req = required(m)
  const done = req.filter((t) => t.stage === 'completed').length
  const pending = [...m.topics]
    .filter((t) => t.stage !== 'completed')
    .sort(
      (a, b) =>
        Number(a.isOptional) - Number(b.isOptional) || a.position - b.position,
    )
  const pct = req.length ? Math.round((done / req.length) * 100) : 0
  return (
    <article className="flex flex-col gap-2.5 rounded-[14px] border border-line bg-surface px-[18px] py-4">
      <div className="flex items-center justify-between gap-2.5">
        <h3 className="text-base font-semibold">
          <ModuleLink
            m={m}
            className="text-ink underline decoration-line-control underline-offset-[3px] hover:decoration-ink"
          >
            {m.title}
          </ModuleLink>
        </h3>
        <span className="font-mono text-[13px] text-ink-muted">
          <span className="sr-only">Concluídos: </span>
          {done}/{req.length}
        </span>
      </div>
      <div
        aria-hidden="true"
        className="h-1.5 overflow-hidden rounded-[3px] bg-surface-hover"
      >
        <div className="h-full bg-success" style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs text-ink-soft">
        {m.startedOn ? `Iniciado em ${formatShort(m.startedOn)} · ` : ''}
        {plural(pending.length, 'pendente', 'pendentes')}
      </span>
      {req.length > 0 && done === req.length && (
        <p className="font-medium text-success">
          Todos os tópicos obrigatórios concluídos.
        </p>
      )}
      <ul className="flex flex-col">
        {pending.map((t) => {
          const meta = topicMeta(t, today)
          return (
            <li
              key={t.id}
              className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5 border-t border-line-soft py-1.5"
            >
              <Link
                to="/topics/$topicId"
                params={{ topicId: String(t.id) }}
                className="flex min-h-10 min-w-0 flex-[1_1_160px] flex-col justify-center text-left text-ink hover:underline"
              >
                <span className="font-medium">{t.title}</span>
                <span
                  className={cn(
                    'text-xs',
                    meta.late ? 'text-danger' : 'text-ink-soft',
                  )}
                >
                  {meta.text}
                </span>
              </Link>
              <StageChip stage={t.stage} />
              <Link
                to="/topics/$topicId"
                params={{ topicId: String(t.id) }}
                search={{ log: 1 }}
                aria-label={`Registrar sessão em ${t.title}`}
                className="inline-flex h-8 flex-none items-center gap-1.5 rounded-lg border border-line-strong bg-surface px-2.5 text-[13px] font-medium hover:bg-canvas"
              >
                <Plus className="size-3.5" aria-hidden="true" />
                Registrar
              </Link>
            </li>
          )
        })}
      </ul>
    </article>
  )
}

function SmallModuleCard({
  m,
  sub,
  dim,
}: {
  m: ModuleNode
  sub: string
  dim?: boolean
}) {
  const req = required(m)
  const done = req.filter((t) => t.stage === 'completed').length
  const pct = req.length ? Math.round((done / req.length) * 100) : 0
  return (
    <article
      className={cn(
        'flex flex-col gap-2.5 rounded-2xl border border-line px-4 py-3.5',
        dim ? 'border-dashed bg-surface-raised' : 'bg-surface',
      )}
    >
      <ModuleLink
        m={m}
        className="flex min-w-0 flex-col gap-0.5 text-ink hover:underline"
      >
        <span className="font-semibold">{m.title}</span>
        <span className="text-xs text-ink-soft">{sub}</span>
      </ModuleLink>
      <div className="flex items-center gap-2.5">
        <span
          aria-hidden="true"
          className="h-1.5 flex-1 overflow-hidden rounded-[3px] bg-surface-hover"
        >
          <span
            className="block h-full bg-chart-completed"
            style={{ width: `${pct}%` }}
          />
        </span>
        <span className="font-mono text-xs text-ink-muted">
          {done}/{req.length}
        </span>
      </div>
    </article>
  )
}

function Group({
  label,
  items,
  render,
}: {
  label: string
  items: Array<ModuleNode>
  render: (m: ModuleNode) => React.ReactNode
}) {
  if (!items.length) return null
  return (
    <section aria-label={label} className="flex flex-col gap-2.5">
      <h2 className="flex items-baseline gap-2 text-base font-semibold">
        {label}
        <span className="text-[13px] font-normal text-ink-soft">
          {items.length}
        </span>
      </h2>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(min(260px,100%),1fr))] gap-3">
        {items.map((m) => (
          <div key={m.id}>{render(m)}</div>
        ))}
      </div>
    </section>
  )
}

/** Aba Progresso: barra por etapa e módulos agrupados por situação. */
export function ProgressTab({
  data,
  today = todayISO(),
}: {
  data: Progress
  today?: string
}) {
  const t = data.totals
  const sum = SEG.reduce((n, s) => n + t[s.key], 0)
  const aria = SEG.map((s) => `${stageLabel[s.key]} ${t[s.key]}`).join(', ')
  const active = data.groups.inProgress
  const topicsCount = (m: ModuleNode) =>
    plural(m.topics.length, 'tópico', 'tópicos')
  return (
    <div className="flex flex-col gap-6">
      <section
        aria-labelledby="rp-h"
        className="flex flex-wrap items-center gap-x-10 gap-y-4 rounded-2xl border border-line bg-surface px-[22px] py-5"
      >
        <div className="flex flex-col gap-0.5">
          <h2 id="rp-h" className="text-sm font-medium text-ink-muted">
            Progresso
          </h2>
          <span className="font-mono text-[40px] leading-none font-medium tracking-[-0.03em]">
            {data.progress.percent}%
          </span>
          <span className="text-[13px] text-ink-muted">
            {data.progress.completed} de {data.progress.total} tópicos
            obrigatórios
          </span>
        </div>
        <div className="flex min-w-0 flex-[1_1_360px] flex-col gap-2.5">
          <div
            role="img"
            aria-label={`Tópicos por etapa: ${aria}`}
            className="flex h-3.5 gap-0.5"
          >
            {sum === 0 ? (
              <span className="flex-1 rounded bg-surface-sunken" />
            ) : (
              SEG.filter((s) => t[s.key] > 0).map((s) => (
                <span
                  key={s.key}
                  title={`${stageLabel[s.key]}: ${t[s.key]}`}
                  className={cn('h-full rounded', s.bar)}
                  style={{ flex: `${t[s.key]} 1 0` }}
                />
              ))
            )}
          </div>
          <ul className="flex flex-wrap gap-x-5 gap-y-1.5 text-[13px] text-ink-strong">
            {SEG.map((s) => (
              <li key={s.key} className="inline-flex items-center gap-1.5">
                <span
                  aria-hidden="true"
                  className={cn('size-2.5 rounded-[3px]', s.bar)}
                />
                {stageLabel[s.key]}{' '}
                <strong className="font-mono font-medium">{t[s.key]}</strong>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {data.startedOn ? (
        <section aria-labelledby="now-title" className="flex flex-col gap-2.5">
          <h2
            id="now-title"
            className="flex items-baseline gap-2 text-base font-semibold"
          >
            Em andamento
            <span className="text-[13px] font-normal text-ink-soft">
              Roadmap iniciado em {formatShort(data.startedOn)}
            </span>
          </h2>
          {active.length === 0 ? (
            <p className="rounded-xl border border-dashed border-line-control bg-surface px-[18px] py-4 text-ink-muted">
              Nenhum módulo em andamento. Registre uma sessão num tópico para
              começar um módulo.
            </p>
          ) : (
            <div className="grid grid-cols-[repeat(auto-fit,minmax(min(360px,100%),1fr))] gap-3.5">
              {active.map((m) => (
                <ActiveModuleCard key={m.id} m={m} today={today} />
              ))}
            </div>
          )}
        </section>
      ) : (
        <p className="rounded-xl border border-dashed border-line-control bg-surface px-[18px] py-4 text-ink-muted">
          Este roadmap ainda não foi iniciado. Ele começa quando você registrar
          a primeira sessão.
        </p>
      )}

      <Group
        label="Próximos"
        items={data.groups.upcoming}
        render={(m) => (
          <SmallModuleCard
            m={m}
            sub={`${m.kind === 'optional' ? 'Opcional · ' : ''}${topicsCount(m)}`}
          />
        )}
      />
      <Group
        label="Concluídos"
        items={data.groups.completed}
        render={(m) => (
          <SmallModuleCard
            m={m}
            sub={
              m.startedOn
                ? `Iniciado em ${formatShort(m.startedOn)}`
                : topicsCount(m)
            }
          />
        )}
      />
      <Group
        label="Caminhos não escolhidos"
        items={data.groups.notChosen}
        render={(m) => (
          <SmallModuleCard
            m={m}
            sub="Alternativa · não conta no progresso"
            dim
          />
        )}
      />
    </div>
  )
}
