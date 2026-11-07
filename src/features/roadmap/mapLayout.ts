/**
 * Layout do mapa do roadmap (porta do protótipo): camadas pela dependência,
 * um módulo por camada com os tópicos dos dois lados, ou colunas quando a
 * camada tem vários módulos (ponto de divisão). Tudo em px num quadro de 1040.
 */
import type { Schemas } from '@/lib/api/client'

type Roadmap = Pick<Schemas['RoadmapDetail'], 'modules' | 'pathChoices'>
type ModuleNode = Schemas['ModuleNode']
type Topic = Schemas['TopicSummary']

export const MAP_W = 1040
const CX = MAP_W / 2
const MW = 220
const MH = 56
const TW = 240
const TH = 44
const TG = 10
const GAP = 84
const TOP = 104

/** Como o módulo é desenhado: na sequência, opcional ou caminho não escolhido. */
export type DrawKind = 'main' | 'optional' | 'alt'

export type Graph = {
  level: Map<number, number>
  parents: Map<number, Array<number>>
  children: Map<number, Array<number>>
  /** Pontos de divisão: módulo pai → opções (não opcionais) e a escolhida. */
  splits: Map<number, { options: Array<number>; chosen: number | null }>
  kind: Map<number, DrawKind>
}

export function buildGraph(r: Roadmap): Graph {
  const ids = new Set(r.modules.map((m) => m.id))
  const byId = new Map(r.modules.map((m) => [m.id, m]))
  const parents = new Map(
    r.modules.map((m) => [
      m.id,
      m.dependsOn.filter((d) => ids.has(d) && d !== m.id),
    ]),
  )
  const children = new Map<number, Array<number>>(
    r.modules.map((m) => [m.id, []]),
  )
  for (const m of r.modules)
    for (const p of parents.get(m.id)!) children.get(p)!.push(m.id)

  const level = new Map<number, number>()
  const visiting = new Set<number>()
  const L = (id: number): number => {
    const known = level.get(id)
    if (known !== undefined) return known
    if (visiting.has(id)) return 0
    visiting.add(id)
    const ps = parents.get(id)!
    const v = ps.length ? 1 + Math.max(...ps.map(L)) : 0
    visiting.delete(id)
    level.set(id, v)
    return v
  }
  r.modules.forEach((m) => L(m.id))

  const splits: Graph['splits'] = new Map()
  for (const m of r.modules) {
    const opts = children
      .get(m.id)!
      .filter((c) => byId.get(c)!.kind !== 'optional')
    if (
      opts.length >= 2 &&
      opts.some((c) => byId.get(c)!.kind === 'alternative')
    ) {
      const chosen = r.pathChoices.find(
        (p) => p.branchModuleId === m.id,
      )?.chosenModuleId
      splits.set(m.id, {
        options: opts,
        chosen: chosen && opts.includes(chosen) ? chosen : null,
      })
    }
  }

  const kind = new Map<number, DrawKind>()
  for (const m of r.modules) {
    if (m.kind === 'optional') kind.set(m.id, 'optional')
    else if (m.kind === 'alternative') {
      const branch = parents.get(m.id)!.find((p) => splits.has(p))
      const chosen = branch !== undefined ? splits.get(branch)!.chosen : null
      kind.set(m.id, chosen === m.id ? 'main' : 'alt')
    } else kind.set(m.id, 'main')
  }
  return { level, parents, children, splits, kind }
}

export type PlacedModule = {
  module: ModuleNode
  kind: DrawKind
  x: number
  y: number
  w: number
  /** É uma das opções de um ponto de divisão. */
  branch: { parentId: number; chosen: boolean } | null
  choice: { x: number; y: number } | null
}
export type PlacedTopic = {
  topic: Topic
  module: ModuleNode
  dimmed: boolean
  x: number
  y: number
  w: number
  h: number
}
export type PlacedGroup = {
  kind: DrawKind
  x: number
  y: number
  w: number
  h: number
}

export type MapLayout = {
  height: number
  /** Ordem de leitura/foco: por camada, módulo e depois os tópicos dele. */
  modules: Array<PlacedModule>
  topics: Array<PlacedTopic>
  groups: Array<PlacedGroup>
  splitLabels: Array<{ x: number; y: number }>
  paths: { topic: string; main: string; alt: string; optional: string }
  addY: number
}

const stack = (k: number) => (k ? k * TH + (k - 1) * TG : 0)
const curve = (x1: number, y1: number, x2: number, y2: number) => {
  const my = (y1 + y2) / 2
  return `M${x1} ${y1} C${x1} ${my} ${x2} ${my} ${x2} ${y2} `
}

export function layoutMap(r: Roadmap): MapLayout {
  const g = buildGraph(r)
  const byId = new Map(r.modules.map((m) => [m.id, m]))
  const levels: Array<Array<number>> = []
  // Ordem dentro da camada pela posição do módulo.
  for (const m of [...r.modules].sort((a, b) => a.position - b.position))
    (levels[g.level.get(m.id)!] ??= []).push(m.id)

  const anchors = new Map<
    number,
    { tx: number; ty: number; bx: number; by: number }
  >()
  const modules: Array<PlacedModule> = []
  const topics: Array<PlacedTopic> = []
  const groups: Array<PlacedGroup> = []
  const paths = { topic: '', main: '', alt: '', optional: '' }
  const branchOf = (id: number) => {
    const p = g.parents.get(id)!.find((x) => g.splits.has(x))
    return p === undefined
      ? null
      : { parentId: p, chosen: g.splits.get(p)!.chosen === id }
  }
  let top = TOP

  // `levels` pode ter buracos (camada sem módulo): `filter` os pula.
  for (const ids of levels.filter((l) => l.length > 0)) {
    let R = 0
    if (ids.length === 1) {
      const m = byId.get(ids[0]!)!
      const kind = g.kind.get(m.id)!
      const half = Math.ceil(m.topics.length / 2)
      const left = m.topics.slice(0, half)
      const right = m.topics.slice(half)
      R = Math.max(MH, stack(left.length), stack(right.length))
      const mx = CX - MW / 2
      const my = top + (R - MH) / 2
      const midY = my + MH / 2
      const branch = branchOf(m.id)
      let bottom = my + MH
      const choice = branch ? { x: CX - 85, y: bottom + 10 } : null
      if (choice) {
        bottom += 46
        R = Math.max(R, bottom - top)
      }
      modules.push({ module: m, kind, x: mx, y: my, w: MW, branch, choice })
      const place = (arr: Array<Topic>, isLeft: boolean) => {
        const off = top + (R - stack(arr.length)) / 2
        arr.forEach((t, i) => {
          const ty = off + i * (TH + TG)
          const cy = ty + TH / 2
          const tx = isLeft ? mx - 56 - TW : mx + MW + 56
          topics.push({
            topic: t,
            module: m,
            dimmed: kind === 'alt',
            x: tx,
            y: ty,
            w: TW,
            h: TH,
          })
          paths.topic += isLeft
            ? `M${mx} ${midY} C${mx - 28} ${midY} ${mx - 28} ${cy} ${mx - 56} ${cy} `
            : `M${mx + MW} ${midY} C${mx + MW + 28} ${midY} ${mx + MW + 28} ${cy} ${mx + MW + 56} ${cy} `
        })
      }
      place(left, true)
      place(right, false)
      anchors.set(m.id, { tx: CX, ty: my, bx: CX, by: bottom })
    } else {
      const cw = MAP_W / ids.length
      const mw = Math.min(MW, cw - 36)
      ids.forEach((id, i) => {
        const m = byId.get(id)!
        const kind = g.kind.get(id)!
        const cx = cw * (i + 0.5)
        const mx = cx - mw / 2
        let yy = top + MH + 12
        for (const t of m.topics) {
          topics.push({
            topic: t,
            module: m,
            dimmed: kind === 'alt',
            x: mx,
            y: yy,
            w: mw,
            h: 40,
          })
          yy += 48
        }
        const branch = branchOf(id)
        const choice = branch ? { x: cx - 85, y: yy + 2 } : null
        if (choice) yy += 44
        const h = yy - top
        modules.push({ module: m, kind, x: mx, y: top, w: mw, branch, choice })
        groups.push({ kind, x: mx - 12, y: top - 12, w: mw + 24, h: h + 16 })
        anchors.set(id, { tx: cx, ty: top - 12, bx: cx, by: top + h + 4 })
        R = Math.max(R, h)
      })
    }
    top += R + GAP
  }

  for (const m of r.modules) {
    const a = anchors.get(m.id)
    if (!a) continue
    const ck = g.kind.get(m.id)!
    const ps = g.parents.get(m.id)!
    const add = (d: string, pk: DrawKind = 'main') => {
      if (ck === 'alt' || pk === 'alt') paths.alt += d
      else if (ck === 'optional' || pk === 'optional') paths.optional += d
      else paths.main += d
    }
    if (!ps.length) add(curve(CX, 48, a.tx, a.ty))
    for (const p of ps) {
      const b = anchors.get(p)
      if (b) add(curve(b.bx, b.by, a.tx, a.ty), g.kind.get(p))
    }
  }
  const splitLabels = [...g.splits.keys()]
    .map((p) => anchors.get(p))
    .filter((b): b is NonNullable<typeof b> => !!b)
    .map((b) => ({ x: b.bx - 75, y: b.by + 14 }))
  const addY = top - GAP + 28
  return {
    height: addY + 44 + 28,
    modules,
    topics,
    groups,
    splitLabels,
    paths,
    addY,
  }
}
