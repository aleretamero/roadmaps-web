import { describe, expect, it } from 'vitest'
import { homePath } from './home'

describe('homePath', () => {
  it('segue a preferência e cai no painel sem ela', () => {
    expect(homePath('roadmaps')).toBe('/roadmaps')
    expect(homePath('schedule')).toBe('/schedule')
    expect(homePath('dashboard')).toBe('/dashboard')
    expect(homePath(undefined)).toBe('/dashboard')
  })
})
