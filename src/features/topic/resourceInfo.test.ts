import { describe, expect, it } from 'vitest'
import {
  autoTitle,
  guessKind,
  hostOf,
  isHttpUrl,
  lookOf,
  withProtocol,
} from './resourceInfo'

describe('referências', () => {
  it('tipo pelo domínio', () => {
    expect(guessKind('https://www.youtube.com/watch?v=1')).toBe('video')
    expect(guessKind('https://www.udemy.com/course/x')).toBe('course')
    expect(guessKind('https://github.com/a/b')).toBe('other')
    expect(guessKind('https://blog.exemplo.com/post')).toBe('article')
    expect(lookOf({ kind: 'other', url: 'https://github.com/a/b' })).toBe(
      'repo',
    )
    expect(
      lookOf({ kind: 'other', url: 'https://learn.microsoft.com/x' }),
    ).toBe('docs')
    expect(lookOf({ kind: 'other', url: 'https://exemplo.com' })).toBe('link')
  })
  it('título, domínio e URL', () => {
    expect(autoTitle('https://learn.microsoft.com/ef/core/indexes.html')).toBe(
      'Indexes',
    )
    expect(autoTitle('https://www.exemplo.com/')).toBe('exemplo.com')
    expect(hostOf('https://www.exemplo.com/x')).toBe('exemplo.com')
    expect(withProtocol('exemplo.com')).toBe('https://exemplo.com')
    expect(isHttpUrl('https://exemplo.com')).toBe(true)
    expect(isHttpUrl('javascript:alert(1)')).toBe(false)
    expect(isHttpUrl('https://localhost')).toBe(false)
  })
})
