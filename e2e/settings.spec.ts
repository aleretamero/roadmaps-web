import { expect, test } from './fixtures'

test.describe('configurações', () => {
  test('conectar o Drive pelo aviso do tópico e voltar para a aba Arquivos', async ({
    page,
    open,
    expectAccessible,
  }) => {
    await open('/roadmaps/101')
    await page.getByRole('link', { name: 'SQL Server', exact: true }).click()
    await page
      .getByRole('link', { name: 'Índices', exact: true })
      .first()
      .click()
    await page.getByRole('tab', { name: /Arquivos/ }).click()
    const topicUrl = page.url()
    await expect(
      page.getByRole('heading', {
        name: 'Conecte o Google Drive para guardar arquivos',
      }),
    ).toBeVisible()
    await page.getByRole('link', { name: 'Conectar Google Drive' }).click()

    await expect(page).toHaveURL(/\/settings\/integrations\?returnTo=/)
    await expect(
      page.getByRole('link', { name: 'Voltar para o tópico' }),
    ).toBeVisible()
    const drive = page.getByRole('listitem', { name: 'Google Drive' })
    await expect(drive).toContainText('Desconectado')
    await expect(
      page.getByRole('listitem', { name: 'Google Agenda' }),
    ).toContainText('Em breve')
    await expectAccessible()
    await drive.getByRole('button', { name: 'Conectar' }).click()

    await expect(page.getByText('Google Drive conectado')).toBeVisible()
    await expect(page).toHaveURL(/\/topics\/\d+\?tab=files/)
    expect(new URL(page.url()).pathname).toBe(new URL(topicUrl).pathname)
    await expect(page.getByRole('tab', { name: /Arquivos/ })).toHaveAttribute(
      'aria-selected',
      'true',
    )
    await expect(
      page.getByRole('heading', {
        name: 'Conecte o Google Drive para guardar arquivos',
      }),
    ).toBeHidden()
  })

  test('estudo e agenda: salvar, aviso de alterações não salvas', async ({
    page,
    open,
    expectAccessible,
  }) => {
    await open('/settings/study')
    await expect(
      page.getByRole('link', { name: 'Estudo e agenda' }),
    ).toHaveAttribute('aria-current', 'page')
    await page.getByRole('button', { name: 'Sábado' }).click()
    await expect(page.getByText('Alterações não salvas')).toBeVisible()
    await expectAccessible()

    // Sair com mudanças pede confirmação.
    await page.getByRole('link', { name: 'Conta', exact: true }).click()
    const leave = page.getByRole('alertdialog', { name: 'Sair sem salvar?' })
    await expect(leave).toBeVisible()
    await leave.getByRole('button', { name: 'Continuar editando' }).click()
    await expect(page).toHaveURL(/\/settings\/study/)

    await page.getByRole('radio', { name: 'Agenda' }).click()
    await page.getByRole('button', { name: 'Salvar' }).click()
    await expect(page.getByText('Preferências salvas')).toBeVisible()
    await expect(page.getByText('Alterações não salvas')).toBeHidden()
    await expect(page.getByRole('button', { name: 'Sábado' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    await expect(page.getByRole('radio', { name: 'Agenda' })).toHaveAttribute(
      'aria-checked',
      'true',
    )
    await page.getByRole('link', { name: 'Conta', exact: true }).click()
    await expect(page).toHaveURL(/\/settings\/account/)
  })

  test('conta: mudar nome e fuso', async ({ page, open }) => {
    await open('/settings/account')
    await page.getByLabel('Nome').fill('')
    await page.getByRole('button', { name: 'Salvar' }).click()
    await expect(page.getByText('Informe seu nome.')).toBeVisible()
    await page.getByLabel('Nome').fill('Marina C.')
    await page.getByLabel('Fuso horário').selectOption('Europe/Lisbon')
    await page.getByRole('button', { name: 'Salvar' }).click()
    await expect(page.getByText('Conta atualizada')).toBeVisible()
    await expect(
      page.getByRole('button', { name: /^Conta de Marina C\./ }),
    ).toBeVisible()
  })

  test.describe('com Drive', () => {
    test.use({ scenario: 'com-drive' })
    test('desconectar pede confirmação', async ({ page, open }) => {
      await open('/settings/integrations')
      const drive = page.getByRole('listitem', { name: 'Google Drive' })
      await expect(drive).toContainText('Conectado')
      await drive.getByRole('button', { name: 'Desconectar' }).click()
      await page
        .getByRole('alertdialog')
        .getByRole('button', { name: 'Desconectar' })
        .click()
      await expect(page.getByText('Google Drive desconectado')).toBeVisible()
      await expect(drive).toContainText('Desconectado')
    })
  })
})
