import { expect, test } from './fixtures'

const CYCLE = `{
  "nome": "Ciclo",
  "modulos": [
    { "titulo": "A", "depoisDe": "B", "topicos": ["um"] },
    { "titulo": "B", "depoisDe": "A", "topicos": ["dois"] }
  ]
}`

test.describe('criador de roadmap', () => {
  test('cria um roadmap com 2 módulos e 3 tópicos', async ({
    page,
    open,
    expectAccessible,
  }) => {
    await open('/roadmaps/new')
    await expectAccessible()
    await page.getByLabel('Nome do roadmap (obrigatório)').fill('Inglês')
    await page.getByLabel('Nome do módulo 1').fill('Gramática')
    await page.keyboard.press('Enter')
    await page.keyboard.type('Verbos')
    await page.keyboard.press('Enter')
    await page.keyboard.type('Tempos')
    await page.getByRole('button', { name: 'Adicionar módulo' }).click()
    await page.keyboard.type('Conversação')
    await page.keyboard.press('Enter')
    await page.keyboard.type('Diálogos')
    await expect(page.getByRole('region', { name: 'Resumo' })).toContainText(
      /módulos\s*2.*tópicos\s*3/,
    )
    await page.getByRole('button', { name: 'Criar roadmap' }).click()
    await expect(page).toHaveURL(/\/roadmaps\/\d+(\?|$)/)
    await expect(page.getByText('Roadmap “Inglês” criado')).toBeVisible()

    await page
      .getByRole('navigation', { name: 'Principal' })
      .getByRole('link', { name: 'Meus roadmaps' })
      .click()
    const card = page.getByRole('article').filter({ hasText: 'Inglês' })
    await expect(card).toContainText('0 de 3 tópicos concluídos')
  })

  test('valida antes de salvar', async ({ page, open }) => {
    await open('/roadmaps/new')
    await page.getByRole('button', { name: 'Criar roadmap' }).click()
    await expect(page.getByText('Dê um nome ao roadmap')).toBeVisible()
    await expect(
      page.getByLabel('Nome do roadmap (obrigatório)'),
    ).toHaveAttribute('aria-invalid', 'true')
    await expect(page).toHaveURL(/\/roadmaps\/new(\?|$)/)
  })

  test('JSON com ciclo mostra o erro e não grava', async ({ page, open }) => {
    await open('/roadmaps/new')
    await page.getByRole('button', { name: 'Importar JSON' }).first().click()
    const dialog = page.getByRole('dialog', { name: 'Importar JSON' })
    await dialog.getByLabel('Ou cole o conteúdo').fill(CYCLE)
    await dialog.getByRole('button', { name: 'Importar' }).click()
    await expect(dialog.getByRole('alert')).toContainText('Cria um ciclo')
    await expect(dialog.getByRole('alert')).toContainText(/Linha \d+/)
    await dialog.getByRole('button', { name: 'Cancelar' }).click()
    const count = await page.evaluate(
      async () => (await (await fetch('/api/v1/roadmaps')).json()).length,
    )
    expect(count).toBe(3)
  })

  test('importa um exemplo para o editor e cria', async ({ page, open }) => {
    await open('/roadmaps/new')
    await page.getByRole('button', { name: 'Importar JSON' }).first().click()
    const dialog = page.getByRole('dialog', { name: 'Importar JSON' })
    await dialog.getByRole('button', { name: 'Usar um exemplo' }).click()
    await dialog.getByRole('button', { name: 'Importar' }).click()
    await expect(dialog).toBeHidden()
    await expect(
      page.getByText(/^Importei 4 módulos e 9 tópicos/),
    ).toBeVisible()
    await expect(page.getByLabel('Nome do roadmap (obrigatório)')).toHaveValue(
      'AWS para backend',
    )
    await page.getByRole('button', { name: 'Criar roadmap' }).click()
    await expect(page).toHaveURL(/\/roadmaps\/\d+(\?|$)/)
  })

  test('avisa ao sair com alterações não salvas', async ({ page, open }) => {
    await open('/roadmaps/new')
    await page.getByLabel('Nome do roadmap (obrigatório)').fill('Rascunho')
    await page
      .getByRole('navigation', { name: 'Principal' })
      .getByRole('link', { name: 'Painel' })
      .click()
    const dialog = page.getByRole('alertdialog', { name: 'Sair sem salvar?' })
    await expect(dialog).toBeVisible()
    await dialog.getByRole('button', { name: 'Continuar editando' }).click()
    await expect(page).toHaveURL(/\/roadmaps\/new(\?|$)/)
    await page
      .getByRole('navigation', { name: 'Principal' })
      .getByRole('link', { name: 'Painel' })
      .click()
    await page
      .getByRole('alertdialog')
      .getByRole('button', { name: 'Sair sem salvar' })
      .click()
    await expect(page).toHaveURL(/\/dashboard(\?|$)/)
  })

  test('sem rolagem lateral', async ({ page, open }) => {
    await open('/roadmaps/new')
    await expect(page.getByLabel('Nome do módulo 1')).toBeVisible()
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth - window.innerWidth,
      ),
    ).toBeLessThanOrEqual(0)
  })
})
