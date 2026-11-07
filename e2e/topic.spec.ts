import type { Page } from '@playwright/test'
import { expect, test } from './fixtures'

async function openIndices(page: Page, open: (p: string) => Promise<void>) {
  await open('/roadmaps/101')
  await page.getByRole('link', { name: 'SQL Server', exact: true }).click()
  await page.getByRole('link', { name: 'Índices', exact: true }).first().click()
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Índices')
}

test.describe('detalhe do tópico', () => {
  test('etapas, trilha e abas na URL', async ({
    page,
    open,
    expectAccessible,
  }) => {
    await openIndices(page, open)
    await expectAccessible()
    await expect(
      page
        .getByRole('navigation', { name: 'Localização' })
        .getByRole('link', { name: 'SQL Server' }),
    ).toBeVisible()
    await expect(
      page
        .getByRole('list', { name: 'Etapas do tópico' })
        .locator('[aria-current="step"]'),
    ).toContainText('Praticando')
    await page.getByRole('tab', { name: /Anotações/ }).click()
    await expect(page).toHaveURL(/tab=notes/)
    await page.getByRole('tab', { name: 'Linha do tempo' }).click()
    await expect(page).not.toHaveURL(/tab=/)
    await page.getByRole('button', { name: 'Registrar sessão' }).click()
    await expect(page).toHaveURL(/log=1/)
  })

  test('editar tópico', async ({ page, open }) => {
    await openIndices(page, open)
    await page.getByRole('button', { name: 'Editar' }).click()
    const dialog = page.getByRole('dialog', { name: 'Editar tópico' })
    await dialog.getByLabel('Título').fill('Índices e estatísticas')
    await dialog.getByRole('button', { name: 'Salvar' }).click()
    await expect(dialog).toBeHidden()
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(
      'Índices e estatísticas',
    )
    await expect(page).not.toHaveURL(/edit=1/)
  })

  test('agenda: adicionar e tirar dia', async ({ page, open }) => {
    await openIndices(page, open)
    const days = page
      .getByRole('list', { name: 'Dias agendados' })
      .getByRole('listitem')
    await expect(days).toHaveCount(1)
    await page.getByRole('button', { name: 'Adicionar dia' }).click()
    await page
      .getByRole('grid')
      .getByRole('button', { name: /, 20 de / })
      .first()
      .click()
    await expect(days).toHaveCount(2)
    await expect(
      page.getByText('Todas as datas previstas já passaram'),
    ).toBeHidden()
    await page
      .getByRole('button', { name: /^Tirar .*20 de .* da agenda$/ })
      .click()
    await expect(days).toHaveCount(1)
  })

  test('reabrir etapa', async ({ page, open }) => {
    await openIndices(page, open)
    await page.getByRole('button', { name: 'Mais ações do tópico' }).click()
    await page.getByRole('menuitem', { name: 'Reabrir etapa…' }).click()
    const dialog = page.getByRole('alertdialog')
    await dialog.getByRole('radio', { name: 'Estudando' }).click()
    await dialog.getByRole('button', { name: /^Voltar para Estudando/ }).click()
    await expect(dialog).toBeHidden()
    await expect(
      page
        .getByRole('list', { name: 'Etapas do tópico' })
        .locator('[aria-current="step"]'),
    ).toContainText('Estudando')
  })
})
