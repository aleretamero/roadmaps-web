import { expect, test } from './fixtures'

test.describe('agenda', () => {
  test('mês, semana e navegação pela URL', async ({
    page,
    open,
    expectAccessible,
  }) => {
    await open('/schedule')
    await expect(
      page.getByRole('heading', { level: 2, name: 'Novembro de 2026' }),
    ).toBeVisible()
    await expect(
      page.getByRole('button', { name: /^Hoje, sábado, 7 de novembro/ }),
    ).toHaveAttribute('aria-current', 'date')
    await expect(
      page.getByRole('region', { name: 'Em novembro' }),
    ).toContainText('dias com registro')
    await expectAccessible()
    await page.getByRole('button', { name: 'Próximo mês' }).click()
    await expect(page).toHaveURL(/month=2026-12/)
    await expect(
      page.getByRole('heading', { level: 2, name: 'Dezembro de 2026' }),
    ).toBeVisible()
    await page.getByRole('button', { name: 'Hoje', exact: true }).click()
    await expect(
      page.getByRole('heading', { level: 2, name: 'Novembro de 2026' }),
    ).toBeVisible()
    await page.getByRole('button', { name: 'Semana', exact: true }).click()
    await expect(page).toHaveURL(/view=week/)
    await expect(
      page.getByRole('heading', { level: 2, name: /^Semana de 1 a 7 de nov/ }),
    ).toBeVisible()
    await expectAccessible()
  })

  test('trocar a data de um tópico atrasado tira o aviso de atraso', async ({
    page,
    open,
  }) => {
    await open('/schedule')
    const late = page.getByRole('link', { name: 'Módulos — atrasado' })
    await expect(late).toBeVisible()
    await page
      .getByRole('button', { name: /^quarta-feira, 4 de novembro/ })
      .click()
    const day = page.getByRole('dialog', {
      name: 'Quarta-feira, 4 de novembro',
    })
    await expect(day).toContainText('Atrasado')
    await day.getByRole('button', { name: 'Trocar data' }).click()
    const move = page.getByRole('dialog', { name: 'Módulos' })
    await expect(move).toContainText('Trocar data')
    await move.getByRole('button', { name: 'Escolher nova data' }).click()
    await page
      .getByRole('grid')
      .getByRole('button', { name: /, 20 de / })
      .first()
      .click()
    await expect(move.getByText(/→ Sex, 20 de nov/)).toBeVisible()
    await move.getByRole('button', { name: 'Trocar data' }).click()
    await expect(move).toBeHidden()
    await expect(
      page.getByText('Data trocada: 4 de nov → 20 de nov'),
    ).toBeVisible()
    await expect(late).toBeHidden()
    await expect(
      page.getByRole('link', { name: 'Módulos — agendado' }),
    ).toBeVisible()
  })

  test('modal do dia: agendar, tirar e registrar', async ({ page, open }) => {
    await open('/schedule?day=2026-11-10')
    const day = page.getByRole('dialog', {
      name: 'Terça-feira, 10 de novembro',
    })
    await day.getByLabel('Filtrar tópicos pelo nome').fill('Índices')
    await day.getByRole('button', { name: 'Agendar Índices neste dia' }).click()
    await expect(page.getByText('Agendado para 10 de nov')).toBeVisible()
    await expect(
      day.getByRole('region', { name: 'Já agendado para este dia' }),
    ).toContainText('Índices')
    await day.getByRole('button', { name: 'Tirar Índices deste dia' }).click()
    await expect(
      day.getByRole('region', { name: 'Já agendado para este dia' }),
    ).toBeHidden()
    await day.getByRole('button', { name: 'Fechar', exact: true }).click()
    await expect(page).not.toHaveURL(/day=/)

    await page
      .getByRole('button', { name: /^quarta-feira, 4 de novembro/ })
      .click()
    await page
      .getByRole('button', { name: 'Registrar sessão em Módulos' })
      .click()
    const log = page.getByRole('dialog', { name: 'Módulos' })
    await expect(log.getByRole('radio', { name: 'Outro dia' })).toHaveAttribute(
      'aria-checked',
      'true',
    )
    await expect(
      log.getByText(/Entra na agenda em qua, 4 de nov/),
    ).toBeVisible()
  })

  test('Reagendar no painel abre Trocar data', async ({ page, open }) => {
    await open('/dashboard')
    const attention = page.getByRole('region', { name: 'Precisa de atenção' })
    await attention.getByRole('button', { name: 'Reagendar Módulos' }).click()
    const move = page.getByRole('dialog', { name: 'Módulos' })
    await move.getByRole('button', { name: 'Escolher nova data' }).click()
    await page
      .getByRole('grid')
      .getByRole('button', { name: /, 20 de / })
      .first()
      .click()
    await move.getByRole('button', { name: 'Trocar data' }).click()
    await expect(move).toBeHidden()
    await expect(
      attention.getByRole('button', { name: 'Reagendar Módulos' }),
    ).toBeHidden()
  })
})
