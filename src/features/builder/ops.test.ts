import { describe, expect, it } from 'vitest'
import type { BuilderModule } from './model'
import { counts, findTopic, moveModule, moveTopic } from './ops'

const t = (key: string, title = key) => ({
  key,
  title,
  isOptional: false,
  date: '',
})
const m = (key: string, topics: BuilderModule['topics']): BuilderModule => ({
  key,
  title: key,
  kind: 'required',
  after: null,
  alternativeTo: null,
  topics,
})
const mods = [m('A', [t('a1'), t('a2')]), m('B', [t('b1')])]

describe('operações do criador', () => {
  it('reordena módulos', () => {
    expect(moveModule(mods, 0, 1).map((x) => x.key)).toEqual(['B', 'A'])
    expect(moveModule(mods, 0, -1).map((x) => x.key)).toEqual(['A', 'B'])
  })
  it('leva tópico para outro módulo', () => {
    const r = moveTopic(mods, 0, 1, 1, 0)
    expect(r[0]!.topics.map((x) => x.key)).toEqual(['a1'])
    expect(r[1]!.topics.map((x) => x.key)).toEqual(['a2', 'b1'])
    expect(findTopic(r, 'a2')).toEqual([1, 0])
    expect(mods[0]!.topics).toHaveLength(2)
  })
  it('conta só tópicos com título', () => {
    expect(
      counts([
        m('A', [
          t('x'),
          t('y', ' '),
          { ...t('z'), isOptional: true, date: '2026-11-20' },
        ]),
      ]),
    ).toEqual({
      modules: 1,
      topics: 2,
      optional: 1,
      dated: 1,
    })
  })
})
