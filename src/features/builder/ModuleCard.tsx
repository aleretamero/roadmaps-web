import {
  useSortable,
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useDroppable } from '@dnd-kit/core'
import { GripVertical, MoreHorizontal, Plus, X } from 'lucide-react'
import { IconButton } from '@/components/IconButton'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import type { Anchor, BuilderModule, BuilderTopic } from './model'

export type ModuleCardProps = {
  module: BuilderModule
  index: number
  total: number
  /** "ou, como caminho alternativo a “X”" (só quando é alternativa). */
  alternativeOf: string | null
  /** Primeiro módulo de um roadmap novo não pode ser alternativa. */
  canBeAlternative: boolean
  /** Opções de âncora (roadmap existente): título dos módulos que já existem. */
  anchorOptions: ReadonlyArray<string> | null
  errors: Record<string, string>
  onChange: (patch: Partial<BuilderModule>) => void
  onMove: (delta: number) => void
  onRemove: () => void
  onTopicChange: (j: number, patch: Partial<BuilderTopic>) => void
  onTopicInsert: (at: number) => void
  onTopicRemove: (j: number, focusPrev: boolean) => void
  onTopicMove: (j: number, delta: number) => void
}

const KIND = [
  {
    value: 'required',
    label: 'Obrigatório',
    tip: 'Segue a sequência do roadmap',
  },
  {
    value: 'optional',
    label: 'Opcional',
    tip: 'Desvio que pode ser pulado; não conta no progresso',
  },
  {
    value: 'alternative',
    label: 'Caminho alternativo',
    tip: 'Outra opção para o mesmo ponto (ex.: React ou Angular)',
  },
] as const

const err = (errors: Record<string, string>, path: string) => errors[path]

/** Rótulo curto da âncora escolhida ("depois de “C#”"). */
function anchorLabel(m: BuilderModule) {
  const a = m.kind === 'alternative' ? m.alternativeTo : m.after
  if (!a?.startsWith('title:')) return null
  return `${m.kind === 'alternative' ? 'alternativa a' : 'depois de'} “${a.slice(6)}”`
}

function TopicRow({
  topic,
  moduleIndex,
  index,
  isOnly,
  error,
  onChange,
  onInsertAfter,
  onRemove,
  onMove,
}: {
  topic: BuilderTopic
  moduleIndex: number
  index: number
  isOnly: boolean
  error?: string
  onChange: (patch: Partial<BuilderTopic>) => void
  onInsertAfter: () => void
  onRemove: (focusPrev: boolean) => void
  onMove: (delta: number) => void
}) {
  const {
    setNodeRef,
    transform,
    transition,
    attributes,
    listeners,
    isDragging,
  } = useSortable({ id: `t:${topic.key}`, data: { type: 'topic' } })
  const label = `Tópico ${index + 1} do módulo ${moduleIndex + 1}`
  return (
    <li
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition: transition,
      }}
      className={cn(
        'group/row flex flex-col rounded-lg',
        isDragging && 'relative z-10 bg-surface shadow-menu',
      )}
    >
      <div className="flex min-h-10 items-center gap-1.5 pl-1">
        <button
          type="button"
          {...attributes}
          {...listeners}
          aria-label={`Arrastar ${topic.title.trim() || label}`}
          className="grid h-7 w-4 flex-none cursor-grab place-items-center rounded text-ink-faint opacity-60 group-hover/row:opacity-100 focus-visible:opacity-100"
        >
          <GripVertical className="size-3.5" />
        </button>
        <span
          aria-hidden="true"
          className={cn(
            'size-1.5 flex-none rounded-full',
            topic.isOptional
              ? 'border-[1.5px] border-ink-subtle bg-surface'
              : 'bg-ink-subtle',
          )}
        />
        <label htmlFor={`bt-${topic.key}`} className="sr-only">
          {label}
        </label>
        <input
          id={`bt-${topic.key}`}
          data-bk={topic.key}
          value={topic.title}
          maxLength={160}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `bt-${topic.key}-err` : undefined}
          placeholder={
            index === 0 && isOnly
              ? 'Primeiro tópico (Enter cria outro)'
              : 'Tópico'
          }
          onChange={(e) => onChange({ title: e.target.value })}
          onKeyDown={(e) => {
            if (e.altKey && (e.key === 'ArrowUp' || e.key === 'ArrowDown')) {
              e.preventDefault()
              onMove(e.key === 'ArrowUp' ? -1 : 1)
            } else if (e.key === 'Enter') {
              e.preventDefault()
              onInsertAfter()
            } else if (e.key === 'Backspace' && !e.currentTarget.value) {
              e.preventDefault()
              onRemove(true)
            }
          }}
          className={cn(
            'h-[34px] min-w-0 flex-1 rounded-md bg-transparent px-1.5 text-ink outline-none placeholder:text-ink-faint focus-visible:bg-canvas focus-visible:ring-2 focus-visible:ring-ring/50',
            error && 'ring-[1.5px] ring-danger',
          )}
        />
        <button
          type="button"
          aria-pressed={topic.isOptional}
          onClick={() => onChange({ isOptional: !topic.isOptional })}
          title="Tópico opcional: não conta no progresso"
          className={cn(
            'h-7 flex-none rounded-md px-2 text-xs font-medium',
            topic.isOptional
              ? 'bg-ink text-surface'
              : 'border border-line bg-surface text-ink-soft max-sm:hidden max-sm:group-focus-within/row:inline',
          )}
        >
          Opcional
        </button>
        <label htmlFor={`bd-${topic.key}`} className="sr-only">
          Data prevista de {label}
        </label>
        <input
          id={`bd-${topic.key}`}
          type="date"
          value={topic.date}
          onChange={(e) => onChange({ date: e.target.value })}
          title="Data prevista (opcional)"
          className={cn(
            'h-7 w-[132px] flex-none rounded-md border border-transparent bg-transparent px-1.5 text-xs',
            topic.date
              ? 'border-line-strong text-ink'
              : 'text-ink-faint max-sm:hidden',
          )}
        />
        <IconButton
          label={`Remover ${topic.title.trim() || label}`}
          size="sm"
          onClick={() => onRemove(false)}
        >
          <X />
        </IconButton>
      </div>
      {error && (
        <span
          id={`bt-${topic.key}-err`}
          className="pb-1 pl-9 text-xs text-danger"
        >
          {error}
        </span>
      )}
    </li>
  )
}

/** Um módulo no criador: nome, tipo/posição (⋯) e a lista de tópicos ordenável. */
export function ModuleCard(props: ModuleCardProps) {
  const { module: m, index: i, total, errors } = props
  const {
    setNodeRef,
    transform,
    transition,
    attributes,
    listeners,
    isDragging,
  } = useSortable({ id: `m:${m.key}`, data: { type: 'module' } })
  const { setNodeRef: setDropRef, isOver } = useDroppable({
    id: `drop:${m.key}`,
    data: { type: 'module-drop', moduleKey: m.key },
  })
  const label = `Módulo ${i + 1}${m.title.trim() ? ` (${m.title.trim()})` : ''}`
  const titleErr = err(errors, `modules[${i}].title`)
  const altErr = err(errors, `modules[${i}].alternativeTo`)
  const anchor = anchorLabel(m)
  const anchorValue =
    (m.kind === 'alternative' ? m.alternativeTo : m.after) ?? ''
  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition: transition,
      }}
      className={cn(
        'flex flex-col gap-2',
        isDragging && 'relative z-20 opacity-90',
      )}
    >
      {props.alternativeOf && (
        <div className="-my-0.5 flex items-center gap-2.5 text-xs font-semibold text-ink-muted">
          <span
            aria-hidden="true"
            className="h-0 flex-1 border-t-[1.5px] border-dashed border-ink-faint"
          />
          <span>ou, como caminho alternativo a “{props.alternativeOf}”</span>
          <span
            aria-hidden="true"
            className="h-0 flex-1 border-t-[1.5px] border-dashed border-ink-faint"
          />
        </div>
      )}
      <article
        aria-label={label}
        className={cn(
          'relative flex flex-col gap-1 rounded-[14px] bg-surface py-3.5 pr-3.5 pb-2.5 pl-5',
          m.kind === 'required' && 'border border-line',
          m.kind === 'optional' &&
            'border-[1.5px] border-dashed border-ink-faint',
          m.kind === 'alternative' &&
            'border-[1.5px] border-dashed border-ink-subtle bg-surface-raised',
          isDragging && 'shadow-dialog',
        )}
      >
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            {...attributes}
            {...listeners}
            aria-label={`Arrastar ${label}`}
            className="-ml-2 grid h-[30px] w-4 flex-none cursor-grab place-items-center rounded text-ink-faint"
          >
            <GripVertical className="size-4" />
          </button>
          <span
            aria-hidden="true"
            className={cn(
              'grid size-[26px] flex-none place-items-center rounded-lg font-mono text-xs font-medium',
              m.kind === 'required'
                ? 'bg-ink text-surface'
                : 'bg-surface-sunken text-ink-strong',
            )}
          >
            {i + 1}
          </span>
          <label htmlFor={`bm-${m.key}`} className="sr-only">
            Nome do módulo {i + 1}
          </label>
          <input
            id={`bm-${m.key}`}
            data-bk={m.key}
            value={m.title}
            maxLength={120}
            placeholder="Nome do módulo"
            aria-invalid={titleErr ? true : undefined}
            aria-describedby={titleErr ? `bm-${m.key}-err` : undefined}
            onChange={(e) => props.onChange({ title: e.target.value })}
            onKeyDown={(e) => {
              if (e.altKey && (e.key === 'ArrowUp' || e.key === 'ArrowDown')) {
                e.preventDefault()
                props.onMove(e.key === 'ArrowUp' ? -1 : 1)
              } else if (e.key === 'Enter') {
                e.preventDefault()
                if (m.topics.length)
                  document.getElementById(`bt-${m.topics[0]!.key}`)?.focus()
                else props.onTopicInsert(0)
              }
            }}
            className={cn(
              'h-[38px] min-w-0 flex-1 rounded-lg bg-transparent px-1.5 text-[17px] font-semibold text-ink outline-none placeholder:text-ink-faint focus-visible:bg-canvas focus-visible:ring-2 focus-visible:ring-ring/50',
              titleErr && 'ring-[1.5px] ring-danger',
            )}
          />
          {anchor && (
            <span className="inline-flex h-6 max-w-60 flex-none items-center truncate rounded-full bg-stage-studying px-2.5 text-xs font-semibold text-stage-studying-fg max-sm:hidden">
              {anchor}
            </span>
          )}
          {m.kind === 'optional' && (
            <span className="inline-flex h-6 flex-none items-center rounded-full border border-dashed border-ink-subtle bg-surface px-2.5 text-xs font-semibold text-ink-strong">
              Opcional
            </span>
          )}
          {m.kind === 'alternative' && (
            <span className="inline-flex h-6 flex-none items-center rounded-full bg-surface-sunken px-2.5 text-xs font-semibold text-ink-strong">
              Alternativa
            </span>
          )}
          <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
              <IconButton label={`Opções de ${label}`}>
                <MoreHorizontal />
              </IconButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[290px]">
              <DropdownMenuLabel className="text-[11px] font-semibold tracking-[0.06em] text-ink-soft uppercase">
                Tipo do módulo
              </DropdownMenuLabel>
              <DropdownMenuRadioGroup
                value={m.kind}
                onValueChange={(v) =>
                  props.onChange({
                    kind: v as BuilderModule['kind'],
                    ...(v !== 'alternative'
                      ? { alternativeTo: null }
                      : { after: null }),
                  })
                }
              >
                {KIND.map((k) => {
                  const disabled =
                    k.value === 'alternative' && !props.canBeAlternative
                  return (
                    <DropdownMenuRadioItem
                      key={k.value}
                      value={k.value}
                      disabled={disabled}
                      className="items-start"
                    >
                      <span className="flex flex-col">
                        <span className="font-medium">{k.label}</span>
                        <span className="text-xs leading-[1.35] text-ink-soft">
                          {disabled
                            ? 'O primeiro módulo de um roadmap novo não pode ser alternativa'
                            : k.tip}
                        </span>
                      </span>
                    </DropdownMenuRadioItem>
                  )
                })}
              </DropdownMenuRadioGroup>
              {props.anchorOptions && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuLabel className="text-[11px] font-semibold tracking-[0.06em] text-ink-soft uppercase">
                    {m.kind === 'alternative'
                      ? 'Alternativa a qual módulo?'
                      : 'Entra depois de'}
                  </DropdownMenuLabel>
                  <DropdownMenuRadioGroup
                    value={anchorValue}
                    onValueChange={(v) => {
                      const a = (v || null) as Anchor | null
                      props.onChange(
                        m.kind === 'alternative'
                          ? { alternativeTo: a }
                          : { after: a },
                      )
                    }}
                  >
                    <div className="max-h-[220px] overflow-y-auto">
                      <DropdownMenuRadioItem value="">
                        {m.kind === 'alternative'
                          ? 'Do módulo anterior'
                          : i === 0
                            ? 'No final do roadmap'
                            : 'Na sequência do anterior'}
                        <span className="ml-auto text-xs text-ink-soft">
                          Padrão
                        </span>
                      </DropdownMenuRadioItem>
                      {props.anchorOptions.map((t) => (
                        <DropdownMenuRadioItem key={t} value={`title:${t}`}>
                          {m.kind === 'alternative'
                            ? 'Alternativa a'
                            : 'Depois de'}{' '}
                          “{t}”
                        </DropdownMenuRadioItem>
                      ))}
                    </div>
                  </DropdownMenuRadioGroup>
                </>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                disabled={i === 0}
                onSelect={() => props.onMove(-1)}
                className="pl-8"
              >
                Mover para cima
              </DropdownMenuItem>
              <DropdownMenuItem
                disabled={i === total - 1}
                onSelect={() => props.onMove(1)}
                className="pl-8"
              >
                Mover para baixo
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant="destructive"
                onSelect={props.onRemove}
                className="pl-8"
              >
                Remover módulo
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        {(titleErr || altErr) && (
          <span
            id={`bm-${m.key}-err`}
            className="pl-[52px] text-xs text-danger"
          >
            {titleErr ?? altErr}
          </span>
        )}
        <SortableContext
          items={m.topics.map((t) => `t:${t.key}`)}
          strategy={verticalListSortingStrategy}
        >
          <ul
            ref={setDropRef}
            className={cn(
              'flex min-h-2 flex-col pl-1',
              isOver && 'rounded-lg bg-canvas',
            )}
          >
            {m.topics.map((t, j) => (
              <TopicRow
                key={t.key}
                topic={t}
                moduleIndex={i}
                index={j}
                isOnly={m.topics.length === 1}
                error={err(errors, `modules[${i}].topics[${j}].title`)}
                onChange={(patch) => props.onTopicChange(j, patch)}
                onInsertAfter={() => props.onTopicInsert(j + 1)}
                onRemove={(focusPrev) => props.onTopicRemove(j, focusPrev)}
                onMove={(delta) => props.onTopicMove(j, delta)}
              />
            ))}
          </ul>
        </SortableContext>
        <button
          type="button"
          onClick={() => props.onTopicInsert(m.topics.length)}
          className="mt-0.5 inline-flex h-9 items-center gap-1.5 self-start rounded-lg px-2 text-sm font-medium text-ink-muted hover:bg-canvas hover:text-ink"
        >
          <Plus className="size-3.5" aria-hidden="true" />
          Adicionar tópico
        </button>
      </article>
    </div>
  )
}
