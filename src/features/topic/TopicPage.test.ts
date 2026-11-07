import { describe, expect, it } from 'vitest'
import { sessionsLine, stageHeadline } from './TopicPage'

describe('sessionsLine', () => {
  const today = '2026-11-07'
  it('sem sessões', () =>
    expect(sessionsLine(0, null, today)).toBe('Nenhuma sessão registrada'))
  it('singular e hoje', () =>
    expect(sessionsLine(1, today, today)).toBe('1 sessão · última hoje'))
  it('ontem', () =>
    expect(sessionsLine(3, '2026-11-06', today)).toBe(
      '3 sessões · última ontem',
    ))
  it('há N dias', () =>
    expect(sessionsLine(4, '2026-11-05', today)).toBe(
      '4 sessões · última há 2 dias',
    ))
})

describe('stageHeadline', () => {
  it('por etapa', () => {
    expect(stageHeadline('practicing')).toBe('Você está praticando')
    expect(stageHeadline('planned')).toBe('Você ainda não começou')
  })
})
