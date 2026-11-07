import type { SessionAction } from '@/lib/actions'
import { ACTIONS } from '@/lib/actions'
import type { Schemas } from '@/lib/api/client'
import { addDays, capitalize, parseISODate, toISODate } from '@/lib/date'

type Day = Schemas['ScheduleDay']
type Ref = Schemas['TopicRef']

/** "2026-11" do dia. */
export const monthOf = (date: string) => date.slice(0, 7)

/** Mês somado de `n` ("2026-11" + 1 = "2026-12"). */
export function shiftMonth(month: string, n: number) {
  const [y, m] = month.split('-').map(Number)
  return toISODate(new Date(y!, m! - 1 + n, 1)).slice(0, 7)
}

/** Domingo da semana do dia. */
export function weekStart(date: string) {
  return addDays(date, -parseISODate(date).getDay())
}

/** Semanas (domingo a sábado) que cobrem o mês inteiro. */
export function monthGrid(month: string): Array<Array<string>> {
  const first = `${month}-01`
  const last = toISODate(
    new Date(
      parseISODate(first).getFullYear(),
      parseISODate(first).getMonth() + 1,
      0,
    ),
  )
  const weeks: Array<Array<string>> = []
  for (let d = weekStart(first); d <= last; d = addDays(d, 7))
    weeks.push(Array.from({ length: 7 }, (_, i) => addDays(d, i)))
  return weeks
}

/** "Novembro de 2026" */
export const monthLabel = (month: string) =>
  capitalize(
    parseISODate(`${month}-01`).toLocaleDateString('pt-BR', {
      month: 'long',
      year: 'numeric',
    }),
  )

/** "novembro" */
export const monthName = (month: string) =>
  parseISODate(`${month}-01`).toLocaleDateString('pt-BR', { month: 'long' })

/** "1 a 7 de nov" / "29 de nov a 5 de dez" */
export function weekLabel(start: string) {
  const end = addDays(start, 6)
  const f = (d: string, o: Intl.DateTimeFormatOptions) =>
    parseISODate(d).toLocaleDateString('pt-BR', o).replace(/\./g, '')
  return monthOf(start) === monthOf(end)
    ? `${f(start, { day: 'numeric' })} a ${f(end, { day: 'numeric', month: 'short' })}`
    : `${f(start, { day: 'numeric', month: 'short' })} a ${f(end, { day: 'numeric', month: 'short' })}`
}

export type CalendarItem =
  | { kind: 'work'; key: string; topic: Ref; actions: Array<SessionAction> }
  | {
      kind: 'plan' | 'late'
      key: string
      topic: Ref
      entry: Schemas['ScheduleEntry']
      stage: Schemas['Stage']
    }

/**
 * O que aparece num dia: o que foi feito (um item por tópico, com as atividades)
 * e o que está agendado. Agendamento de dia que passou só aparece se estiver atrasado.
 */
export function dayItems(day: Day, today: string): Array<CalendarItem> {
  const worked = new Map<number, { topic: Ref; actions: Set<SessionAction> }>()
  for (const s of day.sessions) {
    const w = worked.get(s.topic.id) ?? { topic: s.topic, actions: new Set() }
    for (const a of ACTIONS) if (s[a]) w.actions.add(a)
    worked.set(s.topic.id, w)
  }
  const items: Array<CalendarItem> = [...worked.values()].map((w) => ({
    kind: 'work',
    key: `w-${w.topic.id}`,
    topic: w.topic,
    actions: ACTIONS.filter((a) => w.actions.has(a)),
  }))
  for (const e of day.entries) {
    if (worked.has(e.topic.id)) continue
    const past = day.date < today
    if (past && !e.isLate) continue
    items.push({
      kind: past ? 'late' : 'plan',
      key: `e-${e.entry.id}`,
      topic: e.topic,
      entry: e.entry,
      stage: e.stage,
    })
  }
  return items
}

/** Resumo do mês: dias com registro e quantas vezes cada atividade aparece. */
export function monthStats(days: ReadonlyArray<Day>, month: string) {
  const counts: Record<SessionAction, number> = {
    studied: 0,
    practiced: 0,
    completed: 0,
  }
  let daysWorked = 0
  for (const d of days) {
    if (monthOf(d.date) !== month || !d.sessions.length) continue
    daysWorked++
    for (const s of d.sessions) for (const a of ACTIONS) if (s[a]) counts[a]++
  }
  return { daysWorked, counts }
}

/** Agendamentos de hoje em diante, sem os que já foram feitos no dia. */
export function upcomingEntries(days: ReadonlyArray<Day>, today: string) {
  return days
    .filter((d) => d.date >= today)
    .flatMap((d) =>
      d.entries
        .filter((e) => !d.sessions.some((s) => s.topic.id === e.topic.id))
        .map((e) => ({ date: d.date, ...e })),
    )
}

/** Texto do dia para leitores de tela: "sábado, 7 de novembro, 2 tópicos trabalhados, 1 agendado". */
export function dayAriaLabel(
  date: string,
  items: ReadonlyArray<CalendarItem>,
  today: string,
) {
  const nW = items.filter((i) => i.kind === 'work').length
  const nP = items.length - nW
  const base = parseISODate(date).toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })
  return [
    date === today ? `Hoje, ${base}` : base,
    nW
      ? `${nW} ${nW === 1 ? 'tópico trabalhado' : 'tópicos trabalhados'}`
      : null,
    nP ? `${nP} ${nP === 1 ? 'agendado' : 'agendados'}` : null,
  ]
    .filter(Boolean)
    .join(', ')
}

/** "Hoje", "Amanhã", "Ontem", "Há 3 dias", "Daqui a 5 dias". */
export function dayDistance(date: string, today: string) {
  const n = Math.round(
    (parseISODate(date).getTime() - parseISODate(today).getTime()) / 86_400_000,
  )
  if (n === 0) return 'Hoje'
  if (n === 1) return 'Amanhã'
  if (n === -1) return 'Ontem'
  return n < 0 ? `Há ${-n} dias` : `Daqui a ${n} dias`
}
