import { describe, expect, it } from 'vitest'
import { actionWords } from './actions'

describe('actionWords', () => {
  it('junta na ordem estudei → pratiquei → concluí', () => {
    expect(actionWords(['practiced', 'studied'])).toBe('Estudei e pratiquei')
    expect(actionWords(['completed', 'studied', 'practiced'])).toBe(
      'Estudei, pratiquei e concluí',
    )
    expect(actionWords(['completed'])).toBe('Concluí')
    expect(actionWords([])).toBe('')
  })
})
