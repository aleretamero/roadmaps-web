import { describe, expect, it } from 'vitest'
import { progressText } from '@/features/module/ModuleTimeline'
import { sessionValues } from '@/features/topic/TopicTimeline'
import { changeText, withDayBreaks } from './Timeline'

const change = (over: object) =>
  ({
    id: 1,
    type: 'updated',
    description: 'Algo mudou',
    roadmapId: 1,
    moduleId: null,
    topicId: null,
    payload: null,
    occurredAt: '2026-11-01T10:00:00Z',
    ...over,
  }) as never
const session = (over: object) =>
  ({
    id: 1,
    topicId: 1,
    day: '2026-11-06',
    studied: true,
    practiced: false,
    completed: false,
    note: null,
    stageBefore: 'planned',
    stageAfter: 'studying',
    createdAt: '2026-11-06T10:00:00Z',
    topic: {
      id: 1,
      title: 'Índices',
      moduleId: 1,
      moduleTitle: 'M',
      roadmapId: 1,
      roadmapName: 'R',
    },
    ...over,
  }) as never

describe('linha do tempo', () => {
  it('texto da alteração', () => {
    expect(
      changeText(
        change({
          type: 'dateChanged',
          payload: { before: '2026-11-04', after: '2026-11-20' },
        }),
      ),
    ).toBe('Data trocada: 4 de nov → 20 de nov')
    expect(changeText(change({}))).toBe('Algo mudou')
  })
  it('dia só no primeiro item de cada dia', () => {
    const r = withDayBreaks(
      ['2026-11-06', '2026-11-06', '2026-11-05'],
      (d) => d,
    )
    expect(r.map((x) => x.first)).toEqual([true, false, true])
  })
  it('progresso do módulo', () => {
    expect(progressText(session({}))).toBe('Começou “Índices”')
    expect(
      progressText(
        session({ stageBefore: 'studying', stageAfter: 'practicing' }),
      ),
    ).toBe('“Índices” passou para Praticando')
    expect(progressText(session({ stageAfter: 'completed' }))).toBe(
      '“Índices” concluído',
    )
  })
  it('valores para editar a sessão', () => {
    expect(sessionValues(session({}), '2026-11-07')).toEqual({
      actions: ['studied'],
      when: 'yesterday',
      date: '2026-11-06',
      note: '',
    })
    expect(
      sessionValues(session({ day: '2026-10-01', note: 'x' }), '2026-11-07')
        .when,
    ).toBe('other')
  })
})
