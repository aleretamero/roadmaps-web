import { useQuery } from '@tanstack/react-query'
import { ArrowRight } from 'lucide-react'
import { createContext, useCallback, useContext, useState } from 'react'
import { toast } from 'sonner'
import { DatePicker } from '@/components/DatePicker'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import type { Schemas } from '@/lib/api/client'
import { errorMessage } from '@/lib/api/errors'
import {
  topicQuery,
  useAddScheduleEntry,
  useMoveScheduleEntry,
} from '@/lib/api/queries'
import { formatPlan, formatShort, todayISO } from '@/lib/date'
import { cn } from '@/lib/utils'

export type RescheduleMode = 'move' | 'add'
type Entry = Pick<Schemas['ScheduleEntry'], 'id' | 'date'>

/** Data que "Trocar data" sugere mudar: a próxima a partir de hoje, ou a última que passou. */
export function defaultFrom(entries: ReadonlyArray<Entry>, today: string) {
  const sorted = [...entries].sort((a, b) => a.date.localeCompare(b.date))
  return sorted.find((e) => e.date >= today) ?? sorted.at(-1) ?? null
}

/** Primeiro problema para salvar, ou null. */
export function rescheduleProblem(
  mode: RescheduleMode,
  entries: ReadonlyArray<Entry>,
  from: Entry | null,
  to: string,
  today: string,
): string | null {
  if (mode === 'move' && !from) return 'Ainda não há data para trocar.'
  if (!to) return mode === 'move' ? 'Escolha a nova data.' : 'Escolha o dia.'
  if (to < today) return 'Escolha hoje ou um dia futuro.'
  if (mode === 'move' && from && to === from.date)
    return 'Escolha uma data diferente da atual.'
  if (entries.some((e) => e.date === to))
    return 'Esse dia já está agendado para este tópico.'
  return null
}

const lower = (s: string) => s.toLocaleLowerCase('pt-BR')

export type RescheduleFormProps = {
  topic: Pick<Schemas['TopicDetail'], 'title' | 'roadmapName' | 'moduleTitle'>
  entries: ReadonlyArray<Entry>
  mode: RescheduleMode
  /** Data que vai ser trocada (padrão: `defaultFrom`). */
  fromId?: number
  today?: string
  saving?: boolean
  error?: string | null
  onCancel: () => void
  onSave: (value: { from: Entry | null; to: string }) => void
}

/** Conteúdo dos modais "Trocar data" e "Agendar mais um dia". */
export function RescheduleForm({
  topic,
  entries,
  mode,
  fromId,
  today = todayISO(),
  saving = false,
  error,
  onCancel,
  onSave,
}: RescheduleFormProps) {
  const sorted = [...entries].sort((a, b) => a.date.localeCompare(b.date))
  const [fromSel, setFromSel] = useState<number | null>(
    () => fromId ?? defaultFrom(entries, today)?.id ?? null,
  )
  const [to, setTo] = useState('')
  const from = sorted.find((e) => e.id === fromSel) ?? null
  const problem = rescheduleProblem(mode, entries, from, to, today)
  const isMove = mode === 'move'
  const outcome = problem
    ? ''
    : isMove
      ? `${formatPlan(from!.date)} → ${formatPlan(to)}. A data antiga sai da agenda e a troca fica na linha do tempo.`
      : `Fica agendado também para ${lower(formatPlan(to))}.`
  return (
    <form
      noValidate
      className="flex flex-col"
      onSubmit={(e) => {
        e.preventDefault()
        if (!problem) onSave({ from, to })
      }}
    >
      <div className="flex flex-col gap-5 px-5 pt-6 pb-5 sm:px-7">
        <header className="flex flex-col gap-1 pr-8">
          <span className="text-[11px] font-semibold tracking-[0.06em] text-ink-muted uppercase">
            {isMove ? 'Trocar data' : 'Agendar mais um dia'}
          </span>
          <DialogTitle className="text-[22px] font-semibold">
            {topic.title}
          </DialogTitle>
          <DialogDescription className="text-[13px] text-ink-muted">
            {topic.roadmapName} › {topic.moduleTitle}
            {sorted.length > 0 &&
              ` · agendado para ${sorted.map((e) => formatShort(e.date)).join(', ')}`}
          </DialogDescription>
        </header>
        {isMove && sorted.length > 1 && (
          <fieldset className="flex flex-col gap-2.5">
            <legend className="mb-2.5 text-[15px] font-semibold">
              Qual data?
            </legend>
            <div
              role="radiogroup"
              aria-label="Qual data?"
              className="flex flex-wrap gap-2"
            >
              {sorted.map((e) => (
                <button
                  key={e.id}
                  type="button"
                  role="radio"
                  aria-checked={e.id === fromSel}
                  onClick={() => setFromSel(e.id)}
                  className={cn(
                    'h-8 rounded-full px-3 text-[13px]',
                    e.id === fromSel
                      ? 'bg-ink text-surface'
                      : 'border border-line-control bg-surface text-ink hover:bg-canvas',
                  )}
                >
                  {formatPlan(e.date)}
                </button>
              ))}
            </div>
          </fieldset>
        )}
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-[15px] font-semibold">
            {isMove ? 'Nova data' : 'Dia'}
          </span>
          <DatePicker
            value={to}
            onChange={setTo}
            label={isMove ? 'Escolher nova data' : 'Escolher dia'}
            placeholder={isMove ? 'Escolher nova data' : 'Escolher dia'}
            min={today}
            align="start"
            buttonClassName="h-9 px-3 text-sm border-line-control"
          />
        </div>
        <p
          aria-live="polite"
          className={cn(
            'flex items-start gap-3 rounded-xl px-4 py-3 text-sm',
            problem
              ? 'bg-surface-sunken text-ink-muted'
              : 'bg-stage-studying text-stage-studying-fg',
          )}
        >
          <ArrowRight className="mt-0.5 size-4 flex-none" aria-hidden="true" />
          {problem ?? outcome}
        </p>
        {error && (
          <p
            role="alert"
            className="rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger"
          >
            {error}
          </p>
        )}
      </div>
      <DialogFooter className="flex-row justify-end border-t border-line-soft px-5 py-4 sm:px-7">
        <Button type="button" variant="outline" size="lg" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" size="lg" disabled={!!problem || saving}>
          {saving ? 'Salvando…' : isMove ? 'Trocar data' : 'Agendar'}
        </Button>
      </DialogFooter>
    </form>
  )
}

export type RescheduleOptions = { mode?: RescheduleMode; fromId?: number }

export type RescheduleDialogProps = {
  topicId: number | null
  open: boolean
  onOpenChange: (open: boolean) => void
  options?: RescheduleOptions
}

/** Modal "Trocar data" ou "Agendar mais um dia" de um tópico. */
export function RescheduleDialog({
  topicId,
  open,
  onOpenChange,
  options,
}: RescheduleDialogProps) {
  return (
    <Dialog open={open && topicId !== null} onOpenChange={onOpenChange}>
      <DialogContent className="flex flex-col gap-0 overflow-hidden bg-surface p-0 sm:max-w-[520px]">
        {topicId !== null && (
          <RescheduleBody
            key={topicId}
            topicId={topicId}
            options={options}
            onClose={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}

function RescheduleBody({
  topicId,
  options = {},
  onClose,
}: {
  topicId: number
  options?: RescheduleOptions
  onClose: () => void
}) {
  const { data, error: loadError } = useQuery(topicQuery(topicId))
  const move = useMoveScheduleEntry(topicId)
  const add = useAddScheduleEntry(topicId)
  const [error, setError] = useState<string | null>(null)
  const mode = options.mode ?? (data?.scheduleEntries.length ? 'move' : 'add')
  if (loadError)
    return (
      <div className="flex flex-col gap-4 p-7">
        <DialogTitle>Agenda do tópico</DialogTitle>
        <DialogDescription role="alert" className="text-danger">
          Não foi possível abrir o tópico. {errorMessage(loadError)}
        </DialogDescription>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Fechar
          </Button>
        </DialogFooter>
      </div>
    )
  if (!data)
    return (
      <div className="flex flex-col gap-4 p-7" aria-busy="true">
        <DialogTitle className="sr-only">Agenda do tópico</DialogTitle>
        <DialogDescription className="sr-only">
          Carregando o tópico…
        </DialogDescription>
        <Skeleton className="h-6 w-1/2" />
        <Skeleton className="h-16 w-full" />
      </div>
    )
  const done = (msg: string) => {
    toast.success(msg)
    onClose()
  }
  return (
    <RescheduleForm
      topic={data}
      entries={data.scheduleEntries}
      mode={mode}
      fromId={options.fromId}
      saving={move.isPending || add.isPending}
      error={error}
      onCancel={onClose}
      onSave={({ from, to }) => {
        setError(null)
        const onError = (e: unknown) => setError(errorMessage(e))
        if (mode === 'move' && from)
          move.mutate(
            { entryId: from.id, date: to },
            {
              onSuccess: () =>
                done(
                  `Data trocada: ${formatShort(from.date)} → ${formatShort(to)}`,
                ),
              onError,
            },
          )
        else
          add.mutate(to, {
            onSuccess: () => done(`Agendado também para ${formatShort(to)}`),
            onError,
          })
      }}
    />
  )
}

type OpenReschedule = (topicId: number, options?: RescheduleOptions) => void
const RescheduleContext = createContext<OpenReschedule>(() => {})

/** Abre "Trocar data" (`{ mode: 'move' }`) ou "Agendar mais um dia" (`{ mode: 'add' }`) de qualquer tela. */
export function useReschedule() {
  return useContext(RescheduleContext)
}

/** Um único par de modais de agenda para o app inteiro. */
export function RescheduleProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [state, setState] = useState<{
    topicId: number
    options?: RescheduleOptions
    open: boolean
  } | null>(null)
  const openIt = useCallback<OpenReschedule>(
    (topicId, options) => setState({ topicId, options, open: true }),
    [],
  )
  return (
    <RescheduleContext.Provider value={openIt}>
      {children}
      <RescheduleDialog
        topicId={state?.topicId ?? null}
        options={state?.options}
        open={!!state?.open}
        onOpenChange={(o) => {
          if (!o) setState((s) => (s ? { ...s, open: false } : s))
        }}
      />
    </RescheduleContext.Provider>
  )
}
