import AxeBuilder from '@axe-core/playwright'
import { test as base, expect } from '@playwright/test'
import type { Page } from '@playwright/test'

export type Scenario =
  | 'padrao'
  | 'vazio'
  | 'deslogado'
  | 'sem-drive'
  | 'com-drive'
  | 'erro-500'
  | 'lento'

/** Hora fixa dos testes: sábado, 7 de novembro de 2026, 10h em São Paulo. */
export const NOW = new Date('2026-11-07T10:00:00-03:00')

type Fixtures = {
  /** Cenário da API mockada para o teste (padrão: `padrao`). */
  scenario: Scenario
  /** Abre uma rota do app já no cenário do teste. */
  open: (path: string) => Promise<void>
  /** Falha se o axe encontrar violações na página. */
  expectAccessible: (page?: Page) => Promise<void>
  /** Erros de console e de página durante o teste (falham o teste no fim). */
  consoleErrors: Array<string>
}

export const test = base.extend<Fixtures>({
  scenario: ['padrao', { option: true }],
  consoleErrors: async ({ page }, use) => {
    const errors: Array<string> = []
    page.on('pageerror', (e) => errors.push(e.message))
    page.on('console', (m) => {
      // 4xx/5xx esperados dos cenários aparecem como "Failed to load resource".
      if (
        m.type() === 'error' &&
        !m.text().startsWith('Failed to load resource')
      )
        errors.push(m.text())
    })
    await use(errors)
    expect(errors, 'erros no console').toEqual([])
  },
  open: async ({ page, scenario, consoleErrors }, use) => {
    void consoleErrors
    await page.clock.setFixedTime(NOW)
    await use(async (path) => {
      const url = new URL(path, 'http://x')
      url.searchParams.set('mock', scenario)
      await page.goto(url.pathname + url.search)
      await page.waitForFunction(
        () => (window as Window & { __MOCK_READY__?: boolean }).__MOCK_READY__,
      )
    })
  },
  expectAccessible: async ({ page }, use) => {
    await use(async (target = page) => {
      const results = await new AxeBuilder({ page: target })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
        .analyze()
      expect(
        results.violations.map((v) => `${v.id}: ${v.help} (${v.nodes.length})`),
      ).toEqual([])
    })
  },
})

export { expect }
