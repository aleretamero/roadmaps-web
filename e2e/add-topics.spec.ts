import type { Page } from '@playwright/test'
import { expect, test } from './fixtures'

async function openModule(page: Page, open: (p: string) => Promise<void>) {
  await open('/roadmaps/101')
  await page.getByRole('link', { name: 'SQL Server', exact: true }).click()
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('SQL Server')
}

const topicTitles = (page: Page) =>
  page
    .getByRole('region', { name: 'Tópicos do módulo' })
    .getByRole('listitem')
    .getByRole('link')

test.describe('modal Adicionar tópicos', () => {
  test('colar 3 linhas e salvar cria 3 tópicos no fim', async ({
    page,
    open,
    expectAccessible,
  }) => {
    await openModule(page, open)
    await page.getByRole('button', { name: 'Adicionar tópicos' }).click()
    const dialog = page.getByRole('dialog', { name: 'Adicionar tópicos' })
    await expect(dialog.getByLabel('Tópico 1', { exact: true })).toBeFocused()
    await expectAccessible()

    await page.evaluate(() => {
      const el = document.activeElement as HTMLInputElement
      const data = new DataTransfer()
      data.setData('text/plain', '- Views\n- Triggers\n- Stored procedures')
      el.dispatchEvent(
        new ClipboardEvent('paste', {
          clipboardData: data,
          bubbles: true,
          cancelable: true,
        }),
      )
    })
    await expect(dialog.getByLabel('Tópico 1', { exact: true })).toHaveValue(
      'Views',
    )
    await expect(dialog.getByLabel('Tópico 3', { exact: true })).toHaveValue(
      'Stored procedures',
    )
    await dialog.getByRole('button', { name: 'Adicionar 3 tópicos' }).click()
    await expect(dialog).toBeHidden()
    await expect(page.getByText('3 tópicos adicionados')).toBeVisible()
    await expect(topicTitles(page)).toHaveText([
      'Modelagem',
      'Índices',
      'Transações no SQL Server',
      'Views',
      'Triggers',
      'Stored procedures',
    ])
  })

  test('Enter cria a próxima linha, Backspace apaga e Ctrl+Enter salva', async ({
    page,
    open,
  }) => {
    await openModule(page, open)
    await page.getByRole('button', { name: 'Adicionar tópicos' }).click()
    const dialog = page.getByRole('dialog', { name: 'Adicionar tópicos' })
    await page.keyboard.type('Jobs')
    await page.keyboard.press('Enter')
    await expect(dialog.getByLabel('Tópico 2', { exact: true })).toBeFocused()
    await expect(dialog.getByLabel(/^Tópico \d+$/)).toHaveCount(4)
    await page.keyboard.press('Backspace')
    await expect(dialog.getByLabel('Tópico 1', { exact: true })).toBeFocused()
    await expect(dialog.getByLabel(/^Tópico \d+$/)).toHaveCount(3)
    await dialog.getByRole('button', { name: 'Opcional (tópico 1)' }).click()
    await dialog.getByLabel('Tópico 1', { exact: true }).focus()
    await page.keyboard.press('Control+Enter')
    await expect(dialog).toBeHidden()
    await expect(topicTitles(page).last()).toHaveText('Jobs')
  })

  test('data pelo calendário e título repetido', async ({ page, open }) => {
    await openModule(page, open)
    await page.getByRole('button', { name: 'Adicionar tópicos' }).click()
    const dialog = page.getByRole('dialog', { name: 'Adicionar tópicos' })
    await page.keyboard.type('Índices')
    await dialog.getByRole('button', { name: 'Adicionar 1 tópico' }).click()
    await expect(dialog.getByRole('alert')).toContainText(
      '“Índices” já existe neste módulo.',
    )
    await dialog.getByLabel('Tópico 1', { exact: true }).fill('Backups')
    await dialog
      .getByRole('button', { name: 'Data prevista do tópico 1' })
      .click()
    await page
      .getByRole('grid')
      .getByRole('button', { name: /, 20 de / })
      .first()
      .click()
    await expect(
      dialog.getByRole('button', {
        name: /^Data prevista do tópico 1: 20 de /,
      }),
    ).toBeVisible()
    await dialog.getByRole('button', { name: 'Adicionar 1 tópico' }).click()
    await expect(dialog).toBeHidden()
    await expect(
      page.getByRole('region', { name: 'Tópicos do módulo' }),
    ).toContainText('Backups')
  })
})
