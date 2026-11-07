import type { Page } from '@playwright/test'
import { expect, test } from './fixtures'

async function openRoadmap(
  page: Page,
  open: (p: string) => Promise<void>,
  name: string,
) {
  await open('/roadmaps')
  await page.getByRole('link', { name, exact: true }).click()
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(name)
}

test.describe('mapa do roadmap', () => {
  test('módulos e tópicos pela etapa; teclado abre o módulo', async ({
    page,
    open,
    expectAccessible,
    isMobile,
  }) => {
    await openRoadmap(page, open, 'Backend com .NET')
    const map = page.getByRole('list', { name: 'Legenda do mapa' })
    await expect(map).toBeVisible()
    await expect(
      page.getByRole('link', { name: 'Índices', exact: true }),
    ).toHaveAccessibleDescription('Praticando')
    if (!isMobile) await expectAccessible()

    const mod = page.getByRole('link', { name: 'C#', exact: true })
    await mod.focus()
    await page.keyboard.press('Tab')
    await expect(
      page.getByRole('link', { name: 'Collections', exact: true }),
    ).toBeFocused()
    await mod.focus()
    await page.keyboard.press('Enter')
    await expect(page).toHaveURL(/\/modules\/\d+$/)
  })

  test('escolher o outro caminho na divisão', async ({ page, open }) => {
    await openRoadmap(page, open, 'Frontend')
    await expect(
      page.getByRole('button', { name: 'Meu caminho' }),
    ).toHaveAttribute('aria-pressed', 'true')
    await page.getByRole('button', { name: 'Seguir este caminho' }).click()
    await expect(page.getByText('Caminho escolhido')).toBeVisible()
    await expect(
      page.getByRole('link', { name: 'React', exact: true }),
    ).toHaveAccessibleDescription(/caminho não escolhido/)
    await expect(
      page.getByRole('link', { name: 'Angular', exact: true }),
    ).not.toHaveAccessibleDescription(/caminho não escolhido/)
  })

  test('Mapa / Lista e abas ficam na URL', async ({ page, open }) => {
    await openRoadmap(page, open, 'Backend com .NET')
    const views = page.getByRole('navigation', { name: 'Modo de visualização' })
    await views.getByRole('link', { name: 'Lista' }).click()
    await expect(page).toHaveURL(/\?view=list$/)
    await expect(views.getByRole('link', { name: 'Lista' })).toHaveAttribute(
      'aria-current',
      'page',
    )
    await page.reload()
    await expect(
      page
        .getByRole('navigation', { name: 'Modo de visualização' })
        .getByRole('link', { name: 'Lista' }),
    ).toHaveAttribute('aria-current', 'page')
  })

  test('sem rolagem lateral da página (o mapa rola dentro do quadro)', async ({
    page,
    open,
  }) => {
    await openRoadmap(page, open, 'Frontend')
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth - window.innerWidth,
      ),
    ).toBeLessThanOrEqual(0)
  })
})
