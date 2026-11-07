import { describe, expect, it } from 'vitest'
import { heatPattern } from './previews'

describe('heatPattern', () => {
  it('é sempre o mesmo desenho, com 7 dias por semana e níveis 0–4', () => {
    const a = heatPattern(18)
    expect(a).toEqual(heatPattern(18))
    expect(a).toHaveLength(18)
    for (const week of a) {
      expect(week).toHaveLength(7)
      for (const l of week) expect(l).toBeGreaterThanOrEqual(0)
      for (const l of week) expect(l).toBeLessThanOrEqual(4)
    }
  })
})
