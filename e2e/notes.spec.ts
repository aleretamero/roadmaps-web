import type { Page } from '@playwright/test'
import { expect, test } from './fixtures'

async function openNotes(page: Page, open: (p: string) => Promise<void>) {
  await open('/roadmaps/101?mock-persist=1')
  await page.getByRole('link', { name: 'SQL Server', exact: true }).click()
  await page.getByRole('link', { name: 'Índices', exact: true }).first().click()
  await page.getByRole('tab', { name: /Anotações/ }).click()
  return Number(new URL(page.url()).pathname.split('/').at(-1))
}

/** Chama a API mockada de dentro da página (o MSW responde). */
const api = (page: Page, method: string, path: string, body?: unknown) =>
  page.evaluate(
    async ({ m, p, b }) => {
      const r = await fetch(`/api/v1${p}`, {
        method: m,
        headers: { 'Content-Type': 'application/json' },
        body: b === undefined ? undefined : JSON.stringify(b),
      })
      return r.status === 204 ? null : r.json()
    },
    { m: method, p: path, b: body },
  )

test.describe('anotações em Markdown', () => {
  test.afterEach(async ({ page }) => {
    await page.evaluate(() => localStorage.clear())
  })

  test('escrever com atalhos, publicar, recarregar e ver o mesmo conteúdo', async ({
    page,
    open,
    expectAccessible,
  }) => {
    await openNotes(page, open)
    const editor = page.getByRole('textbox', { name: 'Nova anotação' })
    await editor.click()
    await page.keyboard.type(
      '## Plano de execução\nUse **SET STATISTICS IO** sempre.\n- primeiro\nsegundo\n\n> cuidado com locks\n\n```sql\nSELECT 1;',
    )
    await expect(
      editor.getByRole('heading', { level: 2, name: 'Plano de execução' }),
    ).toBeVisible()
    await expect(editor.locator('pre code.language-sql')).toContainText(
      'SELECT 1;',
    )
    // Ctrl+Enter publica no teclado físico; no celular, o botão.
    if (test.info().project.name === 'mobile')
      await page.getByRole('button', { name: 'Publicar anotação' }).click()
    else await page.keyboard.press('Control+Enter')
    await expect(page.getByText('Anotação publicada')).toBeVisible()
    await expect(editor).toHaveText('')

    const published = page
      .getByRole('list', { name: 'Anotações publicadas' })
      .getByRole('listitem')
      .first()
    const check = async () => {
      await expect(
        published.getByRole('heading', { level: 2, name: 'Plano de execução' }),
      ).toBeVisible()
      await expect(
        published.locator('strong', { hasText: 'SET STATISTICS IO' }),
      ).toBeVisible()
      await expect(published.locator('ul > li')).toHaveText([
        'primeiro',
        'segundo',
      ])
      await expect(published.locator('blockquote')).toHaveText(
        'cuidado com locks',
      )
      await expect(
        published.locator('pre code.language-sql .hljs-keyword').first(),
      ).toHaveText('SELECT')
    }
    await check()
    await expectAccessible()
    await page.reload()
    await page.getByRole('tab', { name: /Anotações/ }).click()
    await check()
  })

  test('editar com aviso de conflito (412) e excluir', async ({
    page,
    open,
  }) => {
    const topicId = await openNotes(page, open)
    const notes = (await api(
      page,
      'GET',
      `/topics/${topicId}/notes`,
    )) as Array<{ id: number }>
    const id = notes[0]!.id
    await page.getByRole('button', { name: 'Editar anotação 1' }).click()
    const editor = page.getByRole('textbox', { name: 'Editar anotação 1' })
    await editor.press('End')
    await page.keyboard.type(' Editado aqui.')
    // Outra aba salva antes: a versão que esta tela tem fica velha.
    await api(page, 'PATCH', `/notes/${id}`, {
      content: 'Versão de outro lugar',
    })
    await page.getByRole('button', { name: 'Salvar', exact: true }).click()
    await expect(page.getByRole('alert')).toContainText(
      'Esta anotação mudou em outro lugar.',
    )
    await expect(editor).toContainText('Editado aqui.')
    await page.getByRole('button', { name: 'Ver a versão nova' }).click()
    const item = page
      .getByRole('list', { name: 'Anotações publicadas' })
      .getByRole('listitem')
      .first()
    await expect(item).toContainText('Versão de outro lugar')
    await expect(item).toContainText('editada')

    await page.getByRole('button', { name: 'Editar anotação 1' }).click()
    await page.getByRole('textbox', { name: 'Editar anotação 1' }).press('End')
    await page.keyboard.type(' e mais.')
    await page.getByRole('button', { name: 'Salvar', exact: true }).click()
    await expect(item).toContainText('Versão de outro lugar e mais.')

    await page.getByRole('button', { name: 'Excluir anotação 1' }).click()
    await page
      .getByRole('alertdialog')
      .getByRole('button', { name: 'Excluir' })
      .click()
    await expect(page.getByText('Anotação excluída')).toBeVisible()
    await expect(
      page.getByRole('list', { name: 'Anotações publicadas' }),
    ).toBeHidden()
  })

  test('HTML e links perigosos não passam para a tela', async ({
    page,
    open,
  }) => {
    const topicId = await openNotes(page, open)
    await api(page, 'POST', `/topics/${topicId}/notes`, {
      content:
        'Texto <img src="x" onerror="window.__xss = 1"> e [link](javascript:window.__xss=2) e <script>window.__xss=3</script> fim',
    })
    await page.reload()
    await page.getByRole('tab', { name: /Anotações/ }).click()
    const item = page
      .getByRole('list', { name: 'Anotações publicadas' })
      .getByRole('listitem')
      .first()
    await expect(item).toContainText('fim')
    await expect(item.locator('img, script, [onerror]')).toHaveCount(0)
    await expect(item.locator('a[href^="javascript"]')).toHaveCount(0)
    expect(
      await page.evaluate(() => (window as Window & { __xss?: number }).__xss),
    ).toBeUndefined()
  })
})
