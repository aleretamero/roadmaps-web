import { arrayMove } from '@dnd-kit/sortable'
import type { Schemas } from '@/lib/api/client'

type Roadmap = Schemas['RoadmapDetail']

export type ReorderCall =
  | { kind: 'topics'; moduleId: number; ids: Array<number> }
  | { kind: 'modules'; ids: Array<number> }
  | { kind: 'move'; topicId: number; moduleId: number; position: number }

export type ReorderChange = { next: Roadmap; call: ReorderCall }

const byPosition = (r: Roadmap) =>
  [...r.modules].sort((a, b) => a.position - b.position)

/** Módulos na ordem da lista. */
export const orderedModules = byPosition

export function moveModuleTo(
  r: Roadmap,
  moduleId: number,
  toIndex: number,
): ReorderChange | null {
  const mods = byPosition(r)
  const from = mods.findIndex((m) => m.id === moduleId)
  if (from < 0 || toIndex < 0 || toIndex >= mods.length || from === toIndex)
    return null
  const next = arrayMove(mods, from, toIndex).map((m, i) => ({
    ...m,
    position: i,
  }))
  return {
    next: { ...r, modules: next },
    call: { kind: 'modules', ids: next.map((m) => m.id) },
  }
}

/** Reordena dentro do módulo ou leva o tópico para outro módulo na posição dada. */
export function moveTopicTo(
  r: Roadmap,
  topicId: number,
  toModuleId: number,
  toIndex: number,
): ReorderChange | null {
  const from = r.modules.find((m) => m.topics.some((t) => t.id === topicId))
  const to = r.modules.find((m) => m.id === toModuleId)
  if (!from || !to) return null
  const topic = from.topics.find((t) => t.id === topicId)!
  if (from.id === to.id) {
    const list = [...from.topics].sort((a, b) => a.position - b.position)
    const i = list.findIndex((t) => t.id === topicId)
    if (toIndex < 0 || toIndex >= list.length || i === toIndex) return null
    const sorted = arrayMove(list, i, toIndex).map((t, k) => ({
      ...t,
      position: k,
    }))
    return {
      next: {
        ...r,
        modules: r.modules.map((m) =>
          m.id === from.id ? { ...m, topics: sorted } : m,
        ),
      },
      call: { kind: 'topics', moduleId: from.id, ids: sorted.map((t) => t.id) },
    }
  }
  const source = from.topics
    .filter((t) => t.id !== topicId)
    .map((t, k) => ({ ...t, position: k }))
  const target = [...to.topics].sort((a, b) => a.position - b.position)
  const at = Math.max(0, Math.min(toIndex, target.length))
  target.splice(at, 0, topic)
  const placed = target.map((t, k) => ({ ...t, position: k }))
  return {
    next: {
      ...r,
      modules: r.modules.map((m) =>
        m.id === from.id
          ? { ...m, topics: source }
          : m.id === to.id
            ? { ...m, topics: placed }
            : m,
      ),
    },
    call: { kind: 'move', topicId, moduleId: to.id, position: at },
  }
}

/** Alt+↑/↓ num tópico: anda uma posição, passando para o módulo vizinho nas pontas. */
export function nudgeTopic(
  r: Roadmap,
  topicId: number,
  delta: -1 | 1,
): ReorderChange | null {
  const mods = byPosition(r)
  const mi = mods.findIndex((m) => m.topics.some((t) => t.id === topicId))
  if (mi < 0) return null
  const list = [...mods[mi]!.topics].sort((a, b) => a.position - b.position)
  const ti = list.findIndex((t) => t.id === topicId)
  if (ti + delta >= 0 && ti + delta < list.length)
    return moveTopicTo(r, topicId, mods[mi]!.id, ti + delta)
  const neighbor = mods[mi + delta]
  if (!neighbor) return null
  return moveTopicTo(
    r,
    topicId,
    neighbor.id,
    delta < 0 ? neighbor.topics.length : 0,
  )
}
