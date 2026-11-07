import {
  CalendarDays,
  Check,
  MoreHorizontal,
  Pencil,
  Plus,
  X,
} from 'lucide-react'
import { useState } from 'react'
import { ptBR } from 'react-day-picker/locale'
import { ActionMark } from '@/components/ActionMark'
import { Breadcrumbs } from '@/components/Breadcrumbs'
import { IconButton } from '@/components/IconButton'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { Schemas } from '@/lib/api/client'
import {
  diffDays,
  formatPlan,
  formatShort,
  todayISO,
  toISODate,
} from '@/lib/date'
import { STAGES, stageLabel } from '@/lib/stage'
import { cn } from '@/lib/utils'

type Topic = Schemas['TopicDetail']
export type TopicTab = 'timeline' | 'files' | 'resources' | 'notes'

const plural = (n: number, one: string, many: string) =>
  `${n} ${n === 1 ? one : many}`
const STAGE_ACTION = {
  studying: 'studied',
  practicing: 'practiced',
  completed: 'completed',
} as const

const longDate = (iso: string) =>
  new Date(iso)
    .toLocaleDateString('pt-BR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
    .replace(/\./g, '')
    .replace(/ de /g, ' ')

/** "Você está praticando", "Você ainda não começou"… */
export function stageHeadline(stage: Schemas['Stage']) {
  return {
    planned: 'Você ainda não começou',
    studying: 'Você está estudando',
    practicing: 'Você está praticando',
    completed: 'Você concluiu este tópico',
  }[stage]
}

/** "4 sessões · última há 2 dias" */
export function sessionsLine(
  count: number,
  last: string | null,
  today: string,
) {
  if (!count) return 'Nenhuma sessão registrada'
  const n = last ? diffDays(last, today) : null
  const when =
    n === null
      ? ''
      : n === 0
        ? ' · última hoje'
        : n === 1
          ? ' · última ontem'
          : ` · última há ${n} dias`
  return `${plural(count, 'sessão', 'sessões')}${when}`
}

function Stepper({ topic }: { topic: Topic }) {
  const cur = STAGES.indexOf(topic.stage)
  const dateOf = (s: Schemas['Stage']) =>
    s === 'planned' ? null : topic.stageDates[s]
  return (
    <ol
      aria-label="Etapas do tópico"
      className="grid min-w-0 flex-[1_1_480px] grid-cols-4"
    >
      {STAGES.map((s, i) => {
        const reached = i <= cur
        const current = i === cur
        const d = dateOf(s)
        return (
          <li
            key={s}
            aria-current={current ? 'step' : undefined}
            className="relative flex flex-col items-center gap-2 text-center"
          >
            {i > 0 && (
              <span
                aria-hidden="true"
                className={cn(
                  'absolute top-4 right-1/2 h-0.5 w-full',
                  reached ? 'bg-ink' : 'bg-line',
                )}
              />
            )}
            <span className="relative z-[1] grid size-8 place-items-center">
              {current && s !== 'planned' && s !== 'completed' ? (
                <ActionMark
                  action={STAGE_ACTION[s]}
                  size="lg"
                  className="ring-2 ring-current ring-offset-2 ring-offset-surface"
                />
              ) : reached ? (
                <span className="grid size-8 place-items-center rounded-full bg-ink text-surface">
                  <Check
                    className="size-3.5"
                    strokeWidth={2.6}
                    aria-hidden="true"
                  />
                </span>
              ) : (
                <span className="size-8 rounded-full border-2 border-line-control bg-surface" />
              )}
            </span>
            <span
              className={cn(
                'text-sm',
                current
                  ? 'font-semibold text-ink'
                  : reached
                    ? 'text-ink-strong'
                    : 'text-ink-soft',
              )}
            >
              {stageLabel[s]}
              <span className="sr-only">
                {current ? ' (etapa atual)' : reached ? ' (feito)' : ''}
              </span>
            </span>
            {d && (
              <span className="text-xs text-ink-muted">{formatShort(d)}</span>
            )}
          </li>
        )
      })}
    </ol>
  )
}

function AddDay({ onAdd }: { onAdd: (date: string) => void }) {
  const [open, setOpen] = useState(false)
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="inline-flex h-8 items-center gap-1.5 rounded-full border border-dashed border-ink-faint px-3 text-[13px] font-medium hover:bg-canvas"
        >
          <Plus className="size-3.5" aria-hidden="true" />
          Adicionar dia
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          locale={ptBR}
          onSelect={(d) => {
            if (d) onAdd(toISODate(d))
            setOpen(false)
          }}
        />
      </PopoverContent>
    </Popover>
  )
}

export type TopicPageProps = {
  topic: Topic
  tab: TopicTab
  onTabChange: (tab: TopicTab) => void
  onRegister: () => void
  onEdit: () => void
  onReopen: () => void
  onAddDay: (date: string) => void
  onRemoveDay: (entryId: number) => void
  panels?: Partial<Record<TopicTab, React.ReactNode>>
  today?: string
}

/** Tópico: trilha, etapas com datas, Registrar sessão, agenda do tópico e abas de conteúdo. */
export function TopicPage({
  topic: t,
  tab,
  onTabChange,
  onRegister,
  onEdit,
  onReopen,
  onAddDay,
  onRemoveDay,
  panels = {},
  today = todayISO(),
}: TopicPageProps) {
  const entries = [...t.scheduleEntries].sort((a, b) =>
    a.date.localeCompare(b.date),
  )
  const allPast = entries.length > 0 && entries.every((e) => e.date < today)
  const registerIcon =
    t.stage === 'planned' || t.stage === 'completed'
      ? null
      : STAGE_ACTION[t.stage]
  return (
    <div className="mx-auto flex w-full max-w-[1264px] flex-col gap-6 px-4 pt-7 pb-16 sm:px-8">
      <Breadcrumbs
        items={[
          { label: 'Meus roadmaps', link: { to: '/roadmaps' } },
          {
            label: t.roadmapName,
            link: {
              to: '/roadmaps/$roadmapId',
              params: { roadmapId: String(t.roadmapId) },
            },
          },
          {
            label: t.moduleTitle,
            link: {
              to: '/modules/$moduleId',
              params: { moduleId: String(t.moduleId) },
            },
          },
          { label: t.title },
        ]}
      />
      <section className="flex flex-col gap-1.5">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-[30px] leading-[1.15] font-semibold tracking-[-0.02em] sm:text-[34px]">
            {t.title}
          </h1>
          {t.isOptional && (
            <span className="inline-flex h-6 items-center rounded-full border border-dashed border-ink-subtle px-2.5 text-xs font-semibold">
              Opcional
            </span>
          )}
          <Button variant="outline" size="sm" onClick={onEdit}>
            <Pencil aria-hidden="true" />
            Editar
          </Button>
          {t.stage !== 'planned' && (
            <DropdownMenu modal={false}>
              <DropdownMenuTrigger asChild>
                <IconButton label="Mais ações do tópico" size="sm">
                  <MoreHorizontal />
                </IconButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuItem onSelect={onReopen}>
                  Reabrir etapa…
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
        {t.description && (
          <p className="max-w-[720px] text-ink-muted">{t.description}</p>
        )}
        <p className="text-[13px] text-ink-soft">
          Criado em {longDate(t.createdAt)} · Atualizado em{' '}
          {longDate(t.updatedAt)}
        </p>
      </section>

      <section
        aria-label="Etapa e agenda"
        className="flex flex-col gap-5 rounded-2xl border border-line bg-surface px-5 py-6 sm:px-6"
      >
        <div className="flex flex-wrap items-center gap-x-10 gap-y-6">
          <Stepper topic={t} />
          <div className="flex flex-[0_1_320px] flex-col items-start gap-1.5">
            <h2 className="text-lg font-semibold">{stageHeadline(t.stage)}</h2>
            <p className="text-sm text-ink-muted">
              {sessionsLine(t.counts.sessions, t.lastSessionOn, today)}
            </p>
            <Button size="lg" className="mt-1.5 h-11 px-4" onClick={onRegister}>
              {registerIcon ? (
                <ActionMark
                  action={registerIcon}
                  size="sm"
                  className="bg-transparent text-surface"
                />
              ) : (
                <Plus aria-hidden="true" />
              )}
              Registrar sessão
            </Button>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 border-t border-line-soft pt-4">
          <span className="text-sm text-ink-strong">Agendado para</span>
          <ul aria-label="Dias agendados" className="contents">
            {entries.map((e) => (
              <li
                key={e.id}
                className={cn(
                  'inline-flex h-8 items-center gap-1.5 rounded-full border border-dashed pr-1 pl-3 text-[13px]',
                  e.date < today
                    ? 'border-line-control text-ink-muted'
                    : 'border-ink-faint text-ink',
                )}
              >
                <CalendarDays className="size-3.5" aria-hidden="true" />
                {formatPlan(e.date)}
                <button
                  type="button"
                  aria-label={`Tirar ${formatPlan(e.date)} da agenda`}
                  onClick={() => onRemoveDay(e.id)}
                  className="grid size-6 place-items-center rounded-full hover:bg-surface-sunken"
                >
                  <X className="size-3" aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
          <AddDay onAdd={onAddDay} />
          {entries.length === 0 && (
            <span className="text-[13px] text-ink-soft">Sem dia agendado</span>
          )}
          {allPast && (
            <span className="ml-auto text-xs text-ink-soft">
              Todas as datas previstas já passaram
            </span>
          )}
        </div>
      </section>

      <Tabs
        value={tab}
        onValueChange={(v) => onTabChange(v as TopicTab)}
        className="gap-6"
      >
        <TabsList
          aria-label="Seções do tópico"
          className="w-full justify-start overflow-x-auto overflow-y-hidden"
        >
          <TabsTrigger value="timeline">Linha do tempo</TabsTrigger>
          <TabsTrigger value="files">
            Arquivos
            {t.counts.files > 0 && (
              <span className="ml-1.5 rounded-full bg-surface-sunken px-1.5 text-xs">
                {t.counts.files}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="resources">
            Referências
            {t.counts.resources > 0 && (
              <span className="ml-1.5 rounded-full bg-surface-sunken px-1.5 text-xs">
                {t.counts.resources}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="notes">
            Anotações
            {t.counts.notes > 0 && (
              <span className="ml-1.5 rounded-full bg-surface-sunken px-1.5 text-xs">
                {t.counts.notes}
              </span>
            )}
          </TabsTrigger>
        </TabsList>
        {(['timeline', 'files', 'resources', 'notes'] as const).map((k) => (
          <TabsContent key={k} value={k}>
            {panels[k]}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}
