import { describe, expect, it } from 'vitest'
import { buildGraph, layoutMap } from './mapLayout'
import {
  linearRoadmap,
  optionalRoadmap,
  splitRoadmap,
} from '@/mocks/mapExamples'

describe('mapa do roadmap', () => {
  it('linear: um módulo por camada e tópicos dos dois lados', () => {
    const r = linearRoadmap()
    const L = layoutMap(r)
    expect(L.modules.map((m) => m.module.title)).toEqual([
      'Gramática',
      'Conversação',
    ])
    expect(L.modules[1]!.y).toBeGreaterThan(L.modules[0]!.y)
    const [left, right] = L.topics.filter((t) => t.module.title === 'Gramática')
    expect(left!.x).toBeLessThan(L.modules[0]!.x)
    expect(right!.x).toBeGreaterThan(L.modules[0]!.x)
    expect(L.paths.main).not.toBe('')
    expect(L.splitLabels).toHaveLength(0)
  })

  it('divisão: opções lado a lado, escolhida no caminho e a outra esmaecida', () => {
    const r = splitRoadmap()
    const g = buildGraph(r)
    const [base, react, angular] = r.modules
    expect(g.splits.get(base!.id)).toEqual({
      options: [react!.id, angular!.id],
      chosen: react!.id,
    })
    expect(g.kind.get(react!.id)).toBe('main')
    expect(g.kind.get(angular!.id)).toBe('alt')
    const L = layoutMap(r)
    const placedReact = L.modules.find((m) => m.module.id === react!.id)!
    const placedAngular = L.modules.find((m) => m.module.id === angular!.id)!
    expect(placedReact.y).toBe(placedAngular.y)
    expect(placedReact.branch).toEqual({ parentId: base!.id, chosen: true })
    expect(placedAngular.branch).toEqual({ parentId: base!.id, chosen: false })
    expect(L.topics.find((t) => t.topic.title === 'RxJS')!.dimmed).toBe(true)
    expect(L.splitLabels).toHaveLength(1)
    expect(L.paths.alt).not.toBe('')
  })

  it('divisão sem escolha: as duas ficam como não escolhidas', () => {
    const r = splitRoadmap('none')
    const g = buildGraph(r)
    expect(g.kind.get(r.modules[1]!.id)).toBe('alt')
    expect(g.kind.get(r.modules[2]!.id)).toBe('alt')
  })

  it('opcional: não vira ponto de divisão e é desenhado tracejado', () => {
    const r = optionalRoadmap()
    const g = buildGraph(r)
    expect(g.splits.size).toBe(0)
    expect(g.kind.get(r.modules[1]!.id)).toBe('optional')
    expect(layoutMap(r).paths.optional).not.toBe('')
  })
})
