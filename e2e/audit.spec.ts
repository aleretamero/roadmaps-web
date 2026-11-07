import { expect, test } from './fixtures'

/**
 * Passada final (FU23): toda rota sem violações do axe e sem rolagem lateral,
 * em 1440 e em 390 px (os dois projetos do Playwright).
 */
const LOGGED_IN = [
  '/dashboard',
  '/roadmaps',
  '/roadmaps?archived=true',
  '/roadmaps/new',
  '/roadmaps/101',
  '/roadmaps/101?view=list',
  '/roadmaps/101?tab=progress',
  '/modules/112',
  '/modules/112?tab=timeline',
  '/modules/112?tab=notes',
  '/topics/116',
  '/topics/116?tab=files',
  '/topics/116?tab=resources',
  '/topics/116?tab=notes',
  '/schedule',
  '/schedule?view=week',
  '/settings/account',
  '/settings/study',
  '/settings/integrations',
]

async function checkPage(
  page: import('@playwright/test').Page,
  expectAccessible: () => Promise<void>,
) {
  await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible()
  // Espera o conteúdo assíncrono (esqueletos) sair antes de medir.
  await expect(
    page.locator('[role="status"][aria-label^="Carregando"]'),
  ).toHaveCount(0)
  await expectAccessible()
  const overflow = await page.evaluate(
    () =>
      document.documentElement.scrollWidth -
      document.documentElement.clientWidth,
  )
  expect(overflow, 'rolagem lateral').toBeLessThanOrEqual(0)
}

test.describe('auditoria de acessibilidade e responsividade', () => {
  for (const path of LOGGED_IN)
    test(`rota ${path}`, async ({ page, open, expectAccessible }) => {
      await open(path)
      await checkPage(page, expectAccessible)
    })

  test.describe('deslogado', () => {
    test.use({ scenario: 'deslogado' })
    for (const path of ['/', '/login'])
      test(`rota ${path}`, async ({ page, open, expectAccessible }) => {
        await open(path)
        await checkPage(page, expectAccessible)
      })
  })

  test.describe('vazio', () => {
    test.use({ scenario: 'vazio' })
    for (const path of ['/dashboard', '/roadmaps', '/schedule'])
      test(`rota ${path} sem dados`, async ({
        page,
        open,
        expectAccessible,
      }) => {
        await open(path)
        await checkPage(page, expectAccessible)
      })
  })
})
