import { Link } from '@tanstack/react-router'
import { List, Network, Plus } from 'lucide-react'
import { Breadcrumbs } from '@/components/Breadcrumbs'
import type { Schemas } from '@/lib/api/client'
import { cn } from '@/lib/utils'
import { RoadmapMap } from './RoadmapMap'

type Roadmap = Schemas['RoadmapDetail']

export type RoadmapView = 'map' | 'list'
export type RoadmapTab = 'roadmap' | 'progress'

export type RoadmapPageProps = {
  roadmap: Roadmap
  tab: RoadmapTab
  view: RoadmapView
  onArchive: (archive: boolean) => void
  onChoose: (branchModuleId: number, chosenModuleId: number) => void
  choosing?: boolean
  /** Conteúdo da visão Lista (FU08) e da aba Progresso (FU09). */
  list?: React.ReactNode
  progress?: React.ReactNode
  /** Quantos módulos em andamento (número da aba Progresso). */
  activeModules?: number
}

const tabClass = (on: boolean) =>
  cn(
    'inline-flex h-[46px] flex-none items-center gap-2 border-b-2 px-3.5 font-medium',
    on
      ? 'border-ink text-ink'
      : 'border-transparent text-ink-muted hover:text-ink',
  )
const viewClass = (on: boolean) =>
  cn(
    'inline-flex h-10 items-center gap-2 rounded-lg px-3.5 font-medium',
    on
      ? 'bg-surface text-ink shadow-[0_1px_2px_rgb(21_23_26/0.08)]'
      : 'text-ink-muted hover:text-ink',
  )

/** Página do roadmap: cabeçalho, abas Roadmap/Progresso e Mapa/Lista. */
export function RoadmapPage({
  roadmap: r,
  tab,
  view,
  onArchive,
  onChoose,
  choosing,
  list,
  progress,
  activeModules,
}: RoadmapPageProps) {
  const archived = !!r.archivedAt
  const id = String(r.id)
  return (
    <div className="mx-auto flex w-full max-w-[1264px] flex-col gap-7 px-4 pt-7 pb-16 sm:px-8">
      <Breadcrumbs
        items={[
          { label: 'Meus roadmaps', link: { to: '/roadmaps' } },
          { label: r.name },
        ]}
      />

      {archived && (
        <div
          role="status"
          className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-surface-sunken px-4 py-3"
        >
          <span>
            Este roadmap está arquivado. Ele continua consultável e editável,
            mas fica fora da listagem e da busca padrão.
          </span>
          <button
            type="button"
            onClick={() => onArchive(false)}
            className="h-11 rounded-lg border border-line-control bg-surface px-3.5 font-medium hover:bg-canvas"
          >
            Restaurar
          </button>
        </div>
      )}

      <section className="flex flex-col gap-2.5">
        <h1 className="text-[30px] leading-[1.15] font-semibold tracking-[-0.02em] sm:text-[34px]">
          {r.name}
        </h1>
        {r.goal && (
          <p className="max-w-[640px] text-pretty text-ink-muted">{r.goal}</p>
        )}
        <div className="mt-0.5 flex items-center gap-3">
          <span
            aria-hidden="true"
            className="h-1.5 w-40 overflow-hidden rounded-[3px] bg-surface-hover"
          >
            <span
              className="block h-full bg-chart-completed"
              style={{ width: `${r.progress.percent}%` }}
            />
          </span>
          <span className="text-[13px] text-ink-muted">
            <strong className="font-semibold text-ink">
              {r.progress.percent}%
            </strong>{' '}
            · {r.progress.completed} de {r.progress.total} tópicos concluídos
          </span>
        </div>
        <div className="mt-1.5 flex flex-wrap gap-2">
          {!archived && (
            <button
              type="button"
              onClick={() => onArchive(true)}
              className="h-11 rounded-[10px] border border-line-strong bg-surface px-4 font-medium hover:bg-canvas"
            >
              Arquivar
            </button>
          )}
          <Link
            to="/roadmaps/new"
            search={{ roadmapId: r.id }}
            className="inline-flex h-11 items-center gap-2 rounded-[10px] border border-line-strong bg-surface px-4 font-medium hover:bg-canvas"
          >
            <Plus className="size-4" aria-hidden="true" />
            Adicionar módulos e tópicos
          </Link>
        </div>
        {!r.startedOn && r.modules.length > 0 && (
          <p className="mt-2 max-w-[640px] rounded-xl border-[1.5px] border-dashed border-ink-faint bg-surface px-5 py-4 text-ink-muted">
            <strong className="block font-semibold text-ink">
              Este roadmap ainda não foi iniciado
            </strong>
            Ele começa quando você registrar a primeira sessão em qualquer
            tópico.
          </p>
        )}
      </section>

      <nav
        aria-label="Seções do roadmap"
        className="-mb-3 flex gap-1 overflow-x-auto shadow-[inset_0_-1px_0_var(--color-line)]"
      >
        <Link
          to="/roadmaps/$roadmapId"
          params={{ roadmapId: id }}
          search={view === 'list' ? { view } : {}}
          aria-current={tab === 'roadmap' ? 'page' : undefined}
          className={tabClass(tab === 'roadmap')}
        >
          Roadmap
        </Link>
        <Link
          to="/roadmaps/$roadmapId"
          params={{ roadmapId: id }}
          search={{ tab: 'progress' }}
          aria-current={tab === 'progress' ? 'page' : undefined}
          className={tabClass(tab === 'progress')}
        >
          Progresso
          {activeModules !== undefined && (
            <span
              className={cn(
                'inline-grid h-5 min-w-5 place-items-center rounded-full px-1.5 text-xs',
                tab === 'progress'
                  ? 'bg-ink text-surface'
                  : 'bg-surface-sunken text-ink-muted',
              )}
            >
              {activeModules}
            </span>
          )}
        </Link>
      </nav>

      {tab === 'progress' ? (
        progress
      ) : (
        <section aria-labelledby="modulos" className="flex flex-col gap-3.5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 id="modulos" className="text-lg font-semibold">
              Módulos e tópicos
            </h2>
            <nav
              aria-label="Modo de visualização"
              className="flex gap-0.5 rounded-[10px] bg-surface-hover p-[3px]"
            >
              <Link
                to="/roadmaps/$roadmapId"
                params={{ roadmapId: id }}
                search={{}}
                aria-current={view === 'map' ? 'page' : undefined}
                className={viewClass(view === 'map')}
              >
                <Network className="size-4" aria-hidden="true" />
                Mapa
              </Link>
              <Link
                to="/roadmaps/$roadmapId"
                params={{ roadmapId: id }}
                search={{ view: 'list' }}
                aria-current={view === 'list' ? 'page' : undefined}
                className={viewClass(view === 'list')}
              >
                <List className="size-4" aria-hidden="true" />
                Lista
              </Link>
            </nav>
          </div>
          {r.modules.length === 0 ? (
            <div className="flex flex-col items-center gap-3.5 rounded-[14px] border border-dashed border-line-control bg-surface px-6 py-12 text-center">
              <p className="text-ink-muted">
                Este roadmap ainda não tem módulos. Comece agrupando os assuntos
                que você quer estudar.
              </p>
              <Link
                to="/roadmaps/new"
                search={{ roadmapId: r.id }}
                className="inline-flex h-11 items-center rounded-[10px] bg-ink px-[18px] font-medium text-surface hover:opacity-90"
              >
                Adicionar módulos e tópicos
              </Link>
            </div>
          ) : view === 'list' ? (
            list
          ) : (
            <RoadmapMap roadmap={r} onChoose={onChoose} choosing={choosing} />
          )}
        </section>
      )}
    </div>
  )
}
