import { expect, test } from './fixtures'

test.describe('busca global', () => {
  test('buscar, filtrar e abrir um resultado só com teclado', async ({
    page,
    open,
    expectAccessible,
  }) => {
    await open('/dashboard')
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    const dialog = page.getByRole('dialog', { name: 'Busca' })
    await expect(async () => {
      await page.keyboard.press('Control+k')
      await expect(dialog).toBeVisible({ timeout: 1000 })
    }).toPass()
    const input = dialog.getByRole('combobox')
    await expect(input).toBeFocused()
    await page.keyboard.type('índices')
    await expect(dialog.getByRole('status')).toContainText(
      /\d+ resultados?, do mais relevante/,
    )
    await expect(dialog.getByRole('option').first()).toBeVisible()
    await expectAccessible()

    // Tab até o filtro "Anotações" e Enter: só anotações ficam.
    await page.keyboard.press('Tab')
    await expect(dialog.getByRole('button', { name: 'Tudo' })).toBeFocused()
    await page.keyboard.press('Tab')
    await page.keyboard.press('Tab')
    await expect(
      dialog.getByRole('button', { name: 'Anotações' }),
    ).toBeFocused()
    await page.keyboard.press('Enter')
    await expect(
      dialog.getByRole('button', { name: 'Anotações' }),
    ).toHaveAttribute('aria-pressed', 'true')
    await expect(dialog).toBeVisible()
    const options = dialog.getByRole('option')
    await expect(options.first()).toContainText('Anotação em')
    for (const o of await options.all())
      await expect(o).toContainText('Anotação')

    // De volta ao campo, setas e Enter abrem o resultado na aba Anotações.
    await page.keyboard.press('Shift+Tab')
    await page.keyboard.press('Shift+Tab')
    await page.keyboard.press('Shift+Tab')
    await expect(input).toBeFocused()
    await page.keyboard.press('ArrowDown')
    await page.keyboard.press('ArrowUp')
    await page.keyboard.press('Enter')
    await expect(dialog).toBeHidden()
    await expect(page).toHaveURL(/\/topics\/\d+\?tab=notes/)
    await expect(page.getByRole('tab', { name: /Anotações/ })).toHaveAttribute(
      'aria-selected',
      'true',
    )
  })

  test('campo do cabeçalho, sem resultados e Esc fecha', async ({
    page,
    open,
  }) => {
    await open('/roadmaps')
    await page
      .getByRole('button', { name: /Buscar tópicos, anotações e arquivos/ })
      .click()
    const dialog = page.getByRole('dialog', { name: 'Busca' })
    await page.keyboard.type('xyzinexistente')
    await expect(
      dialog.getByText('Nenhum resultado para “xyzinexistente”'),
    ).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(dialog).toBeHidden()
  })
})
