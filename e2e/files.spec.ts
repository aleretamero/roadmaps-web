import type { Page } from '@playwright/test'
import { expect, test } from './fixtures'

async function openFiles(page: Page, open: (p: string) => Promise<void>) {
  await open('/roadmaps/101')
  await page.getByRole('link', { name: 'SQL Server', exact: true }).click()
  await page.getByRole('link', { name: 'Índices', exact: true }).first().click()
  await page.getByRole('tab', { name: /Arquivos/ }).click()
}

// PNG 1×1 transparente.
const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
  'base64',
)

test.describe('arquivos do tópico', () => {
  test.describe('sem Drive', () => {
    test.use({ scenario: 'sem-drive' })
    test('mostra o aviso e leva para Integrações com volta', async ({
      page,
      open,
      expectAccessible,
    }) => {
      await openFiles(page, open)
      await expect(
        page.getByRole('heading', {
          name: 'Conecte o Google Drive para guardar arquivos',
        }),
      ).toBeVisible()
      await expect(page.getByRole('tree')).toHaveCount(0)
      await expectAccessible()
      await page.getByRole('link', { name: 'Conectar Google Drive' }).click()
      await expect(page).toHaveURL(
        /\/settings\/integrations\?returnTo=%2Ftopics%2F\d+%3Ftab%3Dfiles/,
      )
    })
  })

  test.describe('com Drive', () => {
    test.use({ scenario: 'com-drive' })

    test('árvore pelo teclado e pré-visualização de texto', async ({
      page,
      open,
      expectAccessible,
    }) => {
      await openFiles(page, open)
      const tree = page.getByRole('tree', { name: 'Arquivos do tópico' })
      const folder = tree.getByRole('treeitem', { name: 'Pasta scripts' })
      await folder.focus()
      await page.keyboard.press('ArrowRight')
      await expect(folder).toHaveAttribute('aria-expanded', 'true')
      await page.keyboard.press('ArrowDown')
      const file = tree.getByRole('treeitem', { name: /^indices\.sql/ })
      await expect(file).toBeFocused()
      await page.keyboard.press('Enter')
      await expect(page.getByLabel('Conteúdo de indices.sql')).toContainText(
        'CREATE INDEX',
      )
      await page.keyboard.press('ArrowLeft')
      await expect(folder).toBeFocused()
      await page.keyboard.press('ArrowLeft')
      await expect(folder).toHaveAttribute('aria-expanded', 'false')
      await expectAccessible()
    })

    test('nova pasta, enviar com progresso, imagem, renomear, mover e apagar', async ({
      page,
      open,
    }) => {
      await openFiles(page, open)
      const tree = page.getByRole('tree', { name: 'Arquivos do tópico' })

      await page.getByRole('button', { name: 'Nova pasta' }).click()
      await page
        .getByLabel('Nome da nova pasta em raiz do tópico')
        .fill('imagens')
      await page.keyboard.press('Enter')
      const imagens = tree.getByRole('treeitem', { name: 'Pasta imagens' })
      await expect(imagens).toHaveAttribute('aria-selected', 'true')

      // Com a pasta selecionada, o envio vai para ela.
      await page.locator('#fs-files').setInputFiles([
        { name: 'diagrama.png', mimeType: 'image/png', buffer: PNG },
        {
          name: 'grande.bin',
          mimeType: 'application/octet-stream',
          buffer: Buffer.alloc(21 * 1024 * 1024),
        },
      ])
      await expect(page.getByRole('list', { name: 'Envios' })).toContainText(
        'maior que 20 MB',
      )
      const png = tree.getByRole('treeitem', { name: /^diagrama\.png/ })
      await expect(png).toBeVisible()
      await png.click()
      await expect(
        page.getByRole('img', { name: 'Pré-visualização de diagrama.png' }),
      ).toBeVisible()

      await png.focus()
      await page.keyboard.press('F2')
      await page.getByLabel('Novo nome de diagrama.png').fill('modelo.png')
      await page.keyboard.press('Enter')
      const modelo = tree.getByRole('treeitem', { name: /^modelo\.png/ })
      await expect(modelo).toBeVisible()

      await modelo.click()
      await page.getByRole('button', { name: 'Mover' }).click()
      const dialog = page.getByRole('dialog', { name: 'Mover “modelo.png”' })
      await dialog.getByLabel('Para a pasta').selectOption('scripts')
      await dialog.getByRole('button', { name: 'Mover' }).click()
      await expect(
        page.getByText('Movido para scripts', { exact: true }),
      ).toBeVisible()
      await expect(
        tree.getByRole('treeitem', { name: 'Pasta scripts' }),
      ).toHaveAttribute('aria-expanded', 'true')

      await tree.getByRole('treeitem', { name: /^modelo\.png/ }).focus()
      await page.keyboard.press('Delete')
      await page
        .getByRole('alertdialog')
        .getByRole('button', { name: 'Apagar' })
        .click()
      await expect(
        page.getByText('“modelo.png” apagado', { exact: true }),
      ).toBeVisible()
      await expect(
        tree.getByRole('treeitem', { name: /^modelo\.png/ }),
      ).toHaveCount(0)
    })
  })
})
