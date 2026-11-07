import { useMemo, useRef, useState } from 'react'
import type { Schemas } from '@/lib/api/client'
import { actionWords } from '@/lib/actions'
import type { SessionAction } from '@/lib/actions'
import { addDays, formatPlan, parseISODate } from '@/lib/date'
import { cn } from '@/lib/utils'

type Day = Schemas['Activity']['days'][number]

const LEVEL = [
  'bg-heat-0',
  'bg-heat-1',
  'bg-heat-2',
  'bg-heat-3',
  'bg-heat-4',
] as const
/** Semanas visíveis em telas estreitas (casa com `[data-compact-heat]` no app.css). */
export const MOBILE_WEEKS = 12

const ROW_LABEL = ['', 'Seg', '', 'Qua', '', 'Sex', '']
const DOT: Record<SessionAction, string> = {
  studied: 'bg-chart-studying',
  practiced: 'bg-chart-practicing',
  completed: 'bg-chart-completed',
}

/** 0 sessões → 0; 1, 2, 3 → mesmo nível; 4 ou mais → 4. */
export const heatLevel = (count: number) =>
  count <= 0 ? 0 : Math.min(4, count)

export type HeatCell = { date: string; future: boolean; day: Day | null }

/** Monta a grade semana × dia (domingo a sábado) terminando na semana de `today`. */
export function buildGrid(
  days: ReadonlyArray<Day>,
  weeks: number,
  today: string,
): Array<{ label: string; cells: Array<HeatCell> }> {
  const byDate = new Map(days.map((d) => [d.date, d]))
  const weekStart = addDays(today, -parseISODate(today).getDay())
  const first = addDays(weekStart, -(weeks - 1) * 7)
  let lastMonth = -1
  return Array.from({ length: weeks }, (_, w) => {
    const sunday = addDays(first, w * 7)
    const month = parseISODate(sunday).getMonth()
    const label =
      month !== lastMonth
        ? parseISODate(sunday)
            .toLocaleDateString('pt-BR', { month: 'short' })
            .replace('.', '')
        : ''
    lastMonth = month
    return {
      label,
      cells: Array.from({ length: 7 }, (_cell, i) => {
        const date = addDays(sunday, i)
        return { date, future: date > today, day: byDate.get(date) ?? null }
      }),
    }
  })
}

const plural = (n: number, one: string, many: string) =>
  `${n} ${n === 1 ? one : many}`

export function dayLabel(cell: HeatCell): string {
  const count = cell.day?.count ?? 0
  const entries = cell.day?.entries ?? []
  const head = `${formatPlan(cell.date)}: ${
    count ? plural(count, 'registro', 'registros') : 'nenhum registro'
  }`
  if (!entries.length) return head
  return `${head}. ${entries
    .map(
      (e) =>
        `${e.title} (${actionWords(e.actions).toLocaleLowerCase('pt-BR')})`,
    )
    .join('; ')}`
}

/**
 * Mapa de calor das últimas semanas. Cada dia é um botão (uma parada de Tab;
 * setas andam pelos dias), com tooltip; há também uma tabela por semana para
 * leitores de tela.
 */
export function ActivityHeatmap({
  days,
  weeks,
  today,
  streak,
  onSelectDay,
  className,
}: {
  days: ReadonlyArray<Day>
  weeks: number
  today: string
  streak?: number
  onSelectDay?: (date: string) => void
  className?: string
}) {
  const grid = useMemo(
    () => buildGrid(days, weeks, today),
    [days, weeks, today],
  )
  const flat = grid.flatMap((w) => w.cells)
  const [active, setActive] = useState(today)
  const [tip, setTip] = useState<HeatCell | null>(null)
  const refs = useRef(new Map<string, HTMLButtonElement>())
  const wrap = useRef<HTMLDivElement>(null)
  const [tipPos, setTipPos] = useState<{ x: number; y: number } | null>(null)

  const past = flat.filter((c) => !c.future)
  const total = past.reduce((n, c) => n + (c.day?.count ?? 0), 0)
  const activeDays = past.filter((c) => (c.day?.count ?? 0) > 0).length
  const summary = `Atividade das últimas ${weeks} semanas: ${plural(total, 'registro', 'registros')} em ${plural(activeDays, 'dia', 'dias')}${
    streak !== undefined
      ? `. Sequência atual de ${plural(streak, 'dia', 'dias')}`
      : ''
  }.`

  const show = (cell: HeatCell | null) => {
    setTip(cell)
    if (!cell) return setTipPos(null)
    const el = refs.current.get(cell.date)
    const host = wrap.current
    if (!el || !host) return
    const r = el.getBoundingClientRect()
    const h = host.getBoundingClientRect()
    const x = Math.max(
      130,
      Math.min(h.width - 130, r.left - h.left + r.width / 2),
    )
    setTipPos({ x, y: r.top - h.top })
  }

  const move = (date: string, delta: number) => {
    const i = flat.findIndex((c) => c.date === date)
    const next = flat[i + delta]
    if (!next || next.future) return
    setActive(next.date)
    refs.current.get(next.date)?.focus()
  }

  const onKey = (e: React.KeyboardEvent, date: string) => {
    const deltas: Record<string, number> = {
      ArrowUp: -1,
      ArrowDown: 1,
      ArrowLeft: -7,
      ArrowRight: 7,
    }
    if (e.key in deltas) {
      e.preventDefault()
      move(date, deltas[e.key]!)
    } else if (e.key === 'Home') {
      e.preventDefault()
      move(date, -flat.findIndex((c) => c.date === date))
    } else if (e.key === 'End') {
      e.preventDefault()
      move(
        date,
        flat.findIndex((c) => c.date === today) -
          flat.findIndex((c) => c.date === date),
      )
    } else if (e.key === 'Escape') show(null)
  }

  return (
    <div ref={wrap} className={cn('relative flex flex-col gap-3.5', className)}>
      <div
        role="group"
        aria-label={summary}
        onMouseLeave={() => show(null)}
        className="grid max-w-[760px] grid-cols-[26px_repeat(var(--cols),minmax(0,1fr))] gap-[3px]"
        // No celular a grade mostra só as últimas semanas, para os dias não virarem riscos.
        style={
          {
            '--cols': weeks,
          } as React.CSSProperties
        }
        data-compact-heat={weeks > MOBILE_WEEKS ? '' : undefined}
      >
        <div
          aria-hidden="true"
          className="grid grid-rows-[14px_repeat(7,1fr)] gap-[3px] text-[10px] text-ink-soft"
        >
          <span />
          {ROW_LABEL.map((l, i) => (
            <span key={i} className="self-center">
              {l}
            </span>
          ))}
        </div>
        {grid.map((w, wi) => (
          <div
            key={w.cells[0]!.date}
            className={cn(
              'grid min-w-0 grid-rows-[14px_repeat(7,auto)] gap-[3px]',
              wi < weeks - MOBILE_WEEKS && 'max-sm:hidden',
            )}
          >
            <span
              aria-hidden="true"
              className="overflow-visible text-[10px] leading-[14px] whitespace-nowrap text-ink-soft"
            >
              {w.label}
            </span>
            {w.cells.map((c) =>
              c.future ? (
                <span
                  key={c.date}
                  aria-hidden="true"
                  className="aspect-square w-full"
                />
              ) : (
                <button
                  key={c.date}
                  ref={(el) => {
                    if (el) refs.current.set(c.date, el)
                    else refs.current.delete(c.date)
                  }}
                  type="button"
                  tabIndex={c.date === active ? 0 : -1}
                  aria-label={dayLabel(c)}
                  aria-current={c.date === today ? 'date' : undefined}
                  onMouseEnter={() => show(c)}
                  onFocus={() => {
                    setActive(c.date)
                    show(c)
                  }}
                  onBlur={() => show(null)}
                  onKeyDown={(e) => onKey(e, c.date)}
                  onClick={() => onSelectDay?.(c.date)}
                  className={cn(
                    'block aspect-square w-full min-w-0 rounded-[3px] p-0 transition-transform hover:scale-115 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ink',
                    LEVEL[heatLevel(c.day?.count ?? 0)],
                    c.date === today &&
                      'shadow-[inset_0_0_0_1.5px_var(--color-ink)]',
                  )}
                />
              ),
            )}
          </div>
        ))}
      </div>
      <div aria-hidden="true" className="flex max-w-[760px] justify-center">
        <span className="inline-flex items-center gap-1 text-xs text-ink-soft">
          Menos
          {LEVEL.map((l) => (
            <span key={l} className={cn('size-[11px] rounded-[3px]', l)} />
          ))}
          Mais
        </span>
      </div>
      {tip && tipPos && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute z-10 flex w-[260px] flex-col gap-1.5 rounded-xl bg-toast px-3 py-2.5 text-[13px] text-toast-fg shadow-menu"
          style={{
            left: tipPos.x,
            top: tipPos.y,
            transform: 'translate(-50%, calc(-100% - 8px))',
          }}
        >
          <strong className="font-semibold">{formatPlan(tip.date)}</strong>
          {tip.day?.entries.length ? (
            tip.day.entries.map((e) => (
              <span key={e.topicId} className="flex items-center gap-1.5">
                <span className="flex gap-[3px]">
                  {e.actions.map((a) => (
                    <span
                      key={a}
                      className={cn('size-2 rounded-full', DOT[a])}
                    />
                  ))}
                </span>
                <span className="min-w-0 flex-1 truncate">{e.title}</span>
                <span className="flex-none text-xs opacity-70">
                  {actionWords(e.actions).toLocaleLowerCase('pt-BR')}
                </span>
              </span>
            ))
          ) : (
            <span className="opacity-70">Nenhum registro neste dia</span>
          )}
        </div>
      )}
      <table className="sr-only">
        <caption>Registros por semana</caption>
        <thead>
          <tr>
            <th scope="col">Semana de</th>
            <th scope="col">Registros</th>
            <th scope="col">Dias com registro</th>
          </tr>
        </thead>
        <tbody>
          {grid.map((w) => {
            const ps = w.cells.filter((c) => !c.future)
            return (
              <tr key={w.cells[0]!.date}>
                <th scope="row">{formatPlan(w.cells[0]!.date)}</th>
                <td>{ps.reduce((n, c) => n + (c.day?.count ?? 0), 0)}</td>
                <td>{ps.filter((c) => (c.day?.count ?? 0) > 0).length}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
