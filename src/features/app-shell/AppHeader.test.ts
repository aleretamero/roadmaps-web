import { describe, expect, it } from 'vitest'
import { sectionOf } from './AppHeader'

describe('sectionOf', () => {
  it('marca a seção certa na navegação', () => {
    expect(sectionOf('/dashboard')).toBe('dashboard')
    expect(sectionOf('/roadmaps')).toBe('roadmaps')
    expect(sectionOf('/roadmaps/3')).toBe('roadmaps')
    expect(sectionOf('/modules/7')).toBe('roadmaps')
    expect(sectionOf('/topics/42')).toBe('roadmaps')
    expect(sectionOf('/schedule')).toBe('schedule')
    expect(sectionOf('/settings/account')).toBeNull()
    expect(sectionOf('/roadmapsx')).toBeNull()
  })
})
