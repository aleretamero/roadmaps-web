import { expect, test } from './fixtures'

test.describe('referências do tópico', () => {
  test('adicionar, editar e remover', async ({
    page,
    open,
    expectAccessible,
  }) => {
    await open('/roadmaps/101')
    await page.getByRole('link', { name: 'Docker', exact: true }).click()
    await page
      .getByRole('link', { name: 'Docker Compose', exact: true })
      .first()
      .click()
    await page.getByRole('tab', { name: /Referências/ }).click()
    const panel = page.getByRole('region', { name: 'Referências' })
    await expect(panel).toContainText('Nenhuma referência ainda')

    const url = panel.getByLabel('Link da referência')
    await url.fill('javascript:alert(1)')
    await panel.getByRole('button', { name: 'Adicionar' }).click()
    await expect(panel.getByRole('alert')).toContainText(
      'Cole um link completo',
    )

    await url.fill('youtube.com/watch-docker-compose')
    await url.press('Enter')
    await expect(page.getByText(/^Referência adicionada:/)).toBeVisible()
    const link = panel.getByRole('link', { name: /Watch docker compose/ })
    await expect(link).toHaveAttribute(
      'href',
      'https://youtube.com/watch-docker-compose',
    )
    await expect(link).toHaveAttribute('target', '_blank')
    await expect(link).toHaveAttribute('rel', /noopener/)
    await expect(panel).toContainText('Vídeo · youtube.com')
    await expect(url).toHaveValue('')

    await url.fill('https://youtube.com/watch-docker-compose')
    await url.press('Enter')
    await expect(panel.getByRole('alert')).toContainText(
      'Esse link já está nas referências.',
    )
    await url.fill('')
    await expectAccessible()

    await panel
      .getByRole('button', { name: /^Editar Watch docker compose/ })
      .click()
    const title = panel.getByLabel('Título')
    await expect(title).toBeFocused()
    await title.fill('Docker Compose em 10 minutos')
    await panel.getByLabel('Tipo').selectOption('course')
    await panel.getByRole('button', { name: 'Salvar' }).click()
    await expect(page.getByText('Referência atualizada')).toBeVisible()
    await expect(
      panel.getByRole('link', { name: /Docker Compose em 10 minutos/ }),
    ).toBeVisible()
    await expect(panel).toContainText('Curso · youtube.com')

    await panel
      .getByRole('button', { name: 'Remover Docker Compose em 10 minutos' })
      .click()
    await panel
      .getByRole('button', {
        name: 'Confirmar remoção de Docker Compose em 10 minutos',
      })
      .click()
    await expect(
      page.getByText('Referência removida: Docker Compose em 10 minutos'),
    ).toBeVisible()
    await expect(panel).toContainText('Nenhuma referência ainda')
  })
})
