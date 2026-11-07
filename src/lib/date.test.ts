import { parseISODate, toISODate } from './date'

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
