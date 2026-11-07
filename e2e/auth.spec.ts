import { AppShell } from './pages/AppShell'
import { LoginPage } from './pages/LoginPage'
import { expect, test } from './fixtures'

test.describe('login e sessão', () => {
  test.use({ scenario: 'deslogado' })

  test('ciclo entrar → painel → sair', async ({
    page,
    open,
    expectAccessible,
  }) => {
    await open('/login')
    const login = new LoginPage(page)
    await expect(login.heading()).toBeVisible()
    await expectAccessible()

    await login.github().click()
    await expect(page).toHaveURL(/\/dashboard$/)
    await expect(page.getByText('Olá, Marina!')).toBeVisible()

    const shell = new AppShell(page)
    const menu = await shell.openAccountMenu()
    await menu.getByRole('menuitem', { name: 'Sair' }).click()
    await expect(page).toHaveURL(/\/$/)
    await expect(page.getByRole('heading', { level: 1 })).toContainText(
      'Transforme o que você quer aprender',
    )
  })

  test('deslogado em /dashboard vai para /login e volta depois de entrar', async ({
    page,
    open,
  }) => {
    await open('/schedule')
    await expect(page).toHaveURL(/\/login\?redirect=%2Fschedule/)
    await new LoginPage(page).github().click()
    await expect(page).toHaveURL(/\/schedule(\?|$)/)
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Agenda')
  })

  test('autorização cancelada mostra o erro', async ({ page, open }) => {
    await open('/login?error=access_denied')
    await expect(new LoginPage(page).error()).toContainText(
      'a autorização foi cancelada no GitHub',
    )
  })

  test('redirect para fora do app é ignorado', async ({ page, open }) => {
    await open('/login?redirect=//evil.example')
    await new LoginPage(page).github().click()
    await expect(page).toHaveURL(/\/dashboard$/)
  })
})

test.describe('login com sessão', () => {
  test('quem já entrou vai direto para o app', async ({ page, open }) => {
    await open('/login')
    await expect(page).toHaveURL(/\/dashboard$/)
  })
})
