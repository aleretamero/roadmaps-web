import { expect, test } from './fixtures'

test.describe('fumaça', () => {
  test('a API mockada responde dentro do app', async ({ page, open }) => {
    await open('/')
    const status = await page.evaluate(async () => {
      const res = await fetch('/api/v1/me')
      return [
        res.status,
        ((await res.json()) as { name: string }).name,
      ] as const
    })
    expect(status).toEqual([200, 'Marina Costa'])
  })

  test.describe('deslogado', () => {
    test.use({ scenario: 'deslogado' })
    test('o cenário deslogado responde 401', async ({ page, open }) => {
      await open('/')
      const status = await page.evaluate(
        async () => (await fetch('/api/v1/me')).status,
      )
      expect(status).toBe(401)
    })
  })

  test('o relógio dos testes é fixo', async ({ page, open }) => {
    await open('/')
    const today = await page.evaluate(() => new Date().toISOString())
    expect(today).toBe('2026-11-07T13:00:00.000Z')
  })
})

test.describe('fumaça do fluxo principal', () => {
  test.use({ scenario: 'deslogado' })
  test('landing → login → painel', async ({ page, open }) => {
    await open('/')
    await page
      .getByRole('link', { name: /^Entrar/ })
      .first()
      .click()
    await page.getByRole('button', { name: 'Continuar com GitHub' }).click()
    await expect(page).toHaveURL(/\/dashboard$/)
    await expect(
      page.getByRole('navigation', { name: 'Principal' }),
    ).toBeVisible()
  })
})
