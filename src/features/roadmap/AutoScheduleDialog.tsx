import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { toast } from 'sonner'
import { DatePicker } from '@/components/DatePicker'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import type { Schemas } from '@/lib/api/client'
import { errorMessage } from '@/lib/api/errors'
import {
  preferencesQuery,
  schedulePreviewQuery,
  useApplySchedule,
} from '@/lib/api/queries'
import { formatPlan, formatShort, parseISODate, todayISO } from '@/lib/date'
import { useDebounced } from '@/lib/useDebounced'
import { cn } from '@/lib/utils'
import {
  WEEKDAYS,
  autoCandidates,
  leftOutText,
  previewWeeks,
  weekdayOf,
} from './autoSchedule'
import type { Weekday } from './autoSchedule'

type Roadmap = Schemas['RoadmapDetail']

const lower = (s: string) => s.toLocaleLowerCase('pt-BR')

export type AutoScheduleDialogProps = {
  roadmap: Roadmap
  open: boolean
  onOpenChange: (open: boolean) => void
  today?: string
}

/** Agendar automaticamente: um tópico por dia de estudo, com prévia antes de gravar. */
export function AutoScheduleDialog({
  roadmap,
  open,
  onOpenChange,
  today,
}: AutoScheduleDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[calc(100dvh-2rem)] flex-col gap-0 overflow-hidden bg-surface p-0 sm:max-w-[820px]">
        {open && (
          <AutoScheduleBody
            roadmap={roadmap}
            today={today ?? todayISO()}
            onClose={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}

function AutoScheduleBody({
  roadmap,
  today,
  onClose,
}: {
  roadmap: Roadmap
  today: string
  onClose: () => void
}) {
  const prefs = useQuery(preferencesQuery())
  const [daysSel, setDays] = useState<Array<Weekday> | null>(null)
  const [incOptSel, setIncOpt] = useState<boolean | null>(null)
  const [start, setStart] = useState(today)
  const [reschedule, setReschedule] = useState(false)
  const [off, setOff] = useState<ReadonlyArray<number>>([])
  const days = daysSel ?? prefs.data?.studyDays ?? []
  const includeOptional = incOptSel ?? prefs.data?.includeOptional ?? false

  const { items, left } = autoCandidates(roadmap, {
    includeOptional,
    reschedule,
  })
  const selected = items.filter((i) => !off.includes(i.topicId))
  const body: Schemas['SchedulePreviewRequest'] = {
    startDate: start,
    includeOptional,
    topicIds: selected.map((i) => i.topicId),
    studyDays: days,
    replaceExisting: reschedule,
  }
  const debounced = useDebounced(body, 300)
  const problem = !days.length
    ? 'Escolha pelo menos um dia da semana.'
    : !start
      ? 'Escolha a data de início.'
      : start < today
        ? 'Comece hoje ou num dia futuro.'
        : !selected.length
          ? 'Nenhum tópico selecionado para agendar.'
          : null
  const preview = useQuery({
    ...schedulePreviewQuery(roadmap.id, debounced),
    enabled:
      !problem && !!debounced.topicIds?.length && !!debounced.studyDays?.length,
    placeholderData: keepPreviousData,
  })
  const apply = useApplySchedule(roadmap.id)
  const stale =
    JSON.stringify(debounced) !== JSON.stringify(body) ||
    preview.isPlaceholderData
  const dateOf = new Map(
    (preview.data?.items ?? []).map((i) => [i.topicId, i.date]),
  )
  const dates = [...new Set(preview.data?.items.map((i) => i.date))].sort()
  const byDate = new Map<string, Array<string>>()
  for (const i of preview.data?.items ?? [])
    byDate.set(i.date, [...(byDate.get(i.date) ?? []), i.title])
  const weeks = previewWeeks(start || today, dates.at(-1) ?? null)
  const shownEnd = weeks.at(-1)!.at(-1)!
  const beyond = dates.filter((d) => d > shownEnd).length
  const n = preview.data?.items.length ?? 0
  const summary = problem
    ? problem
    : !preview.data
      ? 'Calculando a prévia…'
      : n === 0
        ? 'Nenhum tópico para agendar.'
        : `${n} ${n === 1 ? 'tópico' : 'tópicos'} em ${dates.length} ${dates.length === 1 ? 'dia' : 'dias'} · termina ${lower(formatPlan(dates.at(-1)!))}` +
          (beyond
            ? ` (+${beyond} ${beyond === 1 ? 'dia' : 'dias'} depois do que aparece aqui)`
            : '')
  const leftText = leftOutText(left, items.length - selected.length)
  const canSave = !problem && !stale && n > 0 && !apply.isPending

  return (
    <>
      <DialogHeader className="gap-1 px-5 pt-6 pr-12 pb-4 text-left sm:px-7">
        <DialogTitle className="text-[22px] font-semibold">
          Agendar automaticamente
        </DialogTitle>
        <DialogDescription className="text-[13px] text-ink-muted">
          {roadmap.name} · um tópico por dia, na ordem do roadmap e no caminho
          escolhido
        </DialogDescription>
      </DialogHeader>
      <div className="flex min-h-0 flex-col gap-5 overflow-y-auto px-5 pb-5 sm:px-7">
        <div className="flex flex-wrap items-start gap-x-6 gap-y-4">
          <div className="flex flex-col gap-2">
            <span id="as-days" className="text-[13px] text-ink-strong">
              Em quais dias
            </span>
            <div role="group" aria-labelledby="as-days" className="flex gap-1">
              {WEEKDAYS.map((w) => {
                const on = days.includes(w.day)
                return (
                  <button
                    key={w.day}
                    type="button"
                    aria-pressed={on}
                    aria-label={w.full}
                    title={w.full}
                    onClick={() =>
                      setDays(
                        on ? days.filter((d) => d !== w.day) : [...days, w.day],
                      )
                    }
                    className={cn(
                      'size-[34px] rounded-lg text-xs font-semibold',
                      on
                        ? 'bg-ink text-surface'
                        : 'border border-line-control bg-surface text-ink-strong',
                    )}
                  >
                    {w.short}
                  </button>
                )
              })}
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <span className="text-[13px] text-ink-strong">A partir de</span>
            <DatePicker
              value={start}
              onChange={setStart}
              label="Data de início do agendamento"
              placeholder="Escolher data de início"
              min={today}
              align="start"
              buttonClassName="h-[34px] px-3 text-sm border-line-control"
            />
          </div>
          <div className="flex flex-col gap-2 pt-1">
            <label
              htmlFor="as-resched"
              className="flex items-center gap-2 text-[15px]"
            >
              <Checkbox
                id="as-resched"
                checked={reschedule}
                onCheckedChange={(v) => setReschedule(v === true)}
              />
              Reagendar os que já têm data
            </label>
            <label
              htmlFor="as-opt"
              className="flex items-center gap-2 text-[15px]"
            >
              <Checkbox
                id="as-opt"
                checked={includeOptional}
                onCheckedChange={(v) => setIncOpt(v === true)}
              />
              Incluir opcionais
            </label>
          </div>
        </div>

        <div className="flex flex-wrap items-start gap-5">
          <section
            aria-labelledby="as-topics"
            className="flex min-w-0 flex-[1_1_320px] flex-col gap-2"
          >
            <div className="flex items-center justify-between text-[13px]">
              <h3 id="as-topics" className="text-ink-strong">
                Tópicos
              </h3>
              <span className="text-ink-muted">
                {selected.length} de {items.length} selecionados
              </span>
            </div>
            {items.length === 0 ? (
              <p className="rounded-xl border border-dashed border-line-control p-4 text-sm text-ink-muted">
                Nenhum tópico sem data para agendar. Marque “Reagendar os que já
                têm data” para incluir os que já têm.
              </p>
            ) : (
              <ul className="flex max-h-[300px] flex-col overflow-y-auto rounded-xl border border-line">
                {items.map((it) => {
                  const on = !off.includes(it.topicId)
                  const when = !on
                    ? 'fora do agendamento'
                    : dateOf.has(it.topicId) && !stale
                      ? lower(formatPlan(dateOf.get(it.topicId)!))
                      : '…'
                  return (
                    <li
                      key={it.topicId}
                      className={cn(
                        'flex items-start gap-3 border-t border-line-soft px-3 py-2.5 first:border-t-0',
                        !on && 'opacity-60',
                      )}
                    >
                      <Checkbox
                        id={`as-${it.topicId}`}
                        checked={on}
                        onCheckedChange={(v) =>
                          setOff(
                            v === true
                              ? off.filter((x) => x !== it.topicId)
                              : [...off, it.topicId],
                          )
                        }
                        className="mt-0.5"
                      />
                      <label
                        htmlFor={`as-${it.topicId}`}
                        className="flex min-w-0 flex-col"
                      >
                        <span className="font-medium">{it.title}</span>
                        <span
                          className={cn(
                            'text-xs',
                            on ? 'text-link' : 'text-ink-soft',
                          )}
                        >
                          {it.moduleTitle} ·{' '}
                          <span data-testid="auto-date">{when}</span>
                          {it.dueDate &&
                            on &&
                            ` (era ${formatShort(it.dueDate)})`}
                        </span>
                      </label>
                    </li>
                  )
                })}
              </ul>
            )}
            {leftText && <p className="text-xs text-ink-muted">{leftText}</p>}
          </section>

          <section
            aria-label="Prévia"
            className="flex min-w-0 flex-[1_1_320px] flex-col gap-2 rounded-xl bg-canvas p-3"
          >
            <div
              aria-hidden="true"
              className="grid grid-cols-7 gap-1 text-center text-[11px] text-ink-muted"
            >
              {WEEKDAYS.map((w) => (
                <span key={w.day}>{w.short}</span>
              ))}
            </div>
            <div
              role="img"
              aria-label={`Prévia no calendário: ${summary}`}
              className="flex flex-col gap-1"
            >
              {weeks.map((wk) => (
                <div key={wk[0]} className="grid grid-cols-7 gap-1">
                  {wk.map((d) => {
                    const titles = byDate.get(d) ?? []
                    const before = d < (start || today)
                    const offDay = !days.includes(weekdayOf(d))
                    return (
                      <span
                        key={d}
                        title={
                          titles.length
                            ? `${formatShort(d)}: ${titles.join(', ')}`
                            : formatShort(d)
                        }
                        className={cn(
                          'relative grid h-8 place-items-center rounded-md text-xs',
                          titles.length && !stale
                            ? 'bg-ink font-semibold text-surface'
                            : before
                              ? 'text-ink-faint'
                              : offDay
                                ? 'bg-surface-sunken text-ink-soft'
                                : 'bg-surface text-ink-strong',
                          d === today && !titles.length && 'ring-1 ring-ink',
                        )}
                      >
                        {parseISODate(d).getDate()}
                        {titles.length > 0 && !stale && (
                          <span className="absolute bottom-0.5 flex gap-0.5">
                            {titles.slice(0, 4).map((_, i) => (
                              <span
                                key={i}
                                className="size-1 rounded-full bg-surface"
                              />
                            ))}
                          </span>
                        )}
                      </span>
                    )
                  })}
                </div>
              ))}
            </div>
            <p
              aria-live="polite"
              className={cn(
                'text-[13px]',
                problem ? 'text-danger' : 'text-ink-strong',
              )}
            >
              {summary}
            </p>
            {preview.error && (
              <p role="alert" className="text-sm text-danger">
                Não foi possível calcular a prévia.{' '}
                {errorMessage(preview.error)}
              </p>
            )}
          </section>
        </div>
        {apply.error && (
          <p
            role="alert"
            className="rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger"
          >
            {errorMessage(apply.error)}
          </p>
        )}
      </div>
      <DialogFooter className="border-t border-line-soft px-5 py-4 sm:px-7">
        <Button variant="outline" size="lg" onClick={onClose}>
          Cancelar
        </Button>
        <Button
          size="lg"
          disabled={!canSave}
          onClick={() =>
            apply.mutate(body, {
              onSuccess: (res) => {
                const ds = res.items.map((i) => i.date).sort()
                toast.success(
                  `${res.items.length} ${res.items.length === 1 ? 'tópico agendado' : 'tópicos agendados'} · ${formatShort(ds[0]!)}${ds.length > 1 ? ` a ${formatShort(ds.at(-1)!)}` : ''}`,
                )
                onClose()
              },
            })
          }
        >
          {apply.isPending
            ? 'Agendando…'
            : n > 0 && !problem
              ? `Agendar ${n} ${n === 1 ? 'tópico' : 'tópicos'}`
              : 'Nada para agendar'}
        </Button>
      </DialogFooter>
    </>
  )
}
