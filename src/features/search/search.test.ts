import { describe, expect, it } from 'vitest'
import { snippetParts, targetOf } from './SearchDialog'

describe('busca', () => {
  it('trecho com <mark> vira texto e destaque, sem outras tags', () => {
    expect(
      snippetParts('a <mark>índice</mark> b <img src=x onerror=1>c'),
    ).toEqual([
      { text: 'a ', mark: false },
      { text: 'índice', mark: true },
      { text: ' b c', mark: false },
    ])
  })
  it('resultado abre o tópico na aba certa', () => {
    const r = (type: 'topic' | 'note' | 'file') =>
      ({ type, topic: { id: 7 } }) as never
    expect(targetOf(r('topic'))).toEqual({ topicId: 7 })
    expect(targetOf(r('note'))).toEqual({ topicId: 7, tab: 'notes' })
    expect(targetOf(r('file'))).toEqual({ topicId: 7, tab: 'files' })
  })
})
