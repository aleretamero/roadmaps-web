import { expect, test } from './fixtures'

test.describe('lembrete diário', () => {
  test('permissão concedida: liga, testa e a notificação abre o Registrar', async ({
    page,
    context,
    open,
    expectAccessible,
  }) => {
    await context.grantPermissions(['notifications'])
    await open('/settings/study')
    const toggle = page.getByRole('switch', { name: 'Lembrete diário' })
    await expect(toggle).toHaveAttribute('aria-checked', 'false')
    await toggle.click()
    const explain = page.getByRole('alertdialog', {
      name: 'Permitir notificações?',
    })
    await expect(explain).toContainText('o navegador vai pedir permissão')
    await explain.getByRole('button', { name: 'Continuar' }).click()
    await expect(page.getByText('Lembrete ligado')).toBeVisible()
    await expect(toggle).toHaveAttribute('aria-checked', 'true')
    await expect(page.getByRole('figure')).toContainText('Hora de estudar')
    await expectAccessible()

    await page.getByLabel('Horário').fill('07:30')
    await page.getByLabel('Horário').blur()
    await expect(page.getByText('Horário do lembrete salvo')).toBeVisible()
    await expect(page.getByRole('figure')).toContainText('07:30')

    await page
      .getByRole('button', { name: 'Enviar notificação de teste' })
      .click()
    const notification = page.getByRole('alert', {
      name: 'Notificação (simulada)',
    })
    await expect(notification).toContainText('Hora de estudar')
    await notification.getByRole('button', { name: 'Registrar' }).click()
    await expect(page).toHaveURL(/\/topics\/\d+\?log=1/)
    await expect(page.getByRole('dialog')).toContainText('Registrar sessão')

    // Voltando às Configurações, o lembrete continua ligado; desligar cancela a assinatura.
    await page.keyboard.press('Escape')
    await page.goBack()
    const again = page.getByRole('switch', { name: 'Lembrete diário' })
    await expect(again).toHaveAttribute('aria-checked', 'true')
    await again.click()
    await expect(page.getByText('Lembrete desligado')).toBeVisible()
    await expect(again).toHaveAttribute('aria-checked', 'false')
  })

  test('permissão negada: explica como liberar e o lembrete fica desligado', async ({
    page,
    context,
    open,
  }) => {
    await context.clearPermissions()
    await open('/settings/study')
    await page.evaluate(() => {
      // O navegador de teste responde "default"; simula a pessoa recusando.
      Object.defineProperty(Notification, 'requestPermission', {
        value: () => Promise.resolve('denied'),
      })
    })
    await page.getByRole('switch', { name: 'Lembrete diário' }).click()
    await page
      .getByRole('alertdialog')
      .getByRole('button', { name: 'Continuar' })
      .click()
    await expect(page.getByRole('alert')).toContainText(
      'As notificações estão bloqueadas',
    )
    await expect(
      page.getByRole('switch', { name: 'Lembrete diário' }),
    ).toHaveAttribute('aria-checked', 'false')
  })
})
