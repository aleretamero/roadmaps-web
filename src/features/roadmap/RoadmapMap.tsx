import { Link } from '@tanstack/react-router'
import { Check, Plus } from 'lucide-react'
import type { Schemas } from '@/lib/api/client'
import { stageLabel } from '@/lib/stage'
import { cn } from '@/lib/utils'
import { MAP_W, layoutMap } from './mapLayout'
import type { DrawKind, PlacedModule, PlacedTopic } from './mapLayout'

type Roadmap = Schemas['RoadmapDetail']

const TOPIC: Record<Schemas['Stage'], string> = {
  planned: 'border-line-control bg-surface',
  studying: 'border-link bg-stage-studying',
  practicing: 'border-chart-practicing bg-stage-practicing',
  completed: 'border-success bg-stage-completed',
}
const NODE: Record<DrawKind, string> = {
  main: 'bg-ink text-surface',
  optional: 'border-2 border-dashed border-ink bg-surface text-ink',
  alt: 'bg-surface-sunken text-ink-muted',
}
const GROUP: Record<DrawKind, string> = {
  main: 'border border-line bg-surface/85',
  optional: 'border-[1.5px] border-dashed border-ink-faint bg-surface/75',
  alt: 'border border-line bg-surface-sunken/85',
}
const STATUS: Record<Schemas['ModuleStatus'], string | null> = {
  notStarted: null,
  inProgress: 'Em andamento',
  completed: 'Concluído',
}

const LEGEND = [
  { label: 'Planejado', box: 'border-line-control bg-surface' },
  { label: 'Estudando', box: 'border-link bg-stage-studying' },
  { label: 'Praticando', box: 'border-chart-practicing bg-stage-practicing' },
  { label: 'Concluído', box: 'border-success bg-stage-completed' },
  { label: 'Opcional', box: 'border-dashed border-ink-muted bg-surface' },
]

const at = (p: { x: number; y: number; w?: number; h?: number }) => ({
  left: p.x,
  top: p.y,
  ...(p.w !== undefined ? { width: p.w } : {}),
  ...(p.h !== undefined ? { height: p.h } : {}),
})

function ModuleNodeView({ placed }: { placed: PlacedModule }) {
  const m = placed.module
  const status = STATUS[m.status]
  const extra = [
    m.kind === 'optional' ? 'opcional' : null,
    placed.kind === 'alt' ? 'caminho não escolhido' : null,
    status?.toLocaleLowerCase('pt-BR'),
    `${m.progress.completed} de ${m.progress.total} tópicos concluídos`,
  ]
    .filter(Boolean)
    .join(', ')
  // Nome acessível = o texto visível; o resto vai na descrição (aria-describedby),
  // para o nome nunca divergir do que aparece na tela.
  const descId = `map-m-${m.id}`
  return (
    <Link
      to="/modules/$moduleId"
      params={{ moduleId: String(m.id) }}
      aria-describedby={descId}
      className={cn(
        'absolute z-[1] flex h-14 items-center justify-center rounded-xl px-3 text-center text-[15px] leading-[1.15] font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-link',
        NODE[placed.kind],
      )}
      style={at({ x: placed.x, y: placed.y, w: placed.w })}
    >
      {status && (
        <span
          aria-hidden="true"
          className={cn(
            'absolute -top-2.5 left-3 inline-flex h-5 items-center rounded-full px-2 text-[11px] font-semibold tracking-[0.02em]',
            m.status === 'completed'
              ? 'bg-stage-completed text-stage-completed-fg'
              : 'border border-success bg-stage-completed text-stage-completed-fg',
          )}
        >
          {status}
        </span>
      )}
      <span className="line-clamp-2">{m.title}</span>
      <span id={descId} hidden>
        Módulo, {extra}
      </span>
    </Link>
  )
}

function TopicNodeView({ placed }: { placed: PlacedTopic }) {
  const t = placed.topic
  const descId = `map-t-${t.id}`
  return (
    <Link
      to="/topics/$topicId"
      params={{ topicId: String(t.id) }}
      aria-describedby={descId}
      className={cn(
        'absolute z-[1] flex items-center gap-2 rounded-[10px] border-[1.5px] px-3 text-left text-sm font-medium text-ink shadow-[0_1px_0_rgb(21_23_26/0.06)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-link',
        placed.dimmed ? 'border-line bg-surface text-ink-soft' : TOPIC[t.stage],
        t.isOptional && 'border-dashed',
      )}
      style={at(placed)}
    >
      <span className="min-w-0 flex-1 truncate">{t.title}</span>
      {t.isOptional && (
        <span className="flex-none text-[11px] font-medium text-ink-muted">
          opcional
        </span>
      )}
      <span id={descId} hidden>
        {stageLabel[t.stage]}
        {placed.dimmed ? ', caminho não escolhido' : ''}
      </span>
      {t.stage === 'completed' && !placed.dimmed && (
        <Check
          className="size-3.5 flex-none text-success"
          strokeWidth={2.4}
          aria-hidden="true"
        />
      )}
    </Link>
  )
}

export type RoadmapMapProps = {
  roadmap: Roadmap
  onChoose: (branchModuleId: number, chosenModuleId: number) => void
  choosing?: boolean
  canEdit?: boolean
}

/** Mapa do roadmap: módulos em camadas, tópicos coloridos pela etapa e escolha de caminho. */
export function RoadmapMap({
  roadmap,
  onChoose,
  choosing = false,
  canEdit = true,
}: RoadmapMapProps) {
  const L = layoutMap(roadmap)
  const topicsByModule = new Map<number, Array<PlacedTopic>>()
  for (const t of L.topics)
    topicsByModule.set(t.module.id, [
      ...(topicsByModule.get(t.module.id) ?? []),
      t,
    ])
  return (
    <div className="overflow-x-auto rounded-2xl border border-line bg-surface bg-dots-map">
      <div className="min-w-[1080px]">
        <ul
          aria-label="Legenda do mapa"
          className="flex flex-wrap items-center justify-center gap-x-[18px] gap-y-2 px-6 pt-[22px] pb-1.5 text-[13px] text-ink-muted"
        >
          {LEGEND.map((l) => (
            <li key={l.label} className="inline-flex items-center gap-1.5">
              <span
                aria-hidden="true"
                className={cn('size-3.5 rounded-[4px] border-[1.5px]', l.box)}
              />
              {l.label}
            </li>
          ))}
          <li className="inline-flex items-center gap-1.5">
            <span
              aria-hidden="true"
              className="h-[3px] w-[22px] rounded bg-line-control"
            />
            Caminho não escolhido
          </li>
        </ul>
        <p className="mb-1.5 text-center text-xs text-ink-soft">
          Opcionais e caminhos não escolhidos não contam no progresso. Clique
          num tópico para abrir as anotações.
        </p>
        <div
          className="relative mx-auto"
          style={{ width: MAP_W, height: L.height }}
        >
          <svg
            width={MAP_W}
            height={L.height}
            viewBox={`0 0 ${MAP_W} ${L.height}`}
            fill="none"
            aria-hidden="true"
            className="absolute top-0 left-0"
          >
            <path
              d={L.paths.topic}
              className="stroke-ink-faint"
              strokeWidth={1.5}
              strokeDasharray="4 4"
            />
            <path
              d={L.paths.alt}
              className="stroke-line-control"
              strokeWidth={2.5}
            />
            <path
              d={L.paths.optional}
              className="stroke-ink-muted"
              strokeWidth={2}
              strokeDasharray="7 6"
            />
            <path d={L.paths.main} className="stroke-ink" strokeWidth={2.5} />
          </svg>
          {L.groups.map((g, i) => (
            <div
              key={i}
              aria-hidden="true"
              className={cn('absolute rounded-2xl', GROUP[g.kind])}
              style={at(g)}
            />
          ))}
          <div className="absolute top-0 left-[360px] flex h-12 w-80 items-center justify-center truncate rounded-full border-2 border-ink bg-surface px-5 text-base font-semibold">
            {roadmap.name}
          </div>
          {L.splitLabels.map((s, i) => (
            <div
              key={i}
              className="absolute z-[1] flex h-[26px] w-[150px] items-center justify-center rounded-full border border-ink bg-surface px-3 text-xs font-semibold whitespace-nowrap"
              style={at(s)}
            >
              Escolha um caminho
            </div>
          ))}
          {L.modules.map((pm) => (
            <div key={pm.module.id} role="group" aria-label={pm.module.title}>
              <ModuleNodeView placed={pm} />
              {(topicsByModule.get(pm.module.id) ?? []).map((t) => (
                <TopicNodeView key={t.topic.id} placed={t} />
              ))}
              {pm.branch && pm.choice && (
                <button
                  type="button"
                  disabled={choosing || !canEdit}
                  aria-pressed={pm.branch.chosen}
                  aria-describedby={`map-m-${pm.module.id}`}
                  onClick={() =>
                    pm.branch &&
                    !pm.branch.chosen &&
                    onChoose(pm.branch.parentId, pm.module.id)
                  }
                  className={cn(
                    'absolute z-[1] flex h-8 w-[170px] items-center justify-center gap-1.5 rounded-full text-[13px] font-semibold disabled:cursor-default',
                    pm.branch.chosen
                      ? 'bg-ink text-surface'
                      : 'border border-ink-faint bg-surface text-ink hover:bg-canvas',
                  )}
                  style={at(pm.choice)}
                >
                  {pm.branch.chosen && (
                    <Check className="size-3.5" aria-hidden="true" />
                  )}
                  {pm.branch.chosen ? 'Meu caminho' : 'Seguir este caminho'}
                </button>
              )}
            </div>
          ))}
          {canEdit && (
            <Link
              to="/roadmaps/new"
              search={{ roadmapId: roadmap.id }}
              className="absolute left-[400px] inline-flex h-11 w-60 items-center justify-center gap-2 rounded-xl border-[1.5px] border-dashed border-ink-subtle bg-surface font-medium text-ink hover:bg-canvas"
              style={{ top: L.addY }}
            >
              <Plus className="size-4" aria-hidden="true" />
              Adicionar módulos e tópicos
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}
