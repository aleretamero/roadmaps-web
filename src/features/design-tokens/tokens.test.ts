import { readFileSync } from 'node:fs'
import { colorGroups, stages } from './tokens'

const css = readFileSync('src/styles/tokens.css', 'utf8')

describe('tokens de design', () => {
  it('todo token listado na página existe no tokens.css', () => {
    const names = [
      ...colorGroups.flatMap((g) => g.tokens),
      ...stages.flatMap((s) => [`stage-${s.key}`, `stage-${s.key}-fg`]),
    ]
    for (const n of names) expect(css).toContain(`--color-${n}:`)
  })

  it('mantém as cores de etapa do protótipo', () => {
    expect(css).toContain('--color-stage-studying: #e6edfb')
    expect(css).toContain('--color-stage-completed-fg: #1e6b3a')
  })
})
