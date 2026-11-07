import { FAQ } from '../src/features/landing/content'
import { LandingPage } from './pages/LandingPage'
import { expect, test } from './fixtures'

test.describe('landing', () => {
  test.use({ scenario: 'deslogado' })

  test('abre com SSR, metadados e sem erros de acessibilidade', async ({
    page,
    open,
    expectAccessible,
  }) => {
    await open('/')
    const lp = new LandingPage(page)
    await expect(lp.heading()).toContainText(
      'Transforme o que você quer aprender em um plano.',
    )
    await expect(page).toHaveTitle(/Transforme o que você quer aprender/)
    await expect(page.locator('meta[property="og:title"]')).toHaveAttribute(
      'content',
      /Roadmaps/,
    )
    await expect(page.locator('meta[name="description"]')).toHaveAttribute(
      'content',
      /módulos e tópicos/,
    )
    await expectAccessible()
  })

  test('o HTML já vem renderizado do servidor', async ({ request }) => {
    const html = await (await request.get('/')).text()
    expect(html).toContain('Do “quero aprender” ao “aprendi” em quatro passos')
    expect(html).toContain('og:description')
  })

  test('âncoras do cabeçalho rolam até a seção abaixo do cabeçalho fixo', async ({
    page,
    open,
    isMobile,
  }) => {
    test.skip(isMobile, 'no celular o cabeçalho só tem o Entrar')
    await open('/')
    await new LandingPage(page)
      .anchors()
      .getByRole('link', { name: 'Perguntas' })
      .click()
    await expect(page).toHaveURL(/#perguntas$/)
    const heading = page.getByRole('heading', { name: 'Perguntas frequentes' })
    await expect(heading).toBeInViewport()
    await expect
      .poll(async () =>
        page
          .locator('#perguntas')
          .evaluate((el) => el.getBoundingClientRect().top),
      )
      .toBeGreaterThanOrEqual(60)
  })

  test('perguntas: uma aberta por vez', async ({ page, open }) => {
    await open('/')
    const lp = new LandingPage(page)
    await lp.faqQuestion(FAQ[2].q).click()
    await expect(page.getByText(FAQ[2].a)).toBeVisible()
    await lp.faqQuestion(FAQ[3].q).click()
    await expect(page.getByText(FAQ[3].a)).toBeVisible()
    await expect(lp.faqQuestion(FAQ[2].q)).toHaveAttribute(
      'aria-expanded',
      'false',
    )
  })

  test('Entrar leva para /login', async ({ page, open }) => {
    await open('/')
    await new LandingPage(page).enterButtons().first().click()
    await expect(page).toHaveURL(/\/login$/)
  })

  test('sem rolagem lateral', async ({ page, open }) => {
    await open('/')
    await expect(new LandingPage(page).heading()).toBeVisible()
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth,
    )
    expect(overflow).toBeLessThanOrEqual(0)
  })
})

test.describe('landing com sessão', () => {
  test('vai para a página inicial das preferências', async ({ page, open }) => {
    await open('/')
    await expect(page).toHaveURL(/\/dashboard$/)
  })
})
