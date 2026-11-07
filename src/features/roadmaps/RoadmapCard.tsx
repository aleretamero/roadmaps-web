import { Link } from '@tanstack/react-router'
import { MoreHorizontal } from 'lucide-react'
import { IconButton } from '@/components/IconButton'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { Schemas } from '@/lib/api/client'
import { cn } from '@/lib/utils'

type Summary = Schemas['RoadmapSummary']
type State = 'archived' | 'completed' | 'notStarted' | 'inProgress'

export function roadmapState(r: Summary): State {
  if (r.archivedAt) return 'archived'
  if (r.progress.total > 0 && r.progress.completed >= r.progress.total)
    return 'completed'
  if (!r.startedOn) return 'notStarted'
  return 'inProgress'
}

const STATE: Record<State, { label: string; chip: string; dot: string }> = {
  archived: {
    label: 'Arquivado',
    chip: 'bg-surface-sunken text-ink-muted',
    dot: 'bg-ink-faint',
  },
  completed: {
    label: 'Concluído',
    chip: 'bg-stage-completed text-stage-completed-fg',
    dot: 'bg-chart-completed',
  },
  notStarted: {
    label: 'Não iniciado',
    chip: 'bg-surface-sunken text-ink-muted',
    dot: 'bg-ink-faint',
  },
  inProgress: {
    label: 'Em andamento',
    chip: 'bg-stage-studying text-stage-studying-fg',
    dot: 'bg-chart-studying',
  },
}

export type RoadmapCardProps = {
  roadmap: Summary
  onArchive: (archive: boolean) => void
  onDelete: () => void
}

/** Card de um roadmap: o card todo abre; o ⋯ tem arquivar/desarquivar e apagar. */
export function RoadmapCard({
  roadmap: r,
  onArchive,
  onDelete,
}: RoadmapCardProps) {
  const st = STATE[roadmapState(r)]
  const archived = !!r.archivedAt
  return (
    <article className="relative flex flex-col gap-4 rounded-[14px] border border-line bg-surface px-6 py-[22px] transition-shadow focus-within:shadow-card-open hover:border-line-strong hover:shadow-card-open">
      <div className="flex items-start justify-between gap-3">
        <h2 className="text-[19px] leading-[1.3] font-semibold tracking-[-0.01em]">
          <Link
            to="/roadmaps/$roadmapId"
            params={{ roadmapId: String(r.id) }}
            className="rounded-sm outline-none after:absolute after:inset-0 after:rounded-[14px] focus-visible:after:outline-2 focus-visible:after:outline-offset-2 focus-visible:after:outline-link"
          >
            {r.name}
          </Link>
        </h2>
        <div className="relative z-10 flex flex-none items-center gap-1">
          <span
            className={cn(
              'inline-flex h-[26px] items-center gap-1.5 rounded-full px-2.5 text-xs font-semibold',
              st.chip,
            )}
          >
            <span
              aria-hidden="true"
              className={cn('size-[7px] rounded-full', st.dot)}
            />
            {st.label}
          </span>
          {/* modal={false}: o Apagar abre um diálogo; com o menu modal, o foco e o
              pointer-events do body brigam entre os dois. */}
          <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
              <IconButton label={`Ações de ${r.name}`} size="sm">
                <MoreHorizontal />
              </IconButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link
                  to="/roadmaps/$roadmapId"
                  params={{ roadmapId: String(r.id) }}
                >
                  Abrir
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => onArchive(!archived)}>
                {archived ? 'Desarquivar' : 'Arquivar'}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" onSelect={onDelete}>
                Apagar…
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      <p className="leading-[1.45] text-ink-muted">
        {r.goal || 'Sem descrição.'}
      </p>
      <div className="mt-auto flex flex-col gap-2">
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-[13px] text-ink-muted">
            {r.progress.completed} de {r.progress.total} tópicos concluídos
          </span>
          <span className="font-mono font-medium">{r.progress.percent}%</span>
        </div>
        <span
          aria-hidden="true"
          className="block h-1.5 overflow-hidden rounded-[3px] bg-surface-hover"
        >
          <span
            className="block h-full bg-success"
            style={{ width: `${r.progress.percent}%` }}
          />
        </span>
      </div>
    </article>
  )
}
