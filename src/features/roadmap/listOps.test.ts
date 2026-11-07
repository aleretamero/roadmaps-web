import { describe, expect, it } from 'vitest'
import { linearRoadmap } from '@/mocks/mapExamples'
import { moveModuleTo, moveTopicTo, nudgeTopic } from './listOps'

describe('ordem da lista', () => {
  it('reordena tópicos no módulo', () => {
    const r = linearRoadmap()
    const [a] = r.modules
    const [t1, t2] = a!.topics
    const c = moveTopicTo(r, t1!.id, a!.id, 1)!
    expect(c.call).toEqual({
      kind: 'topics',
      moduleId: a!.id,
      ids: [t2!.id, t1!.id],
    })
  })
  it('leva tópico para outro módulo', () => {
    const r = linearRoadmap()
    const [a, b] = r.modules
    const t = a!.topics[1]!
    const c = moveTopicTo(r, t.id, b!.id, 0)!
    expect(c.call).toEqual({
      kind: 'move',
      topicId: t.id,
      moduleId: b!.id,
      position: 0,
    })
    expect(c.next.modules[0]!.topics.map((x) => x.id)).not.toContain(t.id)
    expect(c.next.modules[1]!.topics[0]!.id).toBe(t.id)
  })
  it('Alt+↓ no último tópico passa para o próximo módulo', () => {
    const r = linearRoadmap()
    const last = r.modules[0]!.topics.at(-1)!
    expect(nudgeTopic(r, last.id, 1)!.call).toMatchObject({
      kind: 'move',
      moduleId: r.modules[1]!.id,
      position: 0,
    })
    expect(nudgeTopic(r, r.modules[0]!.topics[0]!.id, -1)).toBeNull()
  })
  it('reordena módulos', () => {
    const r = linearRoadmap()
    const c = moveModuleTo(r, r.modules[1]!.id, 0)!
    expect(c.call).toEqual({
      kind: 'modules',
      ids: [r.modules[1]!.id, r.modules[0]!.id],
    })
    expect(moveModuleTo(r, r.modules[0]!.id, 0)).toBeNull()
  })
})
