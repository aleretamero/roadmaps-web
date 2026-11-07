import { expect, test } from './fixtures'

test.describe('mapa de calor do painel', () => {
  test('resumo, teclado, tooltip e clique abre a Agenda no dia', async ({
    page,
    open,
    expectAccessible,
    isMobile,
  }) => {
    await open('/dashboard')
    const card = page.getByRole('region', { name: 'Atividade' })
    const grid = card.getByRole('group', {
      name: /^Atividade das últimas 24 semanas: \d+ registros em \d+ dias\. Sequência atual de 8 dias\.$/,
    })
    await expect(grid).toBeVisible()

    const today = grid.getByRole('button', { name: /^Sáb, 7 de nov/ })
    await expect(today).toHaveAttribute('aria-current', 'date')
    await today.focus()
    await page.keyboard.press('ArrowUp')
    const friday = grid.getByRole('button', { name: /^Sex, 6 de nov/ })
    await expect(friday).toBeFocused()
    // tooltip visível com a data
    await expect(card.getByText('Sex, 6 de nov', { exact: true })).toBeVisible()

    if (!isMobile) await expectAccessible()

    await page.keyboard.press('Enter')
    await expect(page).toHaveURL(/\/schedule\?day=2026-11-06$/)
  })

  test('o que você fez nas últimas semanas', async ({ page, open }) => {
    await open('/dashboard')
    const card = page.getByRole('region', { name: 'Atividade' })
    await expect(
      card.getByRole('heading', {
        name: 'O que você fez · últimas 24 semanas',
      }),
    ).toBeVisible()
    for (const label of ['Estudei', 'Pratiquei', 'Concluí'])
      await expect(
        card.getByRole('listitem').filter({ hasText: label }),
      ).toBeVisible()
  })

  test.describe('sem registros', () => {
    test.use({ scenario: 'vazio' })
    test('grade vazia com zero registros', async ({ page, open }) => {
      await open('/dashboard')
      await expect(
        page.getByRole('group', { name: /: 0 registros em 0 dias/ }),
      ).toBeVisible()
    })
  })
})
