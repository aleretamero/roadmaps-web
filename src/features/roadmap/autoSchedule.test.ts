import { describe, expect, it } from 'vitest'
import { optionalRoadmap, splitRoadmap } from '@/mocks/mapExamples'
import {
  autoCandidates,
  leftOutText,
  previewWeeks,
  weekdayOf,
} from './autoSchedule'

describe('agendamento automático', () => {
  it('ordem do roadmap e o que fica de fora', () => {
    const r = splitRoadmap('first')
    const { items, left } = autoCandidates(r, {
      includeOptional: false,
      reschedule: false,
    })
    const total = r.modules.reduce((n, m) => n + m.topics.length, 0)
    expect(items.length + Object.values(left).reduce((a, b) => a + b, 0)).toBe(
      total,
    )
    expect(left.notChosen).toBeGreaterThan(0)
  })
  it('opcionais entram só quando pedido', () => {
    const r = optionalRoadmap()
    const without = autoCandidates(r, {
      includeOptional: false,
      reschedule: false,
    })
    const withOpt = autoCandidates(r, {
      includeOptional: true,
      reschedule: false,
    })
    expect(without.left.optional).toBeGreaterThan(0)
    expect(withOpt.items.length).toBe(
      without.items.length + without.left.optional,
    )
  })
  it('textos e prévia', () => {
    expect(
      leftOutText(
        { completed: 2, started: 1, hasDate: 0, optional: 0, notChosen: 0 },
        1,
      ),
    ).toBe('Ficaram de fora: 2 concluídos, 1 já iniciado, 1 desmarcado.')
    expect(
      leftOutText(
        { completed: 0, started: 0, hasDate: 0, optional: 0, notChosen: 0 },
        0,
      ),
    ).toBe('')
    expect(weekdayOf('2026-11-07')).toBe('saturday')
    const w = previewWeeks('2026-11-07', '2026-11-09')
    expect(w).toHaveLength(2)
    expect(w[0]![0]).toBe('2026-11-01')
    expect(previewWeeks('2026-11-07', '2027-01-30')).toHaveLength(5)
  })
})
