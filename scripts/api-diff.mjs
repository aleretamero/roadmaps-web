// Compara o contrato do front (contracts/openapi.yaml) com o OpenAPI publicado pelo backend.
// Uso:
//   node scripts/api-diff.mjs --from http://localhost:8080/openapi/v1.json
//   node scripts/api-diff.mjs --from caminho/openapi.json --write contracts/openapi.published.json
//   --strict  sai com erro se houver diferença (para o CI)
import { readFileSync, writeFileSync } from 'node:fs'
import { parse } from 'yaml'

const arg = (name) => {
  const i = process.argv.indexOf(name)
  return i > -1 ? process.argv[i + 1] : undefined
}
const from =
  arg('--from') ??
  `${process.env.API_URL ?? 'http://localhost:8080'}/openapi/v1.json`
const write = arg('--write')
const strict = process.argv.includes('--strict')

const METHODS = ['get', 'post', 'put', 'patch', 'delete']

async function load(source) {
  const text = /^https?:\/\//.test(source)
    ? await (await fetch(source)).text()
    : readFileSync(source, 'utf8')
  return { text, doc: parse(text) }
}

/** "GET /topics/{id}" de cada operação (parâmetros de caminho normalizados para {x}). */
function operations(doc) {
  const out = new Set()
  for (const [path, item] of Object.entries(doc.paths ?? {}))
    for (const m of METHODS)
      if (item?.[m])
        out.add(
          `${m.toUpperCase()} ${path.replace(/^\/api\/v1/, '').replace(/\{[^}]+\}/g, '{x}')}`,
        )
  return out
}

/** Propriedades de cada schema (com `required` marcado por "!"). */
function schemas(doc) {
  const out = new Map()
  for (const [name, s] of Object.entries(doc.components?.schemas ?? {})) {
    const req = new Set(s.required ?? [])
    out.set(
      name,
      new Set(
        Object.keys(s.properties ?? {}).map((p) => (req.has(p) ? `${p}!` : p)),
      ),
    )
  }
  return out
}

const minus = (a, b) => [...a].filter((x) => !b.has(x)).sort()

const front = parse(readFileSync('contracts/openapi.yaml', 'utf8'))
const back = await load(from)
if (write) writeFileSync(write, back.text)

const fo = operations(front)
const bo = operations(back.doc)
const fs = schemas(front)
const bs = schemas(back.doc)
const lines = []
const onlyFront = minus(fo, bo)
const onlyBack = minus(bo, fo)
if (onlyFront.length)
  lines.push(
    '### Operações só no contrato do front',
    ...onlyFront.map((o) => `- \`${o}\``),
    '',
  )
if (onlyBack.length)
  lines.push(
    '### Operações só no backend',
    ...onlyBack.map((o) => `- \`${o}\``),
    '',
  )
const schemaLines = []
for (const [name, props] of fs) {
  const other = bs.get(name)
  if (!other) {
    schemaLines.push(`- \`${name}\`: não existe no backend`)
    continue
  }
  const a = minus(props, other)
  const b = minus(other, props)
  if (a.length || b.length)
    schemaLines.push(
      `- \`${name}\`:${a.length ? ` só no front ${a.map((x) => `\`${x}\``).join(', ')}` : ''}${b.length ? `; só no backend ${b.map((x) => `\`${x}\``).join(', ')}` : ''}`,
    )
}
for (const name of bs.keys())
  if (!fs.has(name)) schemaLines.push(`- \`${name}\`: só no backend`)
if (schemaLines.length) lines.push('### Schemas', ...schemaLines, '')

if (!lines.length)
  console.log('O contrato do front e o OpenAPI do backend batem.')
else {
  console.log(`## Diferenças entre contracts/openapi.yaml e ${from}\n`)
  console.log(lines.join('\n'))
  console.log(
    `${onlyFront.length} operações só no front, ${onlyBack.length} só no backend, ${schemaLines.length} schemas com diferença.`,
  )
  if (strict) process.exit(1)
}
