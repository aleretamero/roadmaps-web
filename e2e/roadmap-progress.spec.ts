import { expect, test } from './fixtures'

test.describe('aba Progresso', () => {
  test('barra por etapa, módulos em andamento e Registrar', async ({
    page,
    open,
    expectAccessible,
  }) => {
    await open('/roadmaps/101?tab=progress')
    await expect(
      page.getByRole('img', {
        name: /^Tópicos por etapa: Concluído 4, Praticando 1, Estudando 2, Planejado 2$/,
      }),
    ).toBeVisible()
    await expect(
      page.getByRole('heading', { name: /^Em andamento/ }),
    ).toContainText('Roadmap iniciado em')
    await expectAccessible()
    await page
      .getByRole('button', { name: 'Registrar sessão em Índices' })
      .click()
    await expect(page.getByRole('dialog', { name: 'Índices' })).toBeVisible()
  })

  test('comparação visual com o protótipo', async ({
    page,
    open,
    isMobile,
  }) => {
    test.skip(isMobile, 'a captura de referência da aba é só desktop')
    await open('/roadmaps/101?tab=progress')
    await expect(
      page.getByRole('heading', { name: /^Em andamento/ }),
    ).toBeVisible()
    await expect(page.locator('main')).toHaveScreenshot('progresso.png')
  })

  test('alternativa não escolhida aparece no grupo próprio', async ({
    page,
    open,
  }) => {
    await open('/roadmaps/131?tab=progress')
    await expect(
      page.getByRole('region', { name: 'Caminhos não escolhidos' }),
    ).toContainText('Angular')
  })
})
