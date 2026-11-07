import { Editor } from '@tiptap/core'
import { describe, expect, it } from 'vitest'
import { noteExtensions, safeLink } from './MarkdownEditor'
import { noteNumbers } from './NotesPanel'

const roundTrip = (md: string) => {
  const e = new Editor({
    extensions: noteExtensions(),
    content: md,
    contentType: 'markdown',
  })
  const out = e.getMarkdown()
  const html = e.getHTML()
  e.destroy()
  return { out, html }
}

describe('anotações', () => {
  it('Markdown entra e sai igual (títulos, listas, citação, código com linguagem)', () => {
    const md =
      '## Plano\n\nUse **negrito** e `código`.\n\n- um\n- dois\n\n> cuidado\n\n```sql\nSELECT 1;\n```'
    const { out, html } = roundTrip(md)
    expect(out).toContain('## Plano')
    expect(out).toContain('**negrito**')
    expect(out).toContain('- um')
    expect(out).toContain('> cuidado')
    expect(out).toContain('```sql')
    expect(html).toContain('class="language-sql"')
  })
  it('HTML solto e links javascript: não passam', () => {
    const { html } = roundTrip(
      'a <img src=x onerror="alert(1)"> [x](javascript:alert(1)) <script>alert(1)</script>',
    )
    expect(html).not.toMatch(/<img|onerror|<script|javascript:/)
  })
  it('link seguro', () => {
    expect(safeLink('exemplo.com')).toBe('https://exemplo.com/')
    expect(safeLink('javascript:alert(1)')).toBeNull()
    expect(safeLink('')).toBeNull()
  })
  it('numeração pela ordem de criação', () => {
    const n = (id: number, createdAt: string) => ({ id, createdAt }) as never
    expect([...noteNumbers([n(2, '2026-11-02'), n(1, '2026-10-01')])]).toEqual([
      [1, 1],
      [2, 2],
    ])
  })
})
