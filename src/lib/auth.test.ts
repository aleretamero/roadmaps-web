import { describe, expect, it } from 'vitest'
import { AUTH_PROVIDERS, loginUrl, markWelcome, takeWelcome } from './auth'

describe('auth', () => {
  it('monta a URL do OAuth com o redirect', () => {
    expect(loginUrl('github')).toBe('/api/v1/auth/login/github')
    expect(loginUrl('github', '/topics/3?tab=notes')).toBe(
      '/api/v1/auth/login/github?redirect=%2Ftopics%2F3%3Ftab%3Dnotes',
    )
  })

  it('as boas-vindas aparecem uma vez só', () => {
    markWelcome()
    expect(takeWelcome()).toBe(true)
    expect(takeWelcome()).toBe(false)
  })

  it('por enquanto o único provedor é o GitHub', () => {
    expect(AUTH_PROVIDERS.map((p) => p.id)).toEqual(['github'])
  })
})
