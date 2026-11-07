import type { Page } from '@playwright/test'
import { expect, test } from './fixtures'

async function openTopic(
  page: Page,
  open: (p: string) => Promise<void>,
  module: string,
  topic: string,
) {
  await open('/roadmaps/101')
  await page.getByRole('link', { name: module, exact: true }).click()
  await page.getByRole('link', { name: topic, exact: true }).first().click()
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(topic)
}

const currentStep = (page: Page) =>
  page
    .getByRole('list', { name: 'Etapas do tópico' })
    .locator('[aria-current="step"]')

test.describe('linhas do tempo', () => {
  test('apagar a única sessão volta o tópico para Planejado', async ({
    page,
    open,
    expectAccessible,
  }) => {
    await openTopic(page, open, 'Docker', 'Docker Compose')
    await expect(currentStep(page)).toContainText('Planejado')
    const done = page.getByRole('region', { name: 'O que você fez' })
    await expect(done).toContainText('Nenhuma sessão registrada ainda')

    await page.getByRole('button', { name: 'Registrar sessão' }).click()
    await page
      .getByRole('dialog', { name: 'Docker Compose' })
      .getByRole('button', { name: 'Salvar registro' })
      .click()
    await expect(currentStep(page)).toContainText('Estudando')
    await expect(done.getByRole('listitem')).toHaveCount(1)
    await expectAccessible()

    await done
      .getByRole('button', { name: /^Ações da sessão de 7 de nov/ })
      .click()
    await page.getByRole('menuitem', { name: 'Apagar sessão' }).click()
    const confirm = page.getByRole('alertdialog', {
      name: 'Apagar esta sessão?',
    })
    await confirm.getByRole('button', { name: 'Apagar sessão' }).click()
    await expect(confirm).toBeHidden()
    await expect(page.getByText('Sessão apagada · Planejado')).toBeVisible()
    await expect(currentStep(page)).toContainText('Planejado')
    await expect(done).toContainText('Nenhuma sessão registrada ainda')
  })

  test('editar a sessão pela linha do tempo', async ({ page, open }) => {
    await openTopic(page, open, 'SQL Server', 'Índices')
    const done = page.getByRole('region', { name: 'O que você fez' })
    await done
      .getByRole('button', { name: /^Ações da sessão de 30 de out/ })
      .click()
    await page.getByRole('menuitem', { name: 'Editar sessão' }).click()
    const dialog = page.getByRole('dialog', { name: 'Índices' })
    await expect(dialog).toContainText('Editar sessão')
    await dialog.getByLabel(/Como foi\?/).fill('Revisei índices cobertos.')
    await dialog.getByRole('button', { name: 'Salvar alterações' }).click()
    await expect(dialog).toBeHidden()
    await expect(done).toContainText('Revisei índices cobertos.')
  })

  test('linha do tempo do módulo mostra o progresso nos tópicos', async ({
    page,
    open,
  }) => {
    await open('/roadmaps/101')
    await page.getByRole('link', { name: 'SQL Server', exact: true }).click()
    await page.getByRole('tab', { name: 'Linha do tempo' }).click()
    const progress = page.getByRole('region', { name: 'Progresso nos tópicos' })
    await expect(progress).toContainText('“Modelagem” concluído')
    await expect(progress).toContainText('Começou “Índices”')
  })
})
