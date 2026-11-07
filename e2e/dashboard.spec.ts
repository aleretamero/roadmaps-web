import { expect, test } from './fixtures'

test.describe('painel', () => {
  test('com dados: hoje, semana, roadmaps, próximos dias e atenção', async ({
    page,
    open,
    expectAccessible,
  }) => {
    await open('/dashboard')
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Bom dia')
    await expect(page.getByText('Sábado, 7 de novembro ·')).toBeVisible()

    const today = page.getByRole('region', { name: 'Hoje' })
    await expect(today.getByText('Programação assíncrona')).toBeVisible()
    await expect(
      today.getByRole('button', {
        name: 'Registrar sessão em Programação assíncrona',
      }),
    ).toBeVisible()

    const week = page.getByRole('region', { name: 'Sua semana' })
    await expect(week.getByRole('listitem')).toHaveCount(7)
    await expect(week.locator('[aria-current="date"]')).toHaveAccessibleName(
      /^sábado, 7/,
    )

    const rms = page.getByRole('region', { name: 'Roadmaps' })
    await expect(
      rms.getByRole('link', { name: /^Backend com \.NET 44%/ }),
    ).toBeVisible()

    const next = page.getByRole('region', { name: 'Próximos 7 dias' })
    await expect(next.getByText('Amanhã')).toBeVisible()

    const att = page.getByRole('region', { name: 'Precisa de atenção' })
    await expect(
      att.getByText(/Estava agendado para .* e não começou/),
    ).toBeVisible()
    await expectAccessible()
  })

  test.describe('novo usuário', () => {
    test.use({ scenario: 'vazio' })
    test('mostra os estados vazios', async ({
      page,
      open,
      expectAccessible,
    }) => {
      await open('/dashboard')
      await expect(page.getByText('Nada agendado para hoje.')).toBeVisible()
      await expect(page.getByText('Você ainda não tem roadmaps.')).toBeVisible()
      await expect(page.getByText('Sem sequência')).toBeVisible()
      await expect(
        page.getByText('Nada agendado para os próximos dias.'),
      ).toBeVisible()
      await expectAccessible()
    })
  })

  test.describe('dia sem tópico', () => {
    test.use({ scenario: 'sem-agenda-hoje' })
    test('oferece continuar o último tópico', async ({ page, open }) => {
      await open('/dashboard')
      const today = page.getByRole('region', { name: 'Hoje' })
      await expect(today.getByText('Nada agendado para hoje.')).toBeVisible()
      await expect(
        today.getByRole('button', { name: /^Continuar “/ }),
      ).toBeVisible()
    })
  })

  test.describe('tudo em dia', () => {
    test.use({ scenario: 'em-dia' })
    test('sem nada em atenção', async ({ page, open }) => {
      await open('/dashboard')
      await expect(
        page
          .getByRole('region', { name: 'Precisa de atenção' })
          .getByText('Tudo em dia. Nenhum tópico parado ou com data perdida.'),
      ).toBeVisible()
    })
  })

  test('sem rolagem lateral', async ({ page, open }) => {
    await open('/dashboard')
    await expect(page.getByRole('region', { name: 'Hoje' })).toBeVisible()
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth,
    )
    expect(overflow).toBeLessThanOrEqual(0)
  })
})
