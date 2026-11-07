import { expect, test } from './fixtures'

test.describe('Meus roadmaps', () => {
  test('arquivar some da lista e aparece em arquivados; desarquivar volta', async ({
    page,
    open,
    expectAccessible,
  }) => {
    await open('/roadmaps')
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(
      'Meus roadmaps',
    )
    await expectAccessible()
    const filters = page.getByRole('navigation', { name: 'Filtrar roadmaps' })
    await expect(
      filters.getByRole('link', { name: 'Ativos 3' }),
    ).toHaveAttribute('aria-current', 'page')

    await page.getByRole('button', { name: 'Ações de Frontend' }).click()
    await page.getByRole('menuitem', { name: 'Arquivar' }).click()
    await expect(page.getByText('“Frontend” arquivado')).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Frontend' })).toHaveCount(0)

    await filters.getByRole('link', { name: /^Arquivados 2/ }).click()
    await expect(page).toHaveURL(/\/roadmaps\?archived=true$/)
    await expect(page.getByRole('heading', { name: 'Frontend' })).toBeVisible()

    await page.getByRole('button', { name: 'Ações de Frontend' }).click()
    await page.getByRole('menuitem', { name: 'Desarquivar' }).click()
    await expect(page.getByRole('heading', { name: 'Frontend' })).toHaveCount(0)
    await expect(filters.getByRole('link', { name: /^Ativos 3/ })).toBeVisible()
  })

  test('apagar pede confirmação', async ({ page, open }) => {
    await open('/roadmaps')
    await page.getByRole('button', { name: 'Ações de Algoritmos' }).click()
    await page.getByRole('menuitem', { name: 'Apagar…' }).click()
    const dialog = page.getByRole('alertdialog')
    await expect(dialog).toContainText('não dá para desfazer')
    await dialog.getByRole('button', { name: 'Cancelar' }).click()
    await expect(
      page.getByRole('heading', { name: 'Algoritmos' }),
    ).toBeVisible()

    await page.getByRole('button', { name: 'Ações de Algoritmos' }).click()
    await page.getByRole('menuitem', { name: 'Apagar…' }).click()
    await page
      .getByRole('alertdialog')
      .getByRole('button', { name: 'Apagar roadmap' })
      .click()
    await expect(page.getByText('“Algoritmos” apagado')).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Algoritmos' })).toHaveCount(
      0,
    )
  })

  test('o card abre o roadmap e o botão leva ao criador', async ({
    page,
    open,
  }) => {
    await open('/roadmaps')
    await page.getByRole('link', { name: 'Backend com .NET' }).click()
    await expect(page).toHaveURL(/\/roadmaps\/\d+$/)
    await page.goBack()
    await page.getByRole('link', { name: 'Novo roadmap' }).click()
    await expect(page).toHaveURL(/\/roadmaps\/new$/)
  })

  test.describe('sem roadmaps', () => {
    test.use({ scenario: 'vazio' })
    test('chama para criar o primeiro', async ({ page, open }) => {
      await open('/roadmaps')
      await expect(
        page.getByRole('heading', { name: 'Você não tem roadmaps ativos' }),
      ).toBeVisible()
      await page.getByRole('link', { name: 'Criar roadmap' }).click()
      await expect(page).toHaveURL(/\/roadmaps\/new$/)
    })
  })

  test('sem rolagem lateral', async ({ page, open }) => {
    await open('/roadmaps')
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth - window.innerWidth,
      ),
    ).toBeLessThanOrEqual(0)
  })
})
