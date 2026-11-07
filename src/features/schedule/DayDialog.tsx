import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { X } from 'lucide-react'
import { useDeferredValue, useState } from 'react'
import { StageChip } from '@/components/StageChip'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { ACTIONS, actionWords } from '@/lib/actions'
import type { Schemas } from '@/lib/api/client'
import { searchQuery } from '@/lib/api/queries'
import { formatLong } from '@/lib/date'
import { cn } from '@/lib/utils'
import { dayDistance } from './calendar'

type Day = Schemas['ScheduleDay']
type Ref = Schemas['TopicRef']
type Tab = 'schedule' | 'log'

const where = (t: Ref) => `${t.roadmapName} › ${t.moduleTitle}`

/** O que foi feito no dia, um item por tópico. */
export function workedTopics(day: Day | undefined) {
  const by = new Map<
    number,
    { topic: Ref; actions: Set<(typeof ACTIONS)[number]> }
  >()
  for (const s of day?.sessions ?? []) {
    const w = by.get(s.topic.id) ?? { topic: s.topic, actions: new Set() }
    for (const a of ACTIONS) if (s[a]) w.actions.add(a)
    by.set(s.topic.id, w)
  }
  return [...by.values()].map((w) => ({
    topic: w.topic,
    words: actionWords(ACTIONS.filter((a) => w.actions.has(a))),
  }))
}

export type DayDialogProps = {
  date: string | null
  today: string
  day: Day | undefined
  onOpenChange: (open: boolean) => void
  onLog: (topicId: number) => void
  onMove: (topicId: number, entryId: number) => void
  onSchedule: (topicId: number) => void
  onRemove: (entryId: number, title: string) => void
  scheduling?: boolean
}

/** Modal do dia da agenda: o que está agendado ou registrado, e atalhos para agendar e registrar. */
export function DayDialog({ date, onOpenChange, ...rest }: DayDialogProps) {
  return (
    <Dialog open={date !== null} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[calc(100dvh-2rem)] flex-col gap-0 overflow-hidden bg-surface p-0 sm:max-w-[560px]">
        {date && (
          <DayBody
            key={date}
            date={date}
            onClose={() => onOpenChange(false)}
            {...rest}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}

function DayBody({
  date,
  today,
  day,
  onClose,
  onLog,
  onMove,
  onSchedule,
  onRemove,
  scheduling = false,
}: Omit<DayDialogProps, 'date' | 'onOpenChange'> & {
  date: string
  onClose: () => void
}) {
  const past = date < today
  const [tab, setTab] = useState<Tab>(past ? 'log' : 'schedule')
  const [q, setQ] = useState('')
  const query = useDeferredValue(q.trim())
  const search = useQuery(searchQuery(query, 'topics'))
  const entries = day?.entries ?? []
  const worked = workedTopics(day)
  const isSchedule = tab === 'schedule'
  const taken = new Set(
    isSchedule ? entries.map((e) => e.topic.id) : worked.map((w) => w.topic.id),
  )
  const results = (search.data?.items ?? []).filter(
    (r) => r.type === 'topic' && !taken.has(r.topic.id),
  )
  // No registro, os agendados do dia que ainda não foram feitos vêm primeiro.
  const pendingHere = isSchedule
    ? []
    : entries.filter((e) => !worked.some((w) => w.topic.id === e.topic.id))

  return (
    <>
      <DialogHeader className="gap-1 px-5 pt-6 pr-12 pb-4 sm:px-7">
        <DialogTitle className="text-[22px] font-semibold">
          {formatLong(date)}
        </DialogTitle>
        <DialogDescription className="text-[13px] text-ink-muted">
          {dayDistance(date, today)}
        </DialogDescription>
      </DialogHeader>
      <div className="flex min-h-0 flex-col gap-5 overflow-y-auto px-5 pb-5 sm:px-7">
        {date === today && (
          <div
            role="group"
            aria-label="O que fazer neste dia"
            className="inline-flex self-start rounded-xl bg-surface-sunken p-1"
          >
            {(
              [
                ['schedule', 'Agendar'],
                ['log', 'Registrar o que fiz'],
              ] as const
            ).map(([k, label]) => (
              <button
                key={k}
                type="button"
                aria-pressed={tab === k}
                onClick={() => setTab(k)}
                className={cn(
                  'h-9 rounded-lg px-3.5 text-[15px]',
                  tab === k
                    ? 'bg-surface font-medium text-ink shadow-[0_1px_2px_rgb(21_23_26/0.12)]'
                    : 'text-ink-strong',
                )}
              >
                {label}
              </button>
            ))}
          </div>
        )}

        {isSchedule
          ? entries.length > 0 && (
              <section
                aria-labelledby="day-current"
                className="flex flex-col gap-2"
              >
                <h3
                  id="day-current"
                  className="text-[13px] font-semibold text-ink-muted"
                >
                  Já agendado para este dia
                </h3>
                <ul className="flex flex-col gap-2">
                  {entries.map((e) => (
                    <li
                      key={e.entry.id}
                      className="flex flex-wrap items-center gap-2.5 rounded-xl border border-line px-3 py-2.5"
                    >
                      <Link
                        to="/topics/$topicId"
                        params={{ topicId: String(e.topic.id) }}
                        className="flex min-w-0 flex-[1_1_180px] flex-col hover:underline"
                      >
                        <span className="font-medium">{e.topic.title}</span>
                        <span className="text-xs text-ink-muted">
                          {where(e.topic)}
                        </span>
                      </Link>
                      <StageChip stage={e.stage} />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onMove(e.topic.id, e.entry.id)}
                      >
                        Trocar data
                      </Button>
                      <button
                        type="button"
                        aria-label={`Tirar ${e.topic.title} deste dia`}
                        title={`Tirar ${e.topic.title} deste dia`}
                        onClick={() => onRemove(e.entry.id, e.topic.title)}
                        className="grid size-8 place-items-center rounded-lg text-ink-muted hover:bg-canvas hover:text-ink"
                      >
                        <X className="size-4" aria-hidden="true" />
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            )
          : (worked.length > 0 || pendingHere.length > 0) && (
              <section
                aria-labelledby="day-current"
                className="flex flex-col gap-2"
              >
                <h3
                  id="day-current"
                  className="text-[13px] font-semibold text-ink-muted"
                >
                  {worked.length
                    ? 'Registrado neste dia'
                    : 'Agendado para este dia'}
                </h3>
                <ul className="flex flex-col gap-2">
                  {worked.map((w) => (
                    <li
                      key={w.topic.id}
                      className="flex flex-wrap items-center gap-2.5 rounded-xl border border-line px-3 py-2.5"
                    >
                      <span className="flex min-w-0 flex-[1_1_180px] flex-col">
                        <span className="font-medium">{w.topic.title}</span>
                        <span className="text-xs text-ink-muted">
                          {where(w.topic)}
                        </span>
                      </span>
                      <span className="rounded-full bg-surface-sunken px-2.5 py-1 text-xs font-medium text-ink-strong">
                        {w.words}
                      </span>
                    </li>
                  ))}
                  {pendingHere.map((e) => (
                    <li
                      key={e.entry.id}
                      className="flex flex-wrap items-center gap-2.5 rounded-xl border border-dashed border-line-control px-3 py-2.5"
                    >
                      <span className="flex min-w-0 flex-[1_1_180px] flex-col">
                        <span className="font-medium">{e.topic.title}</span>
                        <span
                          className={cn(
                            'text-xs',
                            e.isLate ? 'text-danger' : 'text-ink-muted',
                          )}
                        >
                          {e.isLate ? 'Atrasado · ' : 'Agendado · '}
                          {where(e.topic)}
                        </span>
                      </span>
                      {e.isLate && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onMove(e.topic.id, e.entry.id)}
                        >
                          Trocar data
                        </Button>
                      )}
                      <Button
                        size="sm"
                        onClick={() => onLog(e.topic.id)}
                        aria-label={`Registrar sessão em ${e.topic.title}`}
                      >
                        Registrar
                      </Button>
                    </li>
                  ))}
                </ul>
              </section>
            )}

        <section aria-labelledby="day-find" className="flex flex-col gap-2">
          <h3
            id="day-find"
            className="text-[13px] font-semibold text-ink-muted"
          >
            {isSchedule ? 'Agendar outro tópico' : 'Registrar outro tópico'}
          </h3>
          <label htmlFor="day-q" className="sr-only">
            Filtrar tópicos pelo nome
          </label>
          <Input
            id="day-q"
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Filtrar tópicos pelo nome"
            autoComplete="off"
          />
          {query.length < 2 ? (
            <p className="text-sm text-ink-muted">
              Digite pelo menos duas letras do nome do tópico.
            </p>
          ) : search.isPending ? (
            <p className="text-sm text-ink-muted">Procurando…</p>
          ) : results.length === 0 ? (
            <p className="text-sm text-ink-muted">Nenhum tópico encontrado.</p>
          ) : (
            <ul
              aria-label="Tópicos encontrados"
              className="flex flex-col gap-1.5"
            >
              {results.slice(0, 8).map((r) => (
                <li
                  key={r.id}
                  className="flex items-center gap-2.5 rounded-xl border border-line px-3 py-2"
                >
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate font-medium">
                      {r.topic.title}
                    </span>
                    <span className="truncate text-xs text-ink-muted">
                      {where(r.topic)}
                    </span>
                  </span>
                  <StageChip stage={r.stage} className="max-sm:hidden" />
                  {isSchedule ? (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={scheduling}
                      onClick={() => onSchedule(r.topic.id)}
                      aria-label={`Agendar ${r.topic.title} neste dia`}
                    >
                      Agendar
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onLog(r.topic.id)}
                      aria-label={`Registrar sessão em ${r.topic.title}`}
                    >
                      Registrar
                    </Button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
      <DialogFooter className="border-t border-line-soft px-5 py-4 sm:px-7">
        <Button variant="outline" size="lg" onClick={onClose}>
          Fechar
        </Button>
      </DialogFooter>
    </>
  )
}
