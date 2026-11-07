// Falha se aparecer cor em hexadecimal fora de src/styles/tokens.css.
// Toda cor do app tem que vir dos tokens (FS02).
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'

const ROOT = 'src'
const ALLOWED = new Set(['src/styles/tokens.css'])
const HEX = /#[0-9a-fA-F]{3,8}\b/g
const exts = /\.(tsx?|css|mdx?)$/
const problems = []

function walk(dir) {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name)
    if (statSync(path).isDirectory()) walk(path)
    else if (exts.test(name) && !/\.(gen|test)\.tsx?$/.test(name)) check(path)
  }
}

function check(path) {
  const rel = relative('.', path).replaceAll('\\', '/')
  if (ALLOWED.has(rel)) return
  readFileSync(path, 'utf8')
    .split('\n')
    .forEach((line, i) => {
      for (const m of line.matchAll(HEX)) {
        // ignora âncoras de URL e entidades como &#123;
        const before = line[m.index - 1]
        if (
          before === '&' ||
          before === '/' ||
          /href=|\(['"]#/.test(line.slice(Math.max(0, m.index - 8), m.index))
        )
          continue
        problems.push(`${rel}:${i + 1}  ${m[0]}`)
      }
    })
}

walk(ROOT)
if (problems.length) {
  console.error(
    'Cores em hexadecimal fora dos tokens (use as classes do Tailwind de src/styles/tokens.css):',
  )
  for (const p of problems) console.error('  ' + p)
  process.exit(1)
}
console.log('Nenhuma cor fora dos tokens.')
