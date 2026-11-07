import type { Schemas } from '@/lib/api/client'
import { addDays, parseISODate } from '@/lib/date'
import { buildGraph } from './mapLayout'

type Roadmap = Schemas['RoadmapDetail']
export type Weekday = Schemas['Weekday']

export const WEEKDAYS: ReadonlyArray<{
  day: Weekday
  short: string
  full: string
}> = [
  { day: 'sunday', short: 'D', full: 'Domingo' },
  { day: 'monday', short: 'S', full: 'Segunda-feira' },
  { day: 'tuesday', short: 'T', full: 'Terça-feira' },
  { day: 'wednesday', short: 'Q', full: 'Quarta-feira' },
  { day: 'thursday', short: 'Q', full: 'Quinta-feira' },
  { day: 'friday', short: 'S', full: 'Sexta-feira' },
  { day: 'saturday', short: 'S', full: 'Sábado' },
]

export const weekdayOf = (date: string) =>
  WEEKDAYS[parseISODate(date).getDay()]!.day

export type Candidate = {
  topicId: number
  title: string
  moduleTitle: string
  dueDate: string | null
}
export type LeftOut = {
  completed: number
  started: number
  hasDate: number
  optional: number
  notChosen: number
}

/**
 * Tópicos que o agendamento automático pode distribuir, na ordem do roadmap
 * (camada do módulo, depois posição), e quantos ficaram de fora por motivo.
 */
export function autoCandidates(
  r: Roadmap,
  opts: { includeOptional: boolean; reschedule: boolean },
): { items: Array<Candidate>; left: LeftOut } {
  const g = buildGraph(r)
  const left: LeftOut = {
    completed: 0,
    started: 0,
    hasDate: 0,
    optional: 0,
    notChosen: 0,
  }
  const items: Array<Candidate> = []
  const mods = [...r.modules].sort(
    (a, b) =>
      (g.level.get(a.id) ?? 0) - (g.level.get(b.id) ?? 0) ||
      a.position - b.position,
  )
  for (const m of mods) {
    const kind = g.kind.get(m.id)
    for (const t of [...m.topics].sort((a, b) => a.position - b.position)) {
      if (t.stage === 'completed') left.completed++
      else if (kind === 'alt') left.notChosen++
      else if ((kind === 'optional' || t.isOptional) && !opts.includeOptional)
        left.optional++
      else if (t.startedOn) left.started++
      else if (t.dueDate && !opts.reschedule) left.hasDate++
      else
        items.push({
          topicId: t.id,
          title: t.title,
          moduleTitle: m.title,
          dueDate: t.dueDate,
        })
    }
  }
  return { items, left }
}

/** "Ficaram de fora: 2 concluídos, 1 já iniciado…" (vazio se nada ficou de fora). */
export function leftOutText(left: LeftOut, unchecked: number) {
  const n = (k: number, one: string, many: string) =>
    k ? `${k} ${k === 1 ? one : many}` : null
  const parts = [
    n(left.completed, 'concluído', 'concluídos'),
    n(left.started, 'já iniciado', 'já iniciados'),
    n(left.hasDate, 'que já tem data', 'que já têm data'),
    n(left.optional, 'opcional', 'opcionais'),
    n(left.notChosen, 'de caminho não escolhido', 'de caminho não escolhido'),
    n(unchecked, 'desmarcado', 'desmarcados'),
  ].filter(Boolean)
  return parts.length ? `Ficaram de fora: ${parts.join(', ')}.` : ''
}

/** Semanas (domingo a sábado) da prévia: de 2 a 5, a partir da semana do início. */
export function previewWeeks(
  start: string,
  lastDate: string | null,
): Array<Array<string>> {
  const w0 = addDays(start, -parseISODate(start).getDay())
  const span = lastDate
    ? Math.ceil(
        (parseISODate(lastDate).getTime() - parseISODate(w0).getTime()) /
          86_400_000 /
          7 +
          1 / 7,
      )
    : 2
  const n = Math.max(2, Math.min(5, span))
  return Array.from({ length: n }, (_w, w) =>
    Array.from({ length: 7 }, (_, i) => addDays(w0, w * 7 + i)),
  )
}
