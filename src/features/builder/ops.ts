import { arrayMove } from '@dnd-kit/sortable'
import type { BuilderModule, BuilderTopic } from './model'

type Mods = ReadonlyArray<BuilderModule>

export function moveModule(
  mods: Mods,
  from: number,
  to: number,
): Array<BuilderModule> {
  if (to < 0 || to >= mods.length || from === to) return [...mods]
  return arrayMove([...mods], from, to)
}

/** Move um tópico dentro do módulo ou para outro (posição `toIndex` no destino). */
export function moveTopic(
  mods: Mods,
  fromModule: number,
  fromIndex: number,
  toModule: number,
  toIndex: number,
): Array<BuilderModule> {
  const next = mods.map((m) => ({ ...m, topics: [...m.topics] }))
  const src = next[fromModule]
  const dst = next[toModule]
  if (!src || !dst) return next
  const [topic] = src.topics.splice(fromIndex, 1)
  if (!topic) return next
  dst.topics.splice(Math.max(0, Math.min(toIndex, dst.topics.length)), 0, topic)
  return next
}

export function updateModule(
  mods: Mods,
  i: number,
  patch: Partial<BuilderModule>,
): Array<BuilderModule> {
  return mods.map((m, k) => (k === i ? { ...m, ...patch } : m))
}

export function updateTopic(
  mods: Mods,
  i: number,
  j: number,
  patch: Partial<BuilderTopic>,
): Array<BuilderModule> {
  return mods.map((m, k) =>
    k === i
      ? {
          ...m,
          topics: m.topics.map((t, l) => (l === j ? { ...t, ...patch } : t)),
        }
      : m,
  )
}

export function insertTopic(
  mods: Mods,
  i: number,
  at: number,
  topic: BuilderTopic,
): Array<BuilderModule> {
  return mods.map((m, k) =>
    k === i
      ? {
          ...m,
          topics: [...m.topics.slice(0, at), topic, ...m.topics.slice(at)],
        }
      : m,
  )
}

export function removeTopic(
  mods: Mods,
  i: number,
  j: number,
): Array<BuilderModule> {
  return mods.map((m, k) =>
    k === i ? { ...m, topics: m.topics.filter((_t, l) => l !== j) } : m,
  )
}

/** Acha módulo e posição de um tópico pela chave. */
export function findTopic(mods: Mods, key: string): [number, number] | null {
  for (let i = 0; i < mods.length; i++) {
    const j = mods[i]!.topics.findIndex((t) => t.key === key)
    if (j >= 0) return [i, j]
  }
  return null
}

export function counts(mods: Mods) {
  const topics = mods.flatMap((m) => m.topics.filter((t) => t.title.trim()))
  return {
    modules: mods.length,
    topics: topics.length,
    optional: topics.filter((t) => t.isOptional).length,
    dated: topics.filter((t) => t.date).length,
  }
}
