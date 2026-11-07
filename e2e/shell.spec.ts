import { AppShell } from './pages/AppShell'
import { expect, test } from './fixtures'

test.describe('shell do app', () => {
  test('cabeçalho com navegação ativa e acessível', async ({
    page,
    open,
    expectAccessible,
  }) => {
    await open('/dashboard')
    const shell = new AppShell(page)
    await expect(shell.navLink('Painel')).toHaveAttribute(
      'aria-current',
      'page',
    )
    await expect(shell.accountButton()).toHaveAccessibleName(
      'Conta de Marina Costa',
    )
    await expectAccessible()

    await shell.navLink('Meus roadmaps').click()
    await expect(page).toHaveURL(/\/roadmaps$/)
    await expect(shell.navLink('Meus roadmaps')).toHaveAttribute(
      'aria-current',
      'page',
    )
    await shell.navLink('Agenda').click()
    await expect(page).toHaveURL(/\/schedule$/)
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Agenda')
  })

  test('menu da conta: Configurações e Sair', async ({ page, open }) => {
    await open('/dashboard')
    const shell = new AppShell(page)
    let menu = await shell.openAccountMenu()
    await menu.getByRole('menuitem', { name: 'Configurações' }).click()
    await expect(page).toHaveURL(/\/settings\/account$/)

    menu = await shell.openAccountMenu()
    await menu.getByRole('menuitem', { name: 'Sair' }).click()
    await expect(page).toHaveURL(/\/$/)
    const status = await page.evaluate(
      async () => (await fetch('/api/v1/me')).status,
    )
    expect(status).toBe(401)
  })

  test('teclado: pular para o conteúdo e abrir o menu', async ({
    page,
    open,
  }) => {
    await open('/dashboard')
    const shell = new AppShell(page)
    await expect(shell.nav()).toBeVisible()
    await page.keyboard.press('Tab')
    await expect(
      page.getByRole('link', { name: 'Pular para o conteúdo' }),
    ).toBeFocused()
    await shell.accountButton().focus()
    await page.keyboard.press('Enter')
    await expect(
      page.getByRole('menuitem', { name: 'Configurações' }),
    ).toBeFocused()
    await page.keyboard.press('Escape')
    await expect(page.getByRole('menu')).toBeHidden()
  })

  test('endereço que não existe mostra a página 404', async ({
    page,
    open,
    expectAccessible,
  }) => {
    await open('/nao-existe')
    await expect(
      page.getByRole('heading', { name: 'Página não encontrada' }),
    ).toBeVisible()
    await expectAccessible()
  })

  test('sem rolagem lateral', async ({ page, open }) => {
    await open('/dashboard')
    await expect(new AppShell(page).nav()).toBeVisible()
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth,
    )
    expect(overflow).toBeLessThanOrEqual(0)
  })

  test.describe('erro da API', () => {
    test.use({ scenario: 'erro-500' })
    test('mostra o erro com "Tentar de novo"', async ({ page, open }) => {
      await open('/dashboard')
      await expect(page.getByRole('alert')).toContainText(
        'Não foi possível carregar esta página',
      )
      await expect(
        page.getByRole('button', { name: 'Tentar de novo' }),
      ).toBeVisible()
    })
  })

  test.describe('deslogado', () => {
    test.use({ scenario: 'deslogado' })
    test('/dashboard manda para /login com o redirect', async ({
      page,
      open,
    }) => {
      await open('/dashboard')
      await expect(page).toHaveURL(/\/login\?redirect=/)
      const redirect = new URL(page.url()).searchParams.get('redirect')
      expect(redirect).toMatch(/^\/dashboard/)
      await expect(page.getByRole('heading', { name: 'Entrar' })).toBeVisible()
    })
  })
})
