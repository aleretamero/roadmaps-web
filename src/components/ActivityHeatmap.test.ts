import { describe, expect, it } from 'vitest'
import { buildGrid, dayLabel, heatLevel } from './ActivityHeatmap'

describe('ActivityHeatmap', () => {
  it('nível pela quantidade de registros', () => {
    expect([0, 1, 2, 3, 4, 9].map(heatLevel)).toEqual([0, 1, 2, 3, 4, 4])
  })

  it('grade de semanas completas terminando na semana de hoje', () => {
    const grid = buildGrid([], 3, '2026-11-07')
    expect(grid).toHaveLength(3)
    expect(grid[0]!.cells[0]!.date).toBe('2026-10-18')
    expect(grid.at(-1)!.cells.at(-1)!.date).toBe('2026-11-07')
    expect(grid[0]!.label).toBe('out')
    expect(grid[2]!.label).toBe('nov')
    expect(grid[1]!.label).toBe('')
  })

  it('marca os dias futuros', () => {
    const grid = buildGrid([], 1, '2026-11-04')
    expect(grid[0]!.cells.map((c) => c.future)).toEqual([
      false,
      false,
      false,
      false,
      true,
      true,
      true,
    ])
  })

  it('rótulo acessível com os tópicos do dia', () => {
    expect(
      dayLabel({
        date: '2026-11-07',
        future: false,
        day: {
          date: '2026-11-07',
          count: 2,
          topics: ['Índices'],
          entries: [
            { topicId: 1, title: 'Índices', actions: ['studied', 'practiced'] },
          ],
        },
      }),
    ).toBe('Sáb, 7 de nov: 2 registros. Índices (estudei e pratiquei)')
    expect(dayLabel({ date: '2026-11-06', future: false, day: null })).toBe(
      'Sex, 6 de nov: nenhum registro',
    )
  })
})
