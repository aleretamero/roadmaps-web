import { expect, test } from './fixtures'

/**
 * Regressão visual: compara com a captura aprovada em e2e/visual.spec.ts-snapshots.
 * Atualize de propósito com `pnpm e2e --update-snapshots` quando a tela mudar.
 */
test.use({ scenario: 'deslogado' })

test('página inicial', async ({ page, open }) => {
  await open('/')
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  await expect(page).toHaveScreenshot('inicio.png', { fullPage: true })
})
