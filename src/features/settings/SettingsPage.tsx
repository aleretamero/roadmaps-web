import { useForm, useStore } from '@tanstack/react-form'
import { Link } from '@tanstack/react-router'
import { ArrowLeft, CalendarDays, Check, HardDrive } from 'lucide-react'
import { useEffect, useState } from 'react'
import { z } from 'zod'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import type { Schemas } from '@/lib/api/client'
import { timeZoneLabel, timeZones } from '@/lib/integrations'
import { initials } from '@/lib/user'
import { cn } from '@/lib/utils'

export type SettingsSection = 'account' | 'study' | 'integrations'

export const SECTIONS: ReadonlyArray<{ id: SettingsSection; label: string }> = [
  { id: 'account', label: 'Conta' },
  { id: 'study', label: 'Estudo e agenda' },
  { id: 'integrations', label: 'Integrações' },
]

const WEEKDAYS: ReadonlyArray<{
  day: Schemas['Weekday']
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

const HOME: ReadonlyArray<[Schemas['Preferences']['homePage'], string]> = [
  ['dashboard', 'Painel'],
  ['roadmaps', 'Meus roadmaps'],
  ['schedule', 'Agenda'],
]

/** Moldura das Configurações: título, menu das seções e o conteúdo. */
export function SettingsLayout({
  section,
  children,
}: {
  section: SettingsSection
  children: React.ReactNode
}) {
  return (
    <div className="mx-auto flex w-full max-w-[1032px] flex-col gap-6 px-4 pt-8 pb-16 sm:px-8 sm:pt-10">
      <h1 className="text-[32px] leading-tight font-semibold tracking-tight text-ink-strong">
        Configurações
      </h1>
      <div className="flex flex-col gap-6 md:flex-row md:items-start">
        <nav
          aria-label="Seções das configurações"
          className="md:w-[200px] md:flex-none"
        >
          <ul className="flex gap-1 overflow-x-auto md:flex-col">
            {SECTIONS.map((s) => (
              <li key={s.id} className="flex-none">
                <Link
                  to="/settings/$section"
                  params={{ section: s.id }}
                  aria-current={s.id === section ? 'page' : undefined}
                  className={cn(
                    'flex h-10 items-center rounded-lg px-3 whitespace-nowrap',
                    s.id === section
                      ? 'bg-surface-sunken font-medium text-ink'
                      : 'text-ink-muted hover:bg-surface-sunken',
                  )}
                >
                  {s.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </div>
  )
}

function Card({
  title,
  description,
  children,
}: {
  title: string
  description: string
  children: React.ReactNode
}) {
  const id = `set-${title.replace(/\W+/g, '-').toLowerCase()}`
  return (
    <section
      aria-labelledby={id}
      className="flex flex-col rounded-2xl border border-line bg-surface px-5 py-5 sm:px-6"
    >
      <div className="flex flex-col gap-0.5 border-b border-line-soft pb-4">
        <h2 id={id} className="text-lg font-semibold">
          {title}
        </h2>
        <p className="text-[13px] text-ink-muted">{description}</p>
      </div>
      {children}
    </section>
  )
}

function Row({
  label,
  hint,
  htmlFor,
  labelId,
  children,
}: {
  label: string
  hint: string
  htmlFor?: string
  labelId?: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 border-t border-line-soft py-4 first:border-t-0">
      <div className="flex min-w-0 flex-[1_1_260px] flex-col gap-0.5">
        {htmlFor ? (
          <label htmlFor={htmlFor} className="font-medium">
            {label}
          </label>
        ) : (
          <span id={labelId} className="font-medium">
            {label}
          </span>
        )}
        <span className="text-[13px] text-ink-muted">{hint}</span>
      </div>
      {children}
    </div>
  )
}

function SaveBar({
  dirty,
  saving,
  error,
  onReset,
}: {
  dirty: boolean
  saving: boolean
  error?: string | null
  onReset: () => void
}) {
  if (!dirty && !error) return null
  return (
    <div className="flex flex-wrap items-center justify-end gap-2 border-t border-line-soft pt-4">
      {error ? (
        <p role="alert" className="mr-auto text-sm text-danger">
          {error}
        </p>
      ) : (
        <span className="mr-auto text-[13px] text-ink-muted">
          Alterações não salvas
        </span>
      )}
      <Button
        type="button"
        variant="outline"
        onClick={onReset}
        disabled={saving}
      >
        Descartar
      </Button>
      <Button type="submit" disabled={saving}>
        {saving ? 'Salvando…' : 'Salvar'}
      </Button>
    </div>
  )
}

const accountSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Informe seu nome.')
    .max(120, 'No máximo 120 caracteres'),
  timeZone: z.string().min(1),
})

export type AccountSectionProps = {
  me: Schemas['User']
  saving?: boolean
  error?: string | null
  onSave: (values: { name: string; timeZone: string }) => void
  onLogout: () => void
  onDirtyChange?: (dirty: boolean) => void
}

/** Conta: nome e fuso (com salvar), sair. */
export function AccountSection({
  me,
  saving = false,
  error,
  onSave,
  onLogout,
  onDirtyChange,
}: AccountSectionProps) {
  const [defaults] = useState({ name: me.name, timeZone: me.timeZone })
  const form = useForm({
    defaultValues: defaults,
    validators: { onSubmit: accountSchema },
    onSubmit: ({ value }) =>
      onSave({ name: value.name.trim(), timeZone: value.timeZone }),
  })
  const values = useStore(form.store, (s) => s.values)
  const dirty = values.name !== me.name || values.timeZone !== me.timeZone
  useEffect(() => onDirtyChange?.(dirty), [dirty, onDirtyChange])
  const [zones] = useState(() => timeZones(me.timeZone))
  return (
    <Card title="Conta" description="Seus dados vêm do GitHub.">
      <form
        noValidate
        className="flex flex-col"
        onSubmit={(e) => {
          e.preventDefault()
          void form.handleSubmit()
        }}
      >
        <div className="flex items-center gap-3.5 py-4">
          <span
            aria-hidden="true"
            className="grid size-[52px] flex-none place-items-center rounded-full bg-avatar text-lg font-semibold text-avatar-fg"
          >
            {initials(me.name)}
          </span>
          <div className="flex min-w-0 flex-col">
            <span className="truncate text-lg font-semibold">{me.name}</span>
            <span className="truncate text-[13px] text-ink-muted">
              {me.email}
            </span>
          </div>
        </div>
        <form.Field name="name">
          {(field) => {
            const err = field.state.meta.errors[0]?.message
            return (
              <Row
                label="Nome"
                hint="Como você aparece no app."
                htmlFor="set-name"
              >
                <div className="flex w-full max-w-[320px] flex-col gap-1">
                  <Input
                    id="set-name"
                    value={field.state.value}
                    maxLength={120}
                    autoComplete="name"
                    onChange={(e) => field.handleChange(e.target.value)}
                    aria-invalid={err ? true : undefined}
                    aria-describedby={err ? 'set-name-err' : undefined}
                  />
                  {err && (
                    <span id="set-name-err" className="text-sm text-danger">
                      {err}
                    </span>
                  )}
                </div>
              </Row>
            )
          }}
        </form.Field>
        <form.Field name="timeZone">
          {(field) => (
            <Row
              label="Fuso horário"
              hint="Usado para saber que dia é “hoje” na agenda."
              htmlFor="set-tz"
            >
              <select
                id="set-tz"
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
                className="h-10 w-full max-w-[320px] rounded-md border border-line-control bg-surface px-2 text-sm"
              >
                {zones.map((zone) => (
                  <option key={zone} value={zone}>
                    {timeZoneLabel(zone)}
                  </option>
                ))}
              </select>
            </Row>
          )}
        </form.Field>
        <SaveBar
          dirty={dirty}
          saving={saving}
          error={error}
          onReset={() => form.reset()}
        />
        <Row label="Sair" hint="Encerra a sessão neste navegador.">
          <Button type="button" variant="outline" onClick={onLogout}>
            Sair
          </Button>
        </Row>
      </form>
    </Card>
  )
}

export type StudySectionProps = {
  prefs: Schemas['Preferences']
  saving?: boolean
  error?: string | null
  onSave: (prefs: Schemas['Preferences']) => void
  onDirtyChange?: (dirty: boolean) => void
  /** Linha do lembrete diário (salva sozinha, fora do formulário). */
  reminder?: React.ReactNode
}

const studySchema = z.object({
  studyDays: z
    .array(
      z.enum([
        'sunday',
        'monday',
        'tuesday',
        'wednesday',
        'thursday',
        'friday',
        'saturday',
      ]),
    )
    .min(1, 'Escolha pelo menos um dia de estudo.'),
  includeOptional: z.boolean(),
  homePage: z.enum(['dashboard', 'roadmaps', 'schedule']),
})

const sameDays = (a: ReadonlyArray<string>, b: ReadonlyArray<string>) =>
  a.length === b.length && a.every((d) => b.includes(d))

/** Estudo e agenda: dias de estudo, opcionais no agendamento e página inicial. */
export function StudySection({
  prefs,
  saving = false,
  error,
  onSave,
  onDirtyChange,
  reminder,
}: StudySectionProps) {
  const [defaults] = useState({
    studyDays: prefs.studyDays,
    includeOptional: prefs.includeOptional,
    homePage: prefs.homePage,
  })
  const form = useForm({
    defaultValues: defaults,
    validators: { onSubmit: studySchema },
    onSubmit: ({ value }) => onSave({ ...prefs, ...value }),
  })
  const v = useStore(form.store, (s) => s.values)
  const dirty =
    !sameDays(v.studyDays, prefs.studyDays) ||
    v.includeOptional !== prefs.includeOptional ||
    v.homePage !== prefs.homePage
  useEffect(() => onDirtyChange?.(dirty), [dirty, onDirtyChange])
  return (
    <Card
      title="Estudo e agenda"
      description="Valores padrão para o agendamento automático e a agenda."
    >
      <form
        noValidate
        className="flex flex-col"
        onSubmit={(e) => {
          e.preventDefault()
          void form.handleSubmit()
        }}
      >
        <form.Field name="studyDays">
          {(field) => {
            const err = field.state.meta.errors[0]?.message
            return (
              <Row
                label="Dias de estudo"
                hint="O agendamento automático só usa estes dias."
                labelId="set-days"
              >
                <div className="flex flex-col items-end gap-1">
                  <div
                    role="group"
                    aria-labelledby="set-days"
                    className="flex gap-1"
                  >
                    {WEEKDAYS.map((w) => {
                      const on = field.state.value.includes(w.day)
                      return (
                        <button
                          key={w.day}
                          type="button"
                          aria-pressed={on}
                          aria-label={w.full}
                          title={w.full}
                          onClick={() =>
                            field.handleChange(
                              on
                                ? field.state.value.filter((d) => d !== w.day)
                                : [...field.state.value, w.day],
                            )
                          }
                          className={cn(
                            'size-9 rounded-lg text-[13px] font-semibold',
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
                  {err && (
                    <span role="alert" className="text-sm text-danger">
                      {err}
                    </span>
                  )}
                </div>
              </Row>
            )
          }}
        </form.Field>
        <form.Field name="includeOptional">
          {(field) => (
            <Row
              label="Tópicos opcionais no agendamento"
              hint="Incluir os opcionais quando agendar automaticamente."
              htmlFor="set-opt"
            >
              <Switch
                id="set-opt"
                checked={field.state.value}
                onCheckedChange={(c) => field.handleChange(c)}
              />
            </Row>
          )}
        </form.Field>
        <form.Field name="homePage">
          {(field) => (
            <Row
              label="Página inicial"
              hint="O que abre quando você entra."
              labelId="set-home"
            >
              <div
                role="radiogroup"
                aria-labelledby="set-home"
                className="inline-flex rounded-xl bg-surface-sunken p-1"
              >
                {HOME.map(([k, label]) => (
                  <button
                    key={k}
                    type="button"
                    role="radio"
                    aria-checked={field.state.value === k}
                    onClick={() => field.handleChange(k)}
                    className={cn(
                      'h-9 rounded-lg px-3 text-sm whitespace-nowrap',
                      field.state.value === k
                        ? 'bg-surface font-medium text-ink shadow-[0_1px_2px_rgb(21_23_26/0.12)]'
                        : 'text-ink-strong',
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </Row>
          )}
        </form.Field>
        <SaveBar
          dirty={dirty}
          saving={saving}
          error={error}
          onReset={() => form.reset()}
        />
      </form>
      {reminder}
    </Card>
  )
}

type Integration = Schemas['Integration']

const PROVIDERS = {
  googleDrive: {
    name: 'Google Drive',
    icon: HardDrive,
    tone: 'bg-stage-studying text-stage-studying-fg',
    text: 'Guarda os arquivos de cada tópico numa pasta sua, organizada por roadmap, módulo e tópico.',
    bullets: [
      'Envie arquivos e pastas inteiras',
      'Veja o código sem sair do app',
      'Os arquivos continuam no seu Drive',
    ],
    note: 'Necessário para os arquivos dos tópicos',
  },
  googleCalendar: {
    name: 'Google Agenda',
    icon: CalendarDays,
    tone: 'bg-stage-practicing text-stage-practicing-fg',
    text: 'Coloca as datas previstas dos tópicos na sua agenda do Google e atualiza quando você reagenda.',
    bullets: ['Um evento por tópico agendado', 'Reagendar aqui muda lá também'],
    note: 'Chega numa próxima versão',
  },
} as const

export type IntegrationsSectionProps = {
  integrations: ReadonlyArray<Integration>
  connecting?: boolean
  disconnecting?: boolean
  /** Caminho para voltar depois de conectar (ex.: a aba Arquivos de um tópico). */
  returnTo?: string
  onConnect: () => void
  onDisconnect: () => void
  /** Volta para `returnTo` sem recarregar a página. */
  onBack?: () => void
}

/** Integrações: Google Drive (conectar/desconectar) e Google Agenda (em breve). */
export function IntegrationsSection({
  integrations,
  connecting = false,
  disconnecting = false,
  returnTo,
  onConnect,
  onDisconnect,
  onBack,
}: IntegrationsSectionProps) {
  const [confirm, setConfirm] = useState(false)
  const order: ReadonlyArray<Integration['provider']> = [
    'googleDrive',
    'googleCalendar',
  ]
  return (
    <section aria-labelledby="set-int" className="flex flex-col gap-4">
      {returnTo && (
        <a
          href={returnTo}
          onClick={(e) => {
            e.preventDefault()
            onBack?.()
          }}
          className="inline-flex items-center gap-1.5 self-start text-sm font-medium text-link hover:underline"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Voltar para o tópico
        </a>
      )}
      <div className="flex flex-col gap-0.5">
        <h2 id="set-int" className="text-xl font-semibold">
          Integrações
        </h2>
        <p className="text-ink-muted">
          Conecte serviços que você já usa. Você pode desconectar quando quiser.
        </p>
      </div>
      <ul className="grid gap-4 lg:grid-cols-2">
        {order.map((provider) => {
          const it = integrations.find((i) => i.provider === provider)
          const P = PROVIDERS[provider]
          const soon = !it?.available
          const connected = !!it?.connected
          const status = soon
            ? 'Em breve'
            : connecting && provider === 'googleDrive'
              ? 'Conectando…'
              : connected
                ? 'Conectado'
                : 'Desconectado'
          return (
            <li
              key={provider}
              aria-labelledby={`int-${provider}`}
              className="flex flex-col overflow-hidden rounded-2xl border border-line bg-surface"
            >
              <div className="flex flex-1 flex-col gap-3 p-5">
                <div className="flex items-start justify-between gap-3">
                  <span
                    aria-hidden="true"
                    className={cn(
                      'grid size-12 place-items-center rounded-xl',
                      P.tone,
                    )}
                  >
                    <P.icon className="size-5" />
                  </span>
                  <span
                    className={cn(
                      'inline-flex h-7 items-center gap-1.5 rounded-full px-2.5 text-xs font-semibold',
                      connected
                        ? 'bg-stage-completed text-stage-completed-fg'
                        : 'bg-surface-sunken text-ink-strong',
                    )}
                  >
                    <span
                      aria-hidden="true"
                      className={cn(
                        'size-1.5 rounded-full',
                        connected ? 'bg-success' : 'bg-ink-soft',
                      )}
                    />
                    {status}
                  </span>
                </div>
                <h3 id={`int-${provider}`} className="text-lg font-semibold">
                  {P.name}
                </h3>
                <p className="text-ink-muted">{P.text}</p>
                {connected && it.accountEmail && (
                  <p className="text-sm text-ink-strong">
                    {it.accountEmail}
                    {it.rootFolderName && ` · pasta “${it.rootFolderName}”`}
                  </p>
                )}
                <ul className="flex flex-col gap-1.5 text-sm">
                  {P.bullets.map((b) => (
                    <li key={b} className="flex items-center gap-2">
                      <Check
                        className="size-3.5 flex-none text-success"
                        aria-hidden="true"
                      />
                      {b}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line-soft px-5 py-3">
                <span className="text-xs text-ink-muted">{P.note}</span>
                {soon ? (
                  <span className="rounded-lg border border-dashed border-line-control px-4 py-2 text-sm text-ink-soft">
                    Em breve
                  </span>
                ) : connected ? (
                  <Button
                    variant="outline"
                    onClick={() => setConfirm(true)}
                    disabled={disconnecting}
                  >
                    Desconectar
                  </Button>
                ) : (
                  <Button onClick={onConnect} disabled={connecting}>
                    {connecting ? 'Conectando…' : 'Conectar'}
                  </Button>
                )}
              </div>
            </li>
          )
        })}
      </ul>
      <AlertDialog open={confirm} onOpenChange={setConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Desconectar o Google Drive?</AlertDialogTitle>
            <AlertDialogDescription>
              Os arquivos continuam no seu Drive, mas deixam de aparecer nos
              tópicos até você conectar de novo.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setConfirm(false)
                onDisconnect()
              }}
            >
              Desconectar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  )
}
