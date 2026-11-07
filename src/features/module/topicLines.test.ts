import { describe, expect, it } from 'vitest'
import { splitPastedLines } from './topicLines'

describe('splitPastedLines', () => {
  it('uma linha por tópico, sem marcadores nem linhas vazias', () => {
    expect(
      splitPastedLines(
        '- Views\n* Triggers\n\n3. Stored procedures\r\n[ ] Jobs\n  Backups  ',
      ),
    ).toEqual(['Views', 'Triggers', 'Stored procedures', 'Jobs', 'Backups'])
  })
})
