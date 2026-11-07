import { expect, test } from '@playwright/test'

/**
 * Fluxo completo contra a API real: entrar, criar roadmap, registrar sessão e
 * ver no painel. O login usa a rota de desenvolvimento do backend
 * (`E2E_LOGIN_PATH`, padrão `/api/v1/auth/dev-login`), porque o OAuth do GitHub
 * não dá para automatizar. `E2E_LOGIN_PATH=none` pula o login (para conferir o
 * roteiro contra o app com mock).
 */
const LOGIN = process.env.E2E_LOGIN_PATH ?? '/api/v1/auth/dev-login'

test('entrar, criar roadmap, registrar sessão e ver no painel', async ({
  page,
}) => {
  const name = `E2E ${Date.now()}`
  if (LOGIN === 'none') await page.goto('/roadmaps/new')
  else
    await page.goto(`${LOGIN}?redirect=${encodeURIComponent('/roadmaps/new')}`)
  await expect(page).toHaveURL(/\/roadmaps\/new/)

  await page.getByLabel('Nome do roadmap (obrigatório)').fill(name)
  await page.getByLabel('Nome do módulo 1').fill('Fundamentos')
  await page.keyboard.press('Enter')
  await page.keyboard.type('Primeiro tópico')
  await page.getByRole('button', { name: 'Criar roadmap' }).click()
  await expect(page.getByText(`Roadmap “${name}” criado`)).toBeVisible()
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(name)

  await page.getByRole('link', { name: 'Fundamentos', exact: true }).click()
  await page.getByRole('button', { name: 'Ações de Primeiro tópico' }).click()
  await page.getByRole('menuitem', { name: 'Registrar sessão' }).click()
  await page
    .getByRole('dialog', { name: 'Primeiro tópico' })
    .getByRole('button', { name: 'Salvar registro' })
    .click()
  await expect(page.getByText(/^Registrado hoje: estudei/)).toBeVisible()

  await page
    .getByRole('navigation', { name: 'Principal' })
    .getByRole('link', { name: 'Painel' })
    .click()
  await expect(page.getByRole('region', { name: 'Hoje' })).toContainText(
    'Primeiro tópico',
  )
})
