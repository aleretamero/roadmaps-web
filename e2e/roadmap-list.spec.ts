import type { Page } from '@playwright/test'
import { expect, test } from './fixtures'

const topicsOf = (page: Page, module: string) =>
  page.getByRole('list', { name: `Tópicos de ${module}` }).getByRole('listitem')

test.describe('lista do roadmap', () => {
  test('mover tópico entre módulos persiste depois de recarregar', async ({
    page,
    open,
  }) => {
    await open('/roadmaps/101?view=list&mock-persist=1')
    await expect(topicsOf(page, 'C#')).toHaveCount(3)
    const link = page.getByRole('link', {
      name: 'Programação assíncrona',
      exact: true,
    })
    await link.focus()
    await page.keyboard.press('Alt+ArrowDown')
    await expect(topicsOf(page, 'SQL Server').first()).toContainText(
      'Programação assíncrona',
    )
    await expect(topicsOf(page, 'C#')).toHaveCount(2)
    await expect(
      page.getByRole('link', { name: 'Programação assíncrona', exact: true }),
    ).toBeFocused()
    // espera a API (mock) gravar antes de recarregar
    await expect
      .poll(() =>
        page.evaluate(
          () => localStorage.getItem('roadmaps-mock-db')?.length ?? 0,
        ),
      )
      .toBeGreaterThan(0)
    await page.reload()
    await expect(topicsOf(page, 'SQL Server').first()).toContainText(
      'Programação assíncrona',
    )
    await expect(topicsOf(page, 'C#')).toHaveCount(2)
  })

  test('arrastar um tópico para outro módulo com o mouse', async ({
    page,
    open,
    isMobile,
  }) => {
    test.skip(isMobile, 'arrasto com mouse só no desktop')
    await open('/roadmaps/101?view=list')
    const handle = page.getByRole('button', { name: 'Arrastar LINQ' })
    const target = topicsOf(page, 'Docker').nth(1)
    const a = (await handle.boundingBox())!
    const b = (await target.boundingBox())!
    await page.mouse.move(a.x + a.width / 2, a.y + a.height / 2)
    await page.mouse.down()
    await page.mouse.move(a.x + 10, a.y + 20, { steps: 5 })
    await page.mouse.move(b.x + 40, b.y + b.height / 2, { steps: 20 })
    await page.mouse.up()
    await expect(topicsOf(page, 'Docker')).toHaveCount(4)
    await expect(topicsOf(page, 'C#')).toHaveCount(2)
  })

  test('reordenar módulos pelo teclado e menus ⋯', async ({
    page,
    open,
    expectAccessible,
  }) => {
    await open('/roadmaps/101?view=list')
    await expectAccessible()
    await page.getByRole('button', { name: /^01 C#/ }).focus()
    await page.keyboard.press('Alt+ArrowDown')
    await expect(
      page.getByRole('region', { name: /^Módulo / }).first(),
    ).toHaveAccessibleName('Módulo SQL Server')

    await page.getByRole('button', { name: 'Ações de Índices' }).click()
    const menu = page.getByRole('menu')
    await expect(menu.getByRole('menuitem')).toHaveText([
      'Registrar sessão',
      'Editar tópico',
    ])
    await page.keyboard.press('ArrowDown')
    await page.keyboard.press('ArrowDown')
    await expect(
      menu.getByRole('menuitem', { name: 'Editar tópico' }),
    ).toBeFocused()
    await page.keyboard.press('Escape')
    await expect(menu).toBeHidden()

    await page.getByRole('button', { name: 'Ações de Índices' }).click()
    await page.getByRole('menuitem', { name: 'Registrar sessão' }).click()
    await expect(page.getByRole('dialog', { name: 'Índices' })).toBeVisible()
  })

  test('clique no nome abre o tópico e recolher esconde a lista', async ({
    page,
    open,
  }) => {
    await open('/roadmaps/101?view=list')
    await page.getByRole('button', { name: /^03 Docker/ }).click()
    await expect(
      page.getByRole('list', { name: 'Tópicos de Docker' }),
    ).toHaveCount(0)
    await page.getByRole('link', { name: 'LINQ', exact: true }).click()
    await expect(page).toHaveURL(/\/topics\/\d+$/)
  })
})
