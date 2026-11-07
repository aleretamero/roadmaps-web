import { useForm, useStore } from '@tanstack/react-form'
import { useQuery } from '@tanstack/react-query'
import { ArrowRight, Check } from 'lucide-react'
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { toast } from 'sonner'
import { z } from 'zod'
import { ActionMark } from '@/components/ActionMark'
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
import { Textarea } from '@/components/ui/textarea'
import { ACTIONS, ACTION_LABEL, actionWords } from '@/lib/actions'
import type { SessionAction } from '@/lib/actions'
import type { Schemas } from '@/lib/api/client'
import { errorMessage } from '@/lib/api/errors'
import { topicQuery, useRegisterSession } from '@/lib/api/queries'
import { addDays, formatPlan, formatShort, todayISO } from '@/lib/date'
import { stageAfter, stageLabel } from '@/lib/stage'
import type { Stage } from '@/lib/stage'
import { cn } from '@/lib/utils'

type When = 'today' | 'yesterday' | 'other'
export type LogSessionValues = {
  actions: Array<SessionAction>
  when: When
  date: string
  note: string
}
export type LogSessionTopic = {
  title: string
  roadmapName: string
  moduleTitle: string
  stage: Stage
}

const HINT: Record<SessionAction, string> = {
  studied: 'Li, assisti, fiz anotações',
  practiced: 'Exercícios, código, um projeto',
  completed: 'Já domino o suficiente',
}
const WHEN: Array<[When, string]> = [
  ['today', 'Hoje'],
  ['yesterday', 'Ontem'],
  ['other', 'Outro dia'],
]

/** Dia da sessão escolhido no formulário (vazio se "Outro dia" sem data). */
export function sessionDay(
  v: Pick<LogSessionValues, 'when' | 'date'>,
  today: string,
) {
  return v.when === 'today'
    ? today
    : v.when === 'yesterday'
      ? addDays(today, -1)
      : v.date
}

const schemaFor = (today: string) =>
  z
    .object({
      actions: z.array(
        z.enum(ACTIONS as [SessionAction, ...Array<SessionAction>]),
      ),
      when: z.enum(['today', 'yesterday', 'other']),
      date: z.string(),
      note: z.string().max(2000, 'No máximo 2000 caracteres'),
    })
    .superRefine((v, ctx) => {
      const day = sessionDay(v, today)
      if (!v.actions.length)
        ctx.addIssue({
          code: 'custom',
          path: ['actions'],
          message: 'Marque o que você fez.',
        })
      else if (!day)
        ctx.addIssue({
          code: 'custom',
          path: ['date'],
          message: 'Escolha a data.',
        })
      else if (day > today)
        ctx.addIssue({
          code: 'custom',
          path: ['date'],
          message:
            'Não dá para registrar um dia que ainda não chegou. Para planejar, use as datas previstas.',
        })
    })

/** Primeiro problema do formulário, na ordem em que a pessoa preenche. */
export function sessionProblem(
  v: LogSessionValues,
  today: string,
): string | null {
  const r = schemaFor(today).safeParse(v)
  return r.success ? null : (r.error.issues[0]?.message ?? null)
}

/** "O tópico passa de Estudando para Praticando. Entra na agenda em sáb, 7 de nov." */
export function sessionOutcome(
  from: Stage,
  actions: ReadonlyArray<SessionAction>,
  day: string,
) {
  const to = stageAfter(from, actions)
  const stage =
    to !== from
      ? `O tópico passa de ${stageLabel[from]} para ${stageLabel[to]}.`
      : from === 'completed'
        ? 'Conta como revisão; o tópico continua concluído.'
        : `O tópico continua em ${stageLabel[from]}.`
  return `${stage} Entra na agenda em ${formatPlan(day).toLocaleLowerCase('pt-BR')}.`
}

const OUTCOME_TONE: Record<Stage, string> = {
  planned: 'bg-surface-sunken text-ink-strong',
  studying: 'bg-stage-studying text-stage-studying-fg',
  practicing: 'bg-stage-practicing text-stage-practicing-fg',
  completed: 'bg-stage-completed text-stage-completed-fg',
}

export const defaultPreset = (stage: Stage): SessionAction =>
  stage === 'practicing' ? 'practiced' : 'studied'

export type LogSessionFormProps = {
  topic: LogSessionTopic
  preset?: SessionAction
  /** Valores iniciais (stories e testes). */
  initial?: Partial<LogSessionValues>
  today?: string
  saving?: boolean
  error?: string | null
  onCancel: () => void
  onSave: (body: Schemas['RegisterSessionRequest']) => void
}

/** Conteúdo do modal Registrar sessão: o que fez, quando, como foi e o que muda na etapa. */
export function LogSessionForm({
  topic,
  preset,
  initial,
  today = todayISO(),
  saving = false,
  error,
  onCancel,
  onSave,
}: LogSessionFormProps) {
  const schema = useMemo(() => schemaFor(today), [today])
  const [defaults] = useState<LogSessionValues>(() => ({
    actions: [preset ?? defaultPreset(topic.stage)],
    when: 'today',
    date: today,
    note: '',
    ...initial,
  }))
  const form = useForm({
    defaultValues: defaults,
    validators: { onChange: schema, onSubmit: schema },
    onSubmit: ({ value }) => {
      const note = value.note.trim()
      onSave({
        day: sessionDay(value, today),
        studied: value.actions.includes('studied'),
        practiced: value.actions.includes('practiced'),
        completed: value.actions.includes('completed'),
        note: note || null,
      })
    },
  })
  const values = useStore(form.store, (s) => s.values)
  const problem = sessionProblem(values, today)
  const day = sessionDay(values, today)
  const to = stageAfter(topic.stage, values.actions)
  const submit = () => void form.handleSubmit()
  // Ctrl/⌘+Enter salva de qualquer campo do modal.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault()
        void form.handleSubmit()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [form])

  return (
    <form
      noValidate
      className="flex min-h-0 flex-col"
      onSubmit={(e) => {
        e.preventDefault()
        submit()
      }}
    >
      <div className="flex flex-col gap-5 overflow-y-auto px-5 pt-6 pb-5 sm:px-7">
        <header className="flex flex-col gap-1 pr-8">
          <span className="text-[11px] font-semibold tracking-[0.06em] text-ink-muted uppercase">
            Registrar sessão
          </span>
          <DialogTitle className="text-[22px] font-semibold">
            {topic.title}
          </DialogTitle>
          <DialogDescription className="text-[13px] text-ink-muted">
            {topic.roadmapName} › {topic.moduleTitle} · agora em{' '}
            <strong className="font-semibold text-ink">
              {stageLabel[topic.stage]}
            </strong>
          </DialogDescription>
        </header>

        <form.Field name="actions">
          {(field) => (
            <fieldset className="flex flex-col gap-2.5">
              <legend className="mb-2.5 text-[15px]">
                <strong className="font-semibold">O que você fez?</strong>{' '}
                <span className="text-[13px] text-ink-muted">
                  Pode marcar mais de um
                </span>
              </legend>
              <div className="grid gap-2.5 sm:grid-cols-3">
                {ACTIONS.map((a) => {
                  const on = field.state.value.includes(a)
                  return (
                    <button
                      key={a}
                      type="button"
                      aria-pressed={on}
                      onClick={() =>
                        field.handleChange(
                          on
                            ? field.state.value.filter((x) => x !== a)
                            : [...field.state.value, a],
                        )
                      }
                      className={cn(
                        'relative flex flex-row items-center gap-3 rounded-xl bg-surface p-3.5 text-left sm:flex-col sm:items-start sm:gap-2',
                        on
                          ? 'border-2 border-ink bg-canvas'
                          : 'border border-line-control hover:bg-canvas',
                      )}
                    >
                      <ActionMark action={a} size="lg" />
                      <span className="flex flex-col gap-1">
                        <span className="font-semibold">{ACTION_LABEL[a]}</span>
                        <span
                          id={`ls-hint-${a}`}
                          className="text-xs text-ink-muted"
                        >
                          {HINT[a]}
                        </span>
                      </span>
                      {on && (
                        <span
                          aria-hidden="true"
                          className="absolute top-2.5 right-2.5 grid size-5 place-items-center rounded-full bg-ink text-surface"
                        >
                          <Check className="size-3" strokeWidth={3} />
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
            </fieldset>
          )}
        </form.Field>

        <form.Field name="when">
          {(field) => (
            <fieldset className="flex flex-col gap-2.5">
              <legend className="mb-2.5 text-[15px] font-semibold">
                Quando?
              </legend>
              <div className="flex flex-wrap items-center gap-3">
                <div
                  role="radiogroup"
                  aria-label="Quando?"
                  className="inline-flex rounded-xl bg-surface-sunken p-1"
                >
                  {WHEN.map(([k, label]) => (
                    <button
                      key={k}
                      type="button"
                      role="radio"
                      aria-checked={field.state.value === k}
                      onClick={() => field.handleChange(k)}
                      className={cn(
                        'h-9 rounded-lg px-3.5 text-[15px]',
                        field.state.value === k
                          ? 'bg-surface font-medium text-ink shadow-[0_1px_2px_rgb(21_23_26/0.12)]'
                          : 'text-ink-strong hover:text-ink',
                      )}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                {field.state.value === 'other' && (
                  <form.Field name="date">
                    {(d) => (
                      <DatePicker
                        value={d.state.value}
                        onChange={(v) => d.handleChange(v)}
                        label="Escolher dia da sessão"
                        placeholder="Escolher dia"
                        max={today}
                        align="start"
                        buttonClassName="h-9 px-3 text-sm"
                      />
                    )}
                  </form.Field>
                )}
              </div>
            </fieldset>
          )}
        </form.Field>

        <form.Field name="note">
          {(field) => (
            <div className="flex flex-col gap-2">
              <label htmlFor="ls-note" className="text-[15px]">
                <strong className="font-semibold">Como foi?</strong>{' '}
                <span className="text-[13px] text-ink-muted">
                  opcional · vai para a linha do tempo
                </span>
              </label>
              <Textarea
                id="ls-note"
                rows={3}
                maxLength={2000}
                placeholder="O que você aprendeu, onde travou, o que quer lembrar…"
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
              />
            </div>
          )}
        </form.Field>

        <p
          aria-live="polite"
          className={cn(
            'flex items-start gap-3 rounded-xl px-4 py-3 text-sm',
            problem
              ? 'bg-danger-soft text-danger'
              : to !== topic.stage
                ? OUTCOME_TONE[to]
                : 'bg-surface-sunken text-ink-strong',
          )}
        >
          <ArrowRight className="mt-0.5 size-4 flex-none" aria-hidden="true" />
          {problem ?? sessionOutcome(topic.stage, values.actions, day)}
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
      <DialogFooter className="flex-row items-center border-t border-line-soft px-5 py-4 sm:px-7">
        <span className="mr-auto hidden text-xs text-ink-muted sm:inline">
          Ctrl+Enter salva
        </span>
        <Button type="button" variant="outline" size="lg" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" size="lg" disabled={!!problem || saving}>
          {saving ? 'Salvando…' : 'Salvar registro'}
        </Button>
      </DialogFooter>
    </form>
  )
}

export type LogOptions = {
  /** Atividade já marcada (padrão: a da etapa atual). */
  preset?: SessionAction
  /** Dia da sessão (padrão: hoje). */
  day?: string
}

/** Valores iniciais de "Quando?" para um dia escolhido fora do modal (ex.: na Agenda). */
export function whenFor(
  day: string | undefined,
  today: string,
): Partial<LogSessionValues> {
  if (!day || day === today) return {}
  if (day === addDays(today, -1)) return { when: 'yesterday' }
  return { when: 'other', date: day }
}

export type LogSessionDialogProps = {
  topicId: number | null
  open: boolean
  onOpenChange: (open: boolean) => void
  options?: LogOptions
}

/** Modal Registrar sessão de um tópico: busca o tópico, grava a sessão e avisa o resultado. */
export function LogSessionDialog({
  topicId,
  open,
  onOpenChange,
  options,
}: LogSessionDialogProps) {
  return (
    <Dialog open={open && topicId !== null} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[calc(100dvh-2rem)] flex-col gap-0 overflow-hidden bg-surface p-0 sm:max-w-[600px]">
        {topicId !== null && (
          <LogSessionBody
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

function LogSessionBody({
  topicId,
  options = {},
  onClose,
}: {
  topicId: number
  options?: LogOptions
  onClose: () => void
}) {
  const { data, error: loadError } = useQuery(topicQuery(topicId))
  const register = useRegisterSession(topicId)
  const [error, setError] = useState<string | null>(null)
  const [today] = useState(todayISO)
  if (loadError)
    return (
      <div className="flex flex-col gap-4 p-7">
        <DialogTitle>Registrar sessão</DialogTitle>
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
        <DialogTitle className="sr-only">Registrar sessão</DialogTitle>
        <DialogDescription className="sr-only">
          Carregando o tópico…
        </DialogDescription>
        <Skeleton className="h-6 w-1/2" />
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-10 w-1/3" />
      </div>
    )
  return (
    <LogSessionForm
      topic={data}
      preset={options.preset}
      initial={whenFor(options.day, today)}
      today={today}
      saving={register.isPending}
      error={error}
      onCancel={onClose}
      onSave={(body) => {
        const from = data.stage
        setError(null)
        register.mutate(body, {
          onSuccess: (res) => {
            const acts = ACTIONS.filter((a) => body[a])
            const when =
              body.day === today ? 'hoje' : `em ${formatShort(body.day)}`
            const stage =
              res.topic.stage !== from
                ? ` · ${stageLabel[res.topic.stage]}`
                : ''
            toast.success(
              `Registrado ${when}: ${actionWords(acts).toLocaleLowerCase('pt-BR')}${stage}`,
            )
            onClose()
          },
          onError: (e) => setError(errorMessage(e)),
        })
      }}
    />
  )
}

type OpenLog = (topicId: number, options?: LogOptions) => void
const LogSessionContext = createContext<OpenLog>(() => {})

/** Abre o modal Registrar sessão de qualquer tela: `const log = useLogSession(); log(topic.id, { day })`. */
export function useLogSession() {
  return useContext(LogSessionContext)
}

/** Um único modal Registrar sessão para o app inteiro. */
export function LogSessionProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [state, setState] = useState<{
    topicId: number
    options?: LogOptions
    open: boolean
  } | null>(null)
  const openLog = useCallback<OpenLog>(
    (topicId, options) => setState({ topicId, options, open: true }),
    [],
  )
  return (
    <LogSessionContext.Provider value={openLog}>
      {children}
      <LogSessionDialog
        topicId={state?.topicId ?? null}
        options={state?.options}
        open={!!state?.open}
        onOpenChange={(o) => {
          if (!o) setState((s) => (s ? { ...s, open: false } : s))
        }}
      />
    </LogSessionContext.Provider>
  )
}
