// Orçamento de bundle (FU23): confere o tamanho gzip dos JS do cliente depois do `pnpm build`.
// Uso: node scripts/check-bundle.mjs [--json]
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { gzipSync } from 'node:zlib'

const DIR = 'dist/client/assets'
const KB = 1024

/**
 * Limites em KB (gzip). O pacote de entrada carrega em toda tela; as rotas e
 * os componentes pesados (editor de anotações, mapa) vêm sob demanda.
 */
const BUDGET = [
  {
    match: /^index-/,
    max: 165,
    what: 'entrada (React, roteador, Query, shell)',
  },
  {
    match: /^(NotesPanel|MarkdownEditor)-/,
    max: 220,
    what: 'editor de anotações (Tiptap + realce), sob demanda',
  },
  { match: /./, max: 40, what: 'demais chunks (rotas e componentes)' },
]

const rows = readdirSync(DIR)
  .filter((f) => f.endsWith('.js'))
  .map((f) => {
    const buf = readFileSync(join(DIR, f))
    const gz = gzipSync(buf).length / KB
    const rule = BUDGET.find((b) => b.match.test(f))
    return {
      file: f,
      raw: buf.length / KB,
      gz,
      max: rule.max,
      what: rule.what,
      ok: gz <= rule.max,
    }
  })
  .sort((a, b) => b.gz - a.gz)

if (process.argv.includes('--json')) console.log(JSON.stringify(rows, null, 2))
else {
  console.log('| Arquivo | Bruto (KB) | gzip (KB) | Limite (KB) | |')
  console.log('| --- | ---: | ---: | ---: | --- |')
  for (const r of rows.slice(0, 15))
    console.log(
      `| ${r.file} | ${r.raw.toFixed(1)} | ${r.gz.toFixed(1)} | ${r.max} | ${r.ok ? 'ok' : 'ESTOUROU'} |`,
    )
  const total = rows.reduce((s, r) => s + r.gz, 0)
  console.log(
    `\n${rows.length} arquivos, ${total.toFixed(1)} KB gzip no total.`,
  )
}

const over = rows.filter((r) => !r.ok)
if (over.length) {
  console.error(
    `\nOrçamento estourado:\n${over.map((r) => `- ${r.file}: ${r.gz.toFixed(1)} KB > ${r.max} KB (${r.what})`).join('\n')}`,
  )
  process.exit(1)
}
