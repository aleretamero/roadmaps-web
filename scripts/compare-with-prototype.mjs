// Gera uma imagem lado a lado: app (esquerda) × captura do protótipo (direita).
// Uso: pnpm e2e:compare <rota-do-app> <captura> [desktop|mobile]
//   ex.: pnpm e2e:compare /dashboard 03-painel
// Precisa do app rodando (pnpm dev) em APP_URL (padrão http://localhost:3000).
import { existsSync } from 'node:fs'
import { mkdir, readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { chromium } from 'playwright'

const [route = '/', capture, kind = 'desktop'] = process.argv.slice(2)
if (!capture) {
  console.error('Uso: pnpm e2e:compare <rota> <captura> [desktop|mobile]')
  process.exit(1)
}
const APP = process.env.APP_URL ?? 'http://localhost:3000'
const viewport =
  kind === 'mobile' ? { width: 390, height: 844 } : { width: 1440, height: 900 }
const root = join(import.meta.dirname, '..')
const protoFile = join(root, 'docs/prototype/screens', kind, `${capture}.png`)
if (!existsSync(protoFile)) {
  console.error(`Captura não encontrada: ${protoFile}`)
  process.exit(1)
}
const outDir = join(root, 'test-results', 'compare')
await mkdir(outDir, { recursive: true })

const browser = await chromium.launch()
const page = await browser.newPage({
  viewport,
  locale: 'pt-BR',
  timezoneId: 'America/Sao_Paulo',
})
const sep = route.includes('?') ? '&' : '?'
await page.goto(`${APP}${route}${sep}mock=padrao`, { waitUntil: 'networkidle' })
await page.waitForTimeout(500)
const app = (await page.screenshot({ fullPage: true })).toString('base64')
const proto = (await readFile(protoFile)).toString('base64')

const sheet = await browser.newPage({
  viewport: { width: viewport.width * 2 + 48, height: 900 },
})
await sheet.setContent(`<!doctype html><body style="margin:0;font:14px sans-serif;display:flex;gap:16px;padding:16px;background:#ddd">
  <figure style="margin:0;flex:1"><figcaption>App · ${route}</figcaption><img style="width:100%" src="data:image/png;base64,${app}"></figure>
  <figure style="margin:0;flex:1"><figcaption>Protótipo · ${capture}</figcaption><img style="width:100%" src="data:image/png;base64,${proto}"></figure>
</body>`)
const out = join(outDir, `${capture}-${kind}.png`)
await sheet.screenshot({ path: out, fullPage: true })
await browser.close()
console.log(`Comparação salva em ${out}`)
