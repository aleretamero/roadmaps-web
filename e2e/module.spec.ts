import type { Page } from '@playwright/test'
import { expect, test } from './fixtures'

async function openSqlServer(page: Page, open: (p: string) => Promise<void>) {
  await open('/roadmaps/101')
  await page.getByRole('link', { name: 'SQL Server', exact: true }).click()
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('SQL Server')
}

test.describe('detalhe do módulo', () => {
  test('clicar na linha abre o tópico; o menu não abre junto', async ({
    page,
    open,
    expectAccessible,
  }) => {
    await openSqlServer(page, open)
    await expectAccessible()
    const moduleUrl = page.url()

    await page.getByRole('button', { name: 'Ações de Índices' }).click()
    await expect(page.getByRole('menu')).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(page.getByRole('menu')).toBeHidden()
    await expect(page).toHaveURL(moduleUrl)

    await page.getByRole('button', { name: 'Ações de Índices' }).click()
    await page.getByRole('menuitem', { name: 'Registrar sessão' }).click()
    await expect(page).toHaveURL(/\/topics\/\d+\?log=1$/)
    await page.goBack()

    // clique no meio da linha (nos detalhes), fora do título: o link esticado
    // cobre a linha, então o clique cai nele (force: pula a checagem de alvo)
    await page.getByText('Praticando desde').click({ force: true })
    await expect(page).toHaveURL(/\/topics\/\d+$/)
  })

  test('editar módulo em diálogo', async ({ page, open }) => {
    await openSqlServer(page, open)
    await page.getByRole('button', { name: 'Editar módulo' }).click()
    const dialog = page.getByRole('dialog', { name: 'Editar módulo' })
    await dialog.getByLabel('Nome').fill('')
    await dialog.getByRole('button', { name: 'Salvar' }).click()
    await expect(dialog.getByText('Dê um nome ao módulo')).toBeVisible()
    await dialog.getByLabel('Nome').fill('SQL Server 2022')
    await dialog.getByRole('button', { name: 'Salvar' }).click()
    await expect(dialog).toBeHidden()
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(
      'SQL Server 2022',
    )
    await expect(page).not.toHaveURL(/edit=1/)
  })

  test('novo tópico rápido e abas pelo teclado', async ({ page, open }) => {
    await openSqlServer(page, open)
    await page.getByLabel('Novo tópico em SQL Server').fill('Stored procedures')
    await page.keyboard.press('Enter')
    await expect(
      page.getByRole('link', { name: 'Stored procedures' }),
    ).toBeVisible()
    await expect(page.getByLabel('Novo tópico em SQL Server')).toHaveValue('')

    await page.getByRole('tab', { name: 'Tópicos' }).focus()
    await page.keyboard.press('ArrowRight')
    await expect(
      page.getByRole('tab', { name: 'Linha do tempo' }),
    ).toHaveAttribute('aria-selected', 'true')
    await expect(page).toHaveURL(/tab=timeline/)
  })

  test('sem rolagem lateral', async ({ page, open }) => {
    await openSqlServer(page, open)
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth - window.innerWidth,
      ),
    ).toBeLessThanOrEqual(0)
  })
})
