import {
  addDays,
  diffDays,
  formatLong,
  formatPlan,
  formatShort,
  formatWeekdayDay,
  parseISODate,
  relativeDay,
  toISODate,
} from './date'

describe('datas de calendário', () => {
  it('formata no dia local, sem deslocar pelo fuso', () => {
    expect(toISODate(new Date(2026, 10, 7, 23, 30))).toBe('2026-11-07')
  })

  it('lê e escreve a mesma data', () => {
    expect(toISODate(parseISODate('2026-01-31'))).toBe('2026-01-31')
  })

  it('recusa formatos inválidos', () => {
    expect(() => parseISODate('07/11/2026')).toThrow('Data inválida')
  })
})

describe('formatos de data', () => {
  it('formata como no protótipo, sem pontos', () => {
    expect(formatShort('2026-11-04')).toBe('4 de nov')
    expect(formatPlan('2026-11-07')).toBe('Sáb, 7 de nov')
    expect(formatLong('2026-11-07')).toBe('Sábado, 7 de novembro')
    expect(formatWeekdayDay('2026-11-09')).toBe('Seg, 9')
  })
  it('data relativa', () => {
    const t = '2026-11-07'
    expect(relativeDay('2026-11-07', t)).toBe('Hoje')
    expect(relativeDay('2026-11-08', t)).toBe('Amanhã')
    expect(relativeDay('2026-11-06', t)).toBe('Ontem')
    expect(relativeDay('2026-11-01', t)).toBe('há 6 dias')
    expect(relativeDay('2026-11-10', t)).toBe('terça-feira')
    expect(relativeDay('2026-11-20', t)).toBe('20 de nov')
    expect(diffDays('2026-10-30', t)).toBe(8)
    expect(addDays('2026-10-30', 3)).toBe('2026-11-02')
  })
})
