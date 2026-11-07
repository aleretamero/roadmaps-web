import { describe, expect, it } from 'vitest'
import type { Schemas } from '@/lib/api/client'
import { topicMeta } from './ProgressTab'

const t = (
  over: Partial<Schemas['TopicSummary']>,
): Schemas['TopicSummary'] => ({
  id: 1,
  title: 'Índices',
  isOptional: false,
  stage: 'planned',
  position: 0,
  startedOn: null,
  completedOn: null,
  dueDate: null,
  isLate: false,
  filesCount: 0,
  ...over,
})

describe('topicMeta', () => {
  const today = '2026-11-07'
  it('em andamento com data prevista', () => {
    expect(
      topicMeta(
        t({ stage: 'studying', startedOn: '2026-11-06', dueDate: today }),
        today,
      ),
    ).toEqual({
      text: 'Estudando desde 6 de nov · previsto hoje',
      late: false,
    })
  })
  it('atrasado e opcional', () => {
    expect(topicMeta(t({ dueDate: '2026-11-04' }), today)).toEqual({
      text: 'Não iniciado · atrasado (4 de nov)',
      late: true,
    })
    expect(topicMeta(t({ isOptional: true }), today).text).toBe(
      'Opcional · Não iniciado',
    )
  })
})
