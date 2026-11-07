import { expect, test } from './fixtures'

test.describe('modal Registrar sessão', () => {
  test('do painel: registrar hoje muda a etapa e avisa', async ({
    page,
    open,
    expectAccessible,
  }) => {
    await open('/dashboard')
    await page
      .getByRole('region', { name: 'Hoje' })
      .getByRole('button', {
        name: 'Registrar sessão em Programação assíncrona',
      })
      .click()
    const dialog = page.getByRole('dialog', { name: 'Programação assíncrona' })
    await expect(dialog).toBeVisible()
    await expectAccessible()
    await dialog.getByRole('button', { name: /^Pratiquei/ }).click()
    await expect(dialog.getByText(/passa de .* para Praticando/)).toBeVisible()
    await dialog
      .getByLabel(/Como foi\?/)
      .fill('Fiz os exercícios de Task.WhenAll.')
    await dialog.getByRole('button', { name: 'Salvar registro' }).click()
    await expect(dialog).toBeHidden()
    await expect(
      page.getByText(/^Registrado hoje: .*pratiquei · Praticando$/),
    ).toBeVisible()
  })

  test('do módulo: validação de atividade e Ctrl+Enter', async ({
    page,
    open,
  }) => {
    await open('/roadmaps/101')
    await page.getByRole('link', { name: 'SQL Server', exact: true }).click()
    await page
      .getByRole('button', { name: 'Ações de Transações no SQL Server' })
      .click()
    await page.getByRole('menuitem', { name: 'Registrar sessão' }).click()
    const dialog = page.getByRole('dialog', {
      name: 'Transações no SQL Server',
    })
    await dialog.getByRole('button', { name: /^Estudei/ }).click()
    await expect(dialog.getByText('Marque o que você fez.')).toBeVisible()
    await expect(
      dialog.getByRole('button', { name: 'Salvar registro' }),
    ).toBeDisabled()
    await dialog.getByRole('button', { name: /^Concluí/ }).click()
    await dialog.getByRole('radio', { name: 'Ontem' }).click()
    await dialog.getByLabel(/Como foi\?/).focus()
    await page.keyboard.press('Control+Enter')
    await expect(dialog).toBeHidden()
    await expect(
      page.getByText(/^Registrado em 6 de nov: concluí · Concluído$/),
    ).toBeVisible()
    await expect(
      page
        .getByRole('region', { name: 'Tópicos do módulo' })
        .getByRole('listitem')
        .filter({ hasText: 'Transações no SQL Server' }),
    ).toContainText('Concluído')
  })

  test('do tópico: /topics/:id?log=1 abre o modal e fechar limpa a URL', async ({
    page,
    open,
  }) => {
    await open('/roadmaps/101')
    await page.getByRole('link', { name: 'SQL Server', exact: true }).click()
    await page
      .getByRole('link', { name: 'Índices', exact: true })
      .first()
      .click()
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Índices')
    const url = new URL(page.url())
    url.searchParams.set('log', '1')
    await open(url.pathname + url.search)
    const dialog = page.getByRole('dialog', { name: 'Índices' })
    await expect(dialog).toBeVisible()
    await expect(
      dialog.getByRole('button', { name: /^Pratiquei/ }),
    ).toHaveAttribute('aria-pressed', 'true')
    await dialog.getByRole('button', { name: 'Cancelar' }).click()
    await expect(dialog).toBeHidden()
    await expect(page).not.toHaveURL(/log=1/)
  })
})
