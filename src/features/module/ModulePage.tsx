import { Link } from '@tanstack/react-router'
import { Check, MoreHorizontal, Pencil, Plus } from 'lucide-react'
import { useState } from 'react'
import { Breadcrumbs } from '@/components/Breadcrumbs'
import { IconButton } from '@/components/IconButton'
import { StageChip } from '@/components/StageChip'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { Schemas } from '@/lib/api/client'
import { formatShort, relativeDay, todayISO } from '@/lib/date'
import { stageLabel } from '@/lib/stage'
import { cn } from '@/lib/utils'
import { useLogSession } from '@/components/LogSession'

type Module = Schemas['ModuleDetail']
type Topic = Schemas['TopicSummary']

export type ModuleTab = 'topics' | 'timeline' | 'notes'

const plural = (n: number, one: string, many: string) =>
  `${n} ${n === 1 ? one : many}`

const NUM: Record<Schemas['Stage'], string> = {
  planned: 'border-[1.5px] border-line-control bg-surface text-ink-muted',
  studying: 'bg-stage-studying text-stage-studying-fg',
  practicing: 'bg-stage-practicing text-stage-practicing-fg',
  completed: 'bg-stage-completed text-stage-completed-fg',
}

/** "Praticando desde 29 de out", "Previsto para 28 de out", "1 arquivo". */
export function topicDetails(
  t: Topic,
  today: string,
): Array<{ text: string; tone?: 'danger' }> {
  const out: Array<{ text: string; tone?: 'danger' }> = []
  if (t.isOptional) out.push({ text: 'Opcional' })
  if (t.stage === 'completed' && t.completedOn)
    out.push({ text: `Concluído em ${formatShort(t.completedOn)}` })
  else if (t.startedOn)
    out.push({
      text: `${stageLabel[t.stage]} desde ${formatShort(t.startedOn)}`,
    })
  if (t.dueDate && t.stage !== 'completed') {
    if (t.isLate)
      out.push({
        text: `Atrasado desde ${formatShort(t.dueDate)}`,
        tone: 'danger',
      })
    else if (t.dueDate >= today)
      out.push({
        text: `Previsto ${relativeDay(t.dueDate, today).toLocaleLowerCase('pt-BR')}`,
      })
    else out.push({ text: `Previsto para ${formatShort(t.dueDate)}` })
  }
  if (t.filesCount)
    out.push({ text: plural(t.filesCount, 'arquivo', 'arquivos') })
  return out
}

function TopicRow({
  topic: t,
  index,
  today,
}: {
  topic: Topic
  index: number
  today: string
}) {
  const log = useLogSession()
  const details = topicDetails(t, today)
  const done = t.stage === 'completed'
  return (
    <li className="relative flex min-h-[72px] items-center gap-3 rounded-xl border-b border-line-soft px-1.5 py-3 last:border-b-0 hover:bg-canvas">
      <span
        aria-hidden="true"
        className={cn(
          'grid size-[30px] flex-none place-items-center rounded-full font-mono text-xs font-semibold',
          NUM[t.stage],
        )}
      >
        {done ? <Check className="size-3.5" strokeWidth={2.4} /> : index + 1}
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        {/* O link estica sobre a linha inteira: clicar em qualquer lugar abre o tópico. */}
        <Link
          to="/topics/$topicId"
          params={{ topicId: String(t.id) }}
          className="truncate font-semibold text-ink outline-none after:absolute after:inset-0 after:rounded-xl focus-visible:after:outline-2 focus-visible:after:outline-offset-[-2px] focus-visible:after:outline-link"
        >
          {t.title}
        </Link>
        {details.length > 0 && (
          <span className="flex flex-wrap gap-x-2.5 text-[13px] text-ink-muted">
            {details.map((d) => (
              <span
                key={d.text}
                className={cn(d.tone === 'danger' && 'text-danger')}
              >
                {d.text}
              </span>
            ))}
          </span>
        )}
      </div>
      <StageChip stage={t.stage} className="max-sm:hidden" />
      <div className="relative z-10">
        <DropdownMenu modal={false}>
          <DropdownMenuTrigger asChild>
            <IconButton label={`Ações de ${t.title}`} size="sm">
              <MoreHorizontal />
            </IconButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onSelect={() => log(t.id)}>
              Registrar sessão
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link
                to="/topics/$topicId"
                params={{ topicId: String(t.id) }}
                search={{ edit: 1 }}
              >
                Editar tópico
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </li>
  )
}

export type ModulePageProps = {
  module: Module
  tab: ModuleTab
  onTabChange: (tab: ModuleTab) => void
  onEdit: () => void
  onAddTopics: () => void
  onQuickAdd: (title: string) => Promise<void> | void
  adding?: boolean
  timeline?: React.ReactNode
  notes?: React.ReactNode
  today?: string
}

/** Detalhe do módulo: cabeçalho, progresso e abas Tópicos / Linha do tempo / Anotações. */
export function ModulePage({
  module: m,
  tab,
  onTabChange,
  onEdit,
  onAddTopics,
  onQuickAdd,
  adding = false,
  timeline,
  notes,
  today = todayISO(),
}: ModulePageProps) {
  const [draft, setDraft] = useState('')
  const topics = [...m.topics].sort((a, b) => a.position - b.position)
  const required = topics.filter((t) => !t.isOptional)
  const done = required.filter((t) => t.stage === 'completed').length
  const pct = required.length ? Math.round((done / required.length) * 100) : 0
  const status =
    m.status === 'inProgress'
      ? 'Em andamento'
      : m.status === 'completed'
        ? 'Concluído'
        : null
  const meta = [
    plural(topics.length, 'tópico', 'tópicos'),
    m.startedOn ? `Iniciado em ${formatShort(m.startedOn)}` : 'Não iniciado',
  ].join(' · ')

  const submit = async () => {
    const title = draft.trim()
    if (!title) return
    await onQuickAdd(title)
    setDraft('')
  }

  return (
    <div className="mx-auto flex w-full max-w-[1264px] flex-col gap-6 px-4 pt-7 pb-16 sm:px-8">
      <Breadcrumbs
        items={[
          { label: 'Meus roadmaps', link: { to: '/roadmaps' } },
          {
            label: m.roadmapName,
            link: {
              to: '/roadmaps/$roadmapId',
              params: { roadmapId: String(m.roadmapId) },
            },
          },
          { label: m.title },
        ]}
      />
      <section className="flex flex-wrap items-start justify-between gap-x-12 gap-y-5">
        <div className="flex min-w-0 flex-[1_1_480px] flex-col gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold tracking-[0.06em] text-ink-muted uppercase">
              Módulo
            </span>
            {m.kind === 'optional' && (
              <span className="inline-flex h-6 items-center rounded-full border border-dashed border-ink-subtle px-2.5 text-xs font-semibold">
                Opcional
              </span>
            )}
            {m.kind === 'alternative' && (
              <span className="inline-flex h-6 items-center rounded-full bg-surface-sunken px-2.5 text-xs font-semibold">
                Caminho alternativo
              </span>
            )}
            {status && (
              <span className="inline-flex h-6 items-center rounded-full border border-success bg-stage-completed px-2.5 text-xs font-semibold text-stage-completed-fg">
                {status}
              </span>
            )}
          </div>
          <h1 className="text-[30px] leading-[1.15] font-semibold tracking-[-0.02em] sm:text-[34px]">
            {m.title}
          </h1>
          {m.description && (
            <p className="max-w-[640px] text-ink-muted">{m.description}</p>
          )}
          <p className="text-[13px] text-ink-muted">{meta}</p>
          <div className="mt-1.5 flex flex-wrap gap-2">
            <Button size="lg" className="h-11 px-[18px]" onClick={onAddTopics}>
              <Plus aria-hidden="true" />
              Adicionar tópicos
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="h-11 px-4"
              onClick={onEdit}
            >
              <Pencil aria-hidden="true" />
              Editar módulo
            </Button>
          </div>
        </div>
        <section
          aria-labelledby="mod-prog"
          className="flex w-full flex-col gap-2 rounded-2xl border border-line bg-surface px-5 py-5 sm:w-[340px]"
        >
          <h2 id="mod-prog" className="text-[13px] text-ink-muted">
            Progresso
          </h2>
          <span className="font-mono text-2xl font-medium">{pct}%</span>
          <span
            aria-hidden="true"
            className="h-2 overflow-hidden rounded bg-surface-hover"
          >
            <span
              className="block h-full bg-success"
              style={{ width: `${pct}%` }}
            />
          </span>
          <span className="text-[13px] text-ink-muted">
            {done} de{' '}
            {plural(
              required.length,
              'tópico obrigatório',
              'tópicos obrigatórios',
            )}{' '}
            concluídos
          </span>
        </section>
      </section>

      <Tabs
        value={tab}
        onValueChange={(v) => onTabChange(v as ModuleTab)}
        className="gap-6"
      >
        <TabsList
          aria-label="Seções do módulo"
          className="w-full justify-start"
        >
          <TabsTrigger value="topics">Tópicos</TabsTrigger>
          <TabsTrigger value="timeline">Linha do tempo</TabsTrigger>
          <TabsTrigger value="notes">Anotações</TabsTrigger>
        </TabsList>
        <TabsContent value="topics">
          <section
            aria-label="Tópicos do módulo"
            className="rounded-2xl border border-line bg-surface p-4 sm:px-5"
          >
            {topics.length === 0 ? (
              <p className="px-1.5 py-4 text-ink-muted">
                Este módulo ainda não tem tópicos. Escreva o primeiro abaixo.
              </p>
            ) : (
              <ol className="flex flex-col">
                {topics.map((t, i) => (
                  <TopicRow key={t.id} topic={t} index={i} today={today} />
                ))}
              </ol>
            )}
            <form
              className="mt-3 flex gap-2"
              onSubmit={(e) => {
                e.preventDefault()
                void submit()
              }}
            >
              <label htmlFor="md-new" className="sr-only">
                Novo tópico em {m.title}
              </label>
              <div className="flex min-w-0 flex-1 items-center gap-2 rounded-xl border border-dashed border-line-control px-3 focus-within:border-ink">
                <Plus
                  className="size-4 flex-none text-ink-soft"
                  aria-hidden="true"
                />
                <input
                  id="md-new"
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  maxLength={160}
                  placeholder="Novo tópico (Enter adiciona e já deixa pronto para o próximo)"
                  className="h-10 min-w-0 flex-1 bg-transparent outline-none placeholder:text-ink-soft"
                />
              </div>
              <Button
                type="submit"
                variant="secondary"
                className="h-10"
                disabled={!draft.trim() || adding}
              >
                Adicionar
              </Button>
            </form>
          </section>
        </TabsContent>
        <TabsContent value="timeline">{timeline}</TabsContent>
        <TabsContent value="notes">{notes}</TabsContent>
      </Tabs>
    </div>
  )
}
