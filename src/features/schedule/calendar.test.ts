import { describe, expect, it } from 'vitest'
import type { Schemas } from '@/lib/api/client'
import {
  dayDistance,
  dayItems,
  monthGrid,
  monthLabel,
  monthStats,
  shiftMonth,
  weekLabel,
  weekStart,
} from './calendar'
import { defaultFrom, rescheduleProblem } from '@/components/Reschedule'

const ref = (id: number, title = `T${id}`) => ({
  id,
  title,
  moduleId: 1,
  moduleTitle: 'M',
  roadmapId: 1,
  roadmapName: 'R',
})
const entry = (
  id: number,
  topicId: number,
  date: string,
  isLate = false,
  stage: Schemas['Stage'] = 'planned',
) => ({
  entry: { id, topicId, date, source: 'manual' as const },
  topic: ref(topicId),
  stage,
  isLate,
})
const session = (
  topicId: number,
  day: string,
  acts: Partial<Record<'studied' | 'practiced' | 'completed', boolean>>,
) =>
  ({
    id: topicId * 100,
    topicId,
    day,
    studied: false,
    practiced: false,
    completed: false,
    note: null,
    ...acts,
    topic: ref(topicId),
  }) as unknown as Schemas['SessionWithTopic']

describe('calendário', () => {
  it('grade do mês começa no domingo e cobre o mês', () => {
    const g = monthGrid('2026-11')
    expect(g[0]![0]).toBe('2026-11-01')
    expect(g.at(-1)!.at(-1)).toBe('2026-12-05')
    expect(g).toHaveLength(5)
    expect(monthGrid('2026-08')[0]![0]).toBe('2026-07-26')
  })
  it('meses, semanas e rótulos', () => {
    expect(shiftMonth('2026-12', 1)).toBe('2027-01')
    expect(shiftMonth('2026-01', -1)).toBe('2025-12')
    expect(weekStart('2026-11-07')).toBe('2026-11-01')
    expect(monthLabel('2026-11')).toBe('Novembro de 2026')
    expect(weekLabel('2026-11-01')).toBe('1 a 7 de nov')
    expect(weekLabel('2026-11-29')).toBe('29 de nov a 5 de dez')
    expect(dayDistance('2026-11-04', '2026-11-07')).toBe('Há 3 dias')
    expect(dayDistance('2026-11-09', '2026-11-07')).toBe('Daqui a 2 dias')
  })
  it('itens do dia: feito, agendado e atrasado', () => {
    const today = '2026-11-07'
    const past = {
      date: '2026-11-04',
      isStudyDay: true,
      entries: [
        entry(1, 1, '2026-11-04', true),
        entry(2, 2, '2026-11-04'),
        entry(3, 3, '2026-11-04', true),
      ],
      sessions: [session(3, '2026-11-04', { studied: true, practiced: true })],
    }
    expect(dayItems(past, today).map((i) => [i.kind, i.topic.id])).toEqual([
      ['work', 3],
      ['late', 1],
    ])
    const future = {
      date: '2026-11-09',
      isStudyDay: true,
      entries: [entry(4, 4, '2026-11-09')],
      sessions: [],
    }
    expect(dayItems(future, today).map((i) => i.kind)).toEqual(['plan'])
  })
  it('resumo do mês', () => {
    const days = [
      {
        date: '2026-11-02',
        isStudyDay: true,
        entries: [],
        sessions: [
          session(1, '2026-11-02', { studied: true }),
          session(2, '2026-11-02', { practiced: true }),
        ],
      },
      {
        date: '2026-12-01',
        isStudyDay: true,
        entries: [],
        sessions: [session(1, '2026-12-01', { completed: true })],
      },
    ]
    expect(monthStats(days, '2026-11')).toEqual({
      daysWorked: 1,
      counts: { studied: 1, practiced: 1, completed: 0 },
    })
  })
})

describe('trocar data', () => {
  const today = '2026-11-07'
  const es = [
    { id: 1, date: '2026-11-04' },
    { id: 2, date: '2026-11-12' },
  ]
  it('sugere a próxima data, ou a última que passou', () => {
    expect(defaultFrom(es, today)?.id).toBe(2)
    expect(defaultFrom([es[0]!], today)?.id).toBe(1)
    expect(defaultFrom([], today)).toBeNull()
  })
  it('validação', () => {
    expect(rescheduleProblem('move', es, es[0]!, '', today)).toBe(
      'Escolha a nova data.',
    )
    expect(rescheduleProblem('move', es, es[0]!, '2026-11-01', today)).toBe(
      'Escolha hoje ou um dia futuro.',
    )
    expect(rescheduleProblem('move', es, es[1]!, '2026-11-12', today)).toBe(
      'Escolha uma data diferente da atual.',
    )
    expect(rescheduleProblem('add', es, null, '2026-11-12', today)).toBe(
      'Esse dia já está agendado para este tópico.',
    )
    expect(rescheduleProblem('move', [], null, '2026-11-20', today)).toBe(
      'Ainda não há data para trocar.',
    )
    expect(rescheduleProblem('add', es, null, '2026-11-20', today)).toBeNull()
  })
})
