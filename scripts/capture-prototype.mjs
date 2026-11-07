// Gera as capturas de referência do protótipo em docs/prototype/screens/{desktop,mobile}.
// Uso: pnpm prototype (em outro terminal) e depois pnpm prototype:capture
import { mkdir } from 'node:fs/promises'
import { join } from 'node:path'
import { chromium } from 'playwright'

const BASE = process.env.PROTOTYPE_URL ?? 'http://localhost:4100/Main.dc.html'
const OUT = join(import.meta.dirname, '..', 'docs', 'prototype', 'screens')
const viewports = {
  desktop: { width: 1440, height: 900 },
  mobile: { width: 390, height: 844 },
}

async function capture(kind) {
  const browser = await chromium.launch()
  const page = await browser.newPage({
    viewport: viewports[kind],
    locale: 'pt-BR',
    timezoneId: 'America/Sao_Paulo',
  })
  const dir = join(OUT, kind)
  await mkdir(dir, { recursive: true })
  const wait = (ms = 350) => page.waitForTimeout(ms)
  const dialog = page.locator('[role=dialog]')
  const done = []
  let n = 0
  const shot = async (name, full = true) => {
    n += 1
    const file = `${String(n).padStart(2, '0')}-${name}.png`
    await page.screenshot({ path: join(dir, file), fullPage: full })
    done.push(file)
  }
  const step = async (name, fn, full = true) => {
    try {
      await fn()
      await wait()
      await shot(name, full)
    } catch (e) {
      console.warn(
        `[${kind}] não consegui capturar "${name}": ${e.message.split('\n')[0]}`,
      )
    }
  }
  const nav = async (label) => {
    const main = page
      .locator('nav[aria-label=Principal]')
      .getByRole('button', { name: label })
    if (await main.isVisible().catch(() => false)) return main.click()
    // no celular a navegação pode estar num menu
    await page.getByRole('button', { name: /menu/i }).first().click()
    await page.getByRole('button', { name: label }).first().click()
  }
  const closeDialog = async () => {
    await page.keyboard.press('Escape')
    await wait(250)
    if (await dialog.count()) {
      const cancel = dialog
        .getByRole('button', { name: /Cancelar|Fechar/ })
        .first()
      if (await cancel.count()) await cancel.click()
    }
    await wait(250)
  }

  await page.goto(BASE)
  await wait(2500)
  await step('landing', async () => {})
  await step('login', async () => {
    await page
      .getByRole('button', { name: 'Entrar', exact: true })
      .first()
      .click()
  })
  await step('painel', async () => {
    await page.getByRole('button', { name: /Continuar com GitHub/ }).click()
    await wait(1400)
  })
  await step('meus-roadmaps', () => nav('Meus roadmaps'))
  await step('roadmap-mapa', async () => {
    await page
      .getByRole('button', { name: /Backend com \.NET/ })
      .first()
      .click()
  })
  await step(
    'roadmap-agendar-automaticamente',
    async () => {
      await page
        .getByRole('button', { name: 'Agendar automaticamente' })
        .first()
        .click()
    },
    false,
  )
  await closeDialog()
  await step('roadmap-lista', async () => {
    await page.getByRole('button', { name: /Lista/ }).first().click()
  })
  await step('roadmap-progresso', async () => {
    await page.getByRole('tab', { name: /Progresso/ }).click()
  })
  await step('modulo', async () => {
    await page.getByRole('tab', { name: /Roadmap/ }).click()
    await wait()
    const lista = page.getByRole('button', { name: /Lista/ })
    if (await lista.count()) await lista.first().click()
    await page
      .getByRole('button', { name: 'Ações de SQL Server', exact: true })
      .click()
    await page.getByRole('menuitem', { name: 'Abrir módulo' }).click()
  })
  await step(
    'modulo-adicionar-topicos',
    async () => {
      await page
        .locator('main')
        .getByRole('button', { name: 'Adicionar tópicos' })
        .first()
        .click()
    },
    false,
  )
  await closeDialog()
  await step('modulo-linha-do-tempo', () =>
    page.getByRole('tab', { name: /Linha do tempo/ }).click(),
  )
  await step('modulo-anotacoes', () =>
    page.getByRole('tab', { name: /Anotações/ }).click(),
  )
  await step('topico', async () => {
    await page.getByRole('tab', { name: /Tópicos/ }).click()
    await wait()
    await page
      .locator('li.mdrow')
      .filter({ hasText: 'Índices' })
      .locator('button')
      .first()
      .click()
  })
  for (const tab of ['Anotações', 'Referências', 'Arquivos']) {
    await step(
      `topico-${tab.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')}`,
      () => page.getByRole('tab', { name: new RegExp(tab) }).click(),
    )
  }
  await step(
    'registrar-sessao',
    async () => {
      await page
        .getByRole('tab', { name: /O que você fez|Sessões/ })
        .first()
        .click()
        .catch(() => {})
      await page
        .getByRole('button', { name: /Registrar sessão/ })
        .first()
        .click()
    },
    false,
  )
  await closeDialog()
  await step('agenda', () => nav('Agenda'))
  await step(
    'busca',
    async () => {
      await page.locator('#q-top').click()
      await wait()
      await page.locator('#q-main').fill('índices')
    },
    false,
  )
  await closeDialog()
  for (const sec of ['Conta', 'Estudo e agenda', 'Integrações']) {
    await step(
      `configuracoes-${sec.split(' ')[0].toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')}`,
      async () => {
        if (
          !(await page.getByRole('button', { name: sec, exact: true }).count())
        ) {
          await page.getByRole('button', { name: /Conta de/ }).click()
          await page.getByRole('menuitem', { name: 'Configurações' }).click()
          await wait()
        }
        await page.getByRole('button', { name: sec, exact: true }).click()
      },
    )
  }

  await browser.close()
  console.log(
    `[${kind}] ${done.length} capturas em docs/prototype/screens/${kind}`,
  )
}

for (const kind of Object.keys(viewports)) await capture(kind)
