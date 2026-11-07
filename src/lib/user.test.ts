import { describe, expect, it } from 'vitest'
import { initials } from './user'

describe('initials', () => {
  it('usa o primeiro e o último nome', () => {
    expect(initials('Marina Costa')).toBe('MC')
    expect(initials('  ana maria de souza ')).toBe('AS')
  })
  it('funciona com um nome só e com vazio', () => {
    expect(initials('Marina')).toBe('M')
    expect(initials('')).toBe('?')
  })
})
