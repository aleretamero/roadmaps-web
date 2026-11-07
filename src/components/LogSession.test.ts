import { describe, expect, it } from 'vitest'
import { sessionDay, sessionOutcome, sessionProblem } from './LogSession'
import { stageAfter } from '@/lib/stage'

const today = '2026-11-07'
const v = (over = {}) => ({
  actions: ['studied' as const],
  when: 'today' as const,
  date: today,
  note: '',
  ...over,
})

describe('registrar sessão', () => {
  it('dia escolhido', () => {
    expect(sessionDay({ when: 'today', date: '' }, today)).toBe(today)
    expect(sessionDay({ when: 'yesterday', date: '' }, today)).toBe(
      '2026-11-06',
    )
    expect(sessionDay({ when: 'other', date: '2026-10-01' }, today)).toBe(
      '2026-10-01',
    )
  })
  it('validação: atividade, data e futuro', () => {
    expect(sessionProblem(v(), today)).toBeNull()
    expect(sessionProblem(v({ actions: [] }), today)).toBe(
      'Marque o que você fez.',
    )
    expect(sessionProblem(v({ when: 'other', date: '' }), today)).toBe(
      'Escolha a data.',
    )
    expect(
      sessionProblem(v({ when: 'other', date: '2026-11-08' }), today),
    ).toMatch(/ainda não chegou/)
  })
  it('etapa nunca volta', () => {
    expect(stageAfter('practicing', ['studied'])).toBe('practicing')
    expect(stageAfter('planned', ['studied', 'practiced'])).toBe('practicing')
    expect(stageAfter('studying', ['completed'])).toBe('completed')
  })
  it('texto do resultado', () => {
    expect(sessionOutcome('studying', ['practiced'], today)).toBe(
      'O tópico passa de Estudando para Praticando. Entra na agenda em sáb, 7 de nov.',
    )
    expect(sessionOutcome('completed', ['studied'], today)).toMatch(
      /^Conta como revisão/,
    )
  })
})
