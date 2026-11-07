import { describe, expect, it } from 'vitest'
import { safeRedirect } from './redirect'

describe('safeRedirect', () => {
  it('aceita só caminhos do próprio app', () => {
    expect(safeRedirect('/dashboard?tab=1')).toBe('/dashboard?tab=1')
    expect(safeRedirect('//evil.com')).toBeUndefined()
    expect(safeRedirect('https://evil.com')).toBeUndefined()
    expect(safeRedirect(undefined)).toBeUndefined()
  })
})
