// Serve o protótipo navegável (docs/prototype) em http://localhost:4100/Main.dc.html
import { createServer } from 'node:http'
import { readFile } from 'node:fs/promises'
import { extname, join, normalize } from 'node:path'

const root = join(import.meta.dirname, '..', 'docs', 'prototype')
const port = Number(process.env.PORT ?? 4100)
const types = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript',
  '.png': 'image/png',
  '.json': 'application/json',
}

createServer(async (req, res) => {
  const url = new URL(req.url ?? '/', 'http://localhost')
  const path = normalize(url.pathname === '/' ? '/Main.dc.html' : url.pathname)
  if (path.includes('..')) return res.writeHead(400).end()
  try {
    const body = await readFile(join(root, path))
    res
      .writeHead(200, {
        'content-type': types[extname(path)] ?? 'application/octet-stream',
      })
      .end(body)
  } catch {
    res.writeHead(404).end('não encontrado')
  }
}).listen(port, () =>
  console.log(`Protótipo em http://localhost:${port}/Main.dc.html`),
)
