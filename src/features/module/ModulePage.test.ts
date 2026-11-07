import { describe, expect, it } from 'vitest'
import type { Schemas } from '@/lib/api/client'
import { topicDetails } from './ModulePage'

const t = (
  over: Partial<Schemas['TopicSummary']>,
): Schemas['TopicSummary'] => ({
  id: 1,
  title: 'x',
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

describe('topicDetails', () => {
  const today = '2026-11-07'
  it('desde, previsto e arquivos', () => {
    expect(
      topicDetails(
        t({
          stage: 'practicing',
          startedOn: '2026-10-29',
          dueDate: '2026-10-28',
          filesCount: 1,
        }),
        today,
      ).map((d) => d.text),
    ).toEqual([
      'Praticando desde 29 de out',
      'Previsto para 28 de out',
      '1 arquivo',
    ])
    expect(
      topicDetails(t({ dueDate: '2026-11-09', filesCount: 4 }), today).map(
        (d) => d.text,
      ),
    ).toEqual(['Previsto segunda-feira', '4 arquivos'])
  })
  it('atrasado em vermelho e concluído com a data', () => {
    expect(
      topicDetails(t({ dueDate: '2026-11-04', isLate: true }), today),
    ).toEqual([{ text: 'Atrasado desde 4 de nov', tone: 'danger' }])
    expect(
      topicDetails(
        t({ stage: 'completed', completedOn: '2026-10-20' }),
        today,
      )[0]!.text,
    ).toBe('Concluído em 20 de out')
  })
})
