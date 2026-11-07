import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useDroppable,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import type { DragEndEvent } from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Link } from '@tanstack/react-router'
import {
  CalendarDays,
  ChevronDown,
  GripVertical,
  MoreHorizontal,
  Plus,
} from 'lucide-react'
import { useState } from 'react'
import { IconButton } from '@/components/IconButton'
import { StageChip } from '@/components/StageChip'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { Schemas } from '@/lib/api/client'
import { formatShort } from '@/lib/date'
import { cn } from '@/lib/utils'
import {
  moveModuleTo,
  moveTopicTo,
  nudgeTopic,
  orderedModules,
} from './listOps'
import type { ReorderChange } from './listOps'
import { useLogSession } from '@/components/LogSession'

type Roadmap = Schemas['RoadmapDetail']
type ModuleNode = Schemas['ModuleNode']
type Topic = Schemas['TopicSummary']

const pad = (n: number) => String(n).padStart(2, '0')
const STATUS: Record<Schemas['ModuleStatus'], string | null> = {
  notStarted: null,
  inProgress: 'Em andamento',
  completed: 'Concluído',
}

function TopicRow({
  topic,
  number,
  onNudge,
}: {
  topic: Topic
  number: string
  onNudge: (delta: -1 | 1) => void
}) {
  const log = useLogSession()
  const {
    setNodeRef,
    transform,
    transition,
    attributes,
    listeners,
    isDragging,
  } = useSortable({
    id: `t:${topic.id}`,
  })
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.altKey && (e.key === 'ArrowUp' || e.key === 'ArrowDown')) {
      e.preventDefault()
      onNudge(e.key === 'ArrowUp' ? -1 : 1)
    }
  }
  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        'flex min-h-[52px] items-center gap-2 border-t border-line-soft py-1.5 pr-3 pl-6 sm:gap-3',
        isDragging && 'relative z-10 bg-surface shadow-menu',
      )}
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        aria-label={`Arrastar ${topic.title}`}
        className="grid h-8 w-4 flex-none cursor-grab place-items-center rounded text-ink-faint"
      >
        <GripVertical className="size-3.5" />
      </button>
      <span
        aria-hidden="true"
        className="w-7 flex-none font-mono text-xs text-ink-soft"
      >
        {number}
      </span>
      <Link
        to="/topics/$topicId"
        params={{ topicId: String(topic.id) }}
        data-topic={topic.id}
        onKeyDown={onKeyDown}
        className="min-w-0 flex-1 truncate rounded-md py-1 text-[15px] text-ink hover:underline"
      >
        {topic.title}
        {topic.isOptional && (
          <span className="ml-2 text-xs text-ink-soft">opcional</span>
        )}
      </Link>
      {topic.dueDate && (
        <span
          className={cn(
            'hidden flex-none items-center gap-1 text-[13px] sm:inline-flex',
            topic.isLate ? 'text-danger' : 'text-ink-muted',
          )}
        >
          <CalendarDays className="size-3.5" aria-hidden="true" />
          <span className="sr-only">
            {topic.isLate ? 'Atrasado, era para' : 'Data prevista:'}{' '}
          </span>
          {formatShort(topic.dueDate)}
        </span>
      )}
      <StageChip stage={topic.stage} />
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <IconButton label={`Ações de ${topic.title}`} size="sm">
            <MoreHorizontal />
          </IconButton>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={() => log(topic.id)}>
            Registrar sessão
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link
              to="/topics/$topicId"
              params={{ topicId: String(topic.id) }}
              search={{ edit: 1 }}
            >
              Editar tópico
            </Link>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </li>
  )
}

function ModuleCard({
  module: m,
  index,
  afterTitles,
  expanded,
  onToggle,
  onNudgeModule,
  onNudgeTopic,
}: {
  module: ModuleNode
  index: number
  afterTitles: Array<string>
  expanded: boolean
  onToggle: () => void
  onNudgeModule: (delta: -1 | 1) => void
  onNudgeTopic: (topicId: number, delta: -1 | 1) => void
}) {
  const {
    setNodeRef,
    transform,
    transition,
    attributes,
    listeners,
    isDragging,
  } = useSortable({
    id: `m:${m.id}`,
  })
  const { setNodeRef: setDropRef, isOver } = useDroppable({
    id: `drop:${m.id}`,
  })
  const status = STATUS[m.status]
  const topics = [...m.topics].sort((a, b) => a.position - b.position)
  const listId = `list-m-${m.id}`
  return (
    <section
      ref={setNodeRef}
      aria-label={`Módulo ${m.title}`}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        'rounded-[14px] border bg-surface transition-shadow',
        m.kind === 'optional'
          ? 'border-dashed border-ink-faint'
          : 'border-line',
        isDragging && 'relative z-20 shadow-dialog',
        isOver && 'shadow-[0_0_0_2px_var(--color-link)]',
      )}
    >
      <div className="flex items-center gap-1 py-1.5 pr-2.5">
        <button
          type="button"
          {...attributes}
          {...listeners}
          aria-label={`Arrastar módulo ${m.title}`}
          className="grid h-10 w-[18px] flex-none cursor-grab place-items-center rounded text-ink-faint"
        >
          <GripVertical className="size-4" />
        </button>
        <button
          type="button"
          aria-expanded={expanded}
          aria-controls={listId}
          onClick={onToggle}
          onKeyDown={(e) => {
            if (e.altKey && (e.key === 'ArrowUp' || e.key === 'ArrowDown')) {
              e.preventDefault()
              onNudgeModule(e.key === 'ArrowUp' ? -1 : 1)
            }
          }}
          data-module={m.id}
          className="flex min-h-[52px] min-w-0 flex-1 items-center gap-3 rounded-[10px] px-3 text-left"
        >
          <ChevronDown
            className={cn(
              'size-4 flex-none transition-transform',
              !expanded && '-rotate-90',
            )}
            aria-hidden="true"
          />
          <span className="font-mono text-[13px] text-ink-soft">
            {pad(index + 1)}
          </span>
          <span className="flex min-w-0 flex-col">
            <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <span className="text-[17px] font-semibold">{m.title}</span>
              {status && (
                <span className="inline-flex h-5 items-center rounded-full border border-success bg-stage-completed px-2 text-[11px] font-semibold text-stage-completed-fg">
                  {status}
                </span>
              )}
              {m.kind === 'optional' && (
                <span className="inline-flex h-5 items-center rounded-full border border-dashed border-ink-subtle px-2 text-[11px] font-semibold text-ink-strong">
                  Opcional
                </span>
              )}
              {m.kind === 'alternative' && (
                <span className="inline-flex h-5 items-center rounded-full bg-surface-sunken px-2 text-[11px] font-semibold text-ink-strong">
                  Alternativa
                </span>
              )}
            </span>
            {afterTitles.length > 0 && (
              <span className="text-xs text-ink-soft">
                Depois de: {afterTitles.join(', ')}
              </span>
            )}
            {m.description && (
              <span className="truncate text-[13px] text-ink-muted">
                {m.description}
              </span>
            )}
          </span>
        </button>
        <span className="hidden flex-none text-[13px] text-ink-muted sm:inline">
          {m.progress.completed} de {m.progress.total} concluídos
        </span>
        <DropdownMenu modal={false}>
          <DropdownMenuTrigger asChild>
            <IconButton label={`Ações do módulo ${m.title}`} size="sm">
              <MoreHorizontal />
            </IconButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link to="/modules/$moduleId" params={{ moduleId: String(m.id) }}>
                Abrir módulo
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link
                to="/modules/$moduleId"
                params={{ moduleId: String(m.id) }}
                search={{ add: 1 }}
              >
                Adicionar tópicos
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link
                to="/modules/$moduleId"
                params={{ moduleId: String(m.id) }}
                search={{ edit: 1 }}
              >
                Editar módulo
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      {expanded && (
        <div id={listId}>
          <SortableContext
            items={topics.map((t) => `t:${t.id}`)}
            strategy={verticalListSortingStrategy}
          >
            <ul
              ref={setDropRef}
              aria-label={`Tópicos de ${m.title}`}
              className="min-h-2"
            >
              {topics.map((t, i) => (
                <TopicRow
                  key={t.id}
                  topic={t}
                  number={`${index + 1}.${i + 1}`}
                  onNudge={(d) => onNudgeTopic(t.id, d)}
                />
              ))}
            </ul>
          </SortableContext>
          <div className="border-t border-line-soft px-6 py-3 pl-[60px]">
            <Link
              to="/modules/$moduleId"
              params={{ moduleId: String(m.id) }}
              search={{ add: 1 }}
              className="inline-flex h-9 items-center gap-2 rounded-lg px-1 font-medium text-link hover:underline"
            >
              <Plus className="size-4" aria-hidden="true" />
              Adicionar tópicos
            </Link>
          </div>
        </div>
      )}
    </section>
  )
}

export type RoadmapListProps = {
  roadmap: Roadmap
  onReorder: (change: ReorderChange) => void
}

/** Lista do roadmap: módulos com tópicos, menus ⋯ e arrastar e soltar (também por teclado). */
export function RoadmapList({ roadmap, onReorder }: RoadmapListProps) {
  const mods = orderedModules(roadmap)
  const [collapsed, setCollapsed] = useState<Set<number>>(() => new Set())
  const titleOf = new Map(roadmap.modules.map((m) => [m.id, m.title]))
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )
  const refocus = (selector: string) =>
    requestAnimationFrame(() =>
      document.querySelector<HTMLElement>(selector)?.focus(),
    )

  const apply = (change: ReorderChange | null, focus?: string) => {
    if (!change) return
    onReorder(change)
    if (focus) refocus(focus)
  }

  const moduleOfTopic = (topicId: number) =>
    roadmap.modules.find((m) => m.topics.some((t) => t.id === topicId))

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over) return
    const a = String(active.id)
    const o = String(over.id)
    if (a.startsWith('m:')) {
      const target = o.startsWith('m:')
        ? Number(o.slice(2))
        : o.startsWith('drop:')
          ? Number(o.slice(5))
          : null
      if (target === null) return
      apply(
        moveModuleTo(
          roadmap,
          Number(a.slice(2)),
          mods.findIndex((m) => m.id === target),
        ),
      )
      return
    }
    const topicId = Number(a.slice(2))
    if (o.startsWith('t:')) {
      const overId = Number(o.slice(2))
      const dest = moduleOfTopic(overId)
      if (!dest) return
      const list = [...dest.topics].sort((x, y) => x.position - y.position)
      apply(
        moveTopicTo(
          roadmap,
          topicId,
          dest.id,
          list.findIndex((t) => t.id === overId),
        ),
      )
    } else if (o.startsWith('drop:') || o.startsWith('m:')) {
      const dest = roadmap.modules.find(
        (m) => m.id === Number(o.slice(o.indexOf(':') + 1)),
      )
      if (dest && dest.id !== moduleOfTopic(topicId)?.id)
        apply(moveTopicTo(roadmap, topicId, dest.id, dest.topics.length))
    }
  }

  return (
    <div className="flex flex-col gap-3.5">
      <p className="flex items-center gap-2 text-[13px] text-ink-muted">
        <GripVertical
          className="size-4 flex-none text-ink-faint"
          aria-hidden="true"
        />
        Arraste tópicos para reordenar ou levá-los a outro módulo, e o cabeçalho
        de um módulo para mudar a ordem. Pelo teclado: foco no item e Alt + ↑/↓.
      </p>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={onDragEnd}
        accessibility={{
          screenReaderInstructions: {
            draggable:
              'Para mover, aperte espaço ou Enter, use as setas e aperte espaço de novo para soltar. Esc cancela.',
          },
          announcements: {
            onDragStart: () => 'Pegou o item.',
            onDragOver: () => 'Movendo.',
            onDragEnd: () => 'Soltou o item.',
            onDragCancel: () => 'Movimento cancelado.',
          },
        }}
      >
        <SortableContext
          items={mods.map((m) => `m:${m.id}`)}
          strategy={verticalListSortingStrategy}
        >
          {mods.map((m, i) => (
            <ModuleCard
              key={m.id}
              module={m}
              index={i}
              afterTitles={m.dependsOn
                .map((d) => titleOf.get(d))
                .filter((t): t is string => !!t)}
              expanded={!collapsed.has(m.id)}
              onToggle={() =>
                setCollapsed((s) => {
                  const n = new Set(s)
                  if (n.has(m.id)) n.delete(m.id)
                  else n.add(m.id)
                  return n
                })
              }
              onNudgeModule={(d) =>
                apply(
                  moveModuleTo(roadmap, m.id, i + d),
                  `[data-module="${m.id}"]`,
                )
              }
              onNudgeTopic={(topicId, d) =>
                apply(
                  nudgeTopic(roadmap, topicId, d),
                  `[data-topic="${topicId}"]`,
                )
              }
            />
          ))}
        </SortableContext>
      </DndContext>
    </div>
  )
}
