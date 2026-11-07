import type { Locator } from '@playwright/test'
import { expect, test } from './fixtures'

async function previewDates(dialog: Locator) {
  const rows = dialog
    .getByRole('region', { name: 'Tópicos' })
    .getByRole('listitem')
  const out: Record<string, string> = {}
  for (const row of await rows.all()) {
    const title = (await row
      .locator('label > span')
      .first()
      .textContent())!.trim()
    out[title] = (await row.getByTestId('auto-date').textContent())!.trim()
  }
  return out
}

test.describe('agendar automaticamente', () => {
  test('a prévia e o resultado gravado mostram as mesmas datas', async ({
    page,
    open,
    expectAccessible,
  }) => {
    await open('/roadmaps/101')
    await page.getByRole('button', { name: 'Agendar automaticamente' }).click()
    const dialog = page.getByRole('dialog', { name: 'Agendar automaticamente' })
    await expect(page).toHaveURL(/auto=1/)
    await dialog.getByLabel('Reagendar os que já têm data').check()
    await expect(
      dialog.getByText(/^2 tópicos em 2 dias · termina/),
    ).toBeVisible()
    await expectAccessible()
    const before = await previewDates(dialog)
    expect(Object.keys(before)).toHaveLength(2)
    for (const d of Object.values(before))
      expect(d).toMatch(/^\w{3}, \d+ de \w+$/)

    await dialog.getByRole('button', { name: 'Agendar 2 tópicos' }).click()
    await expect(dialog).toBeHidden()
    await expect(page.getByText(/^2 tópicos agendados · /)).toBeVisible()
    await expect(page).not.toHaveURL(/auto=1/)

    // Reabrindo, cada tópico mostra a data gravada ("era …"), que é a da prévia.
    await page.getByRole('button', { name: 'Agendar automaticamente' }).click()
    await dialog.getByLabel('Reagendar os que já têm data').check()
    const rows = dialog
      .getByRole('region', { name: 'Tópicos' })
      .getByRole('listitem')
    for (const [title, date] of Object.entries(before)) {
      const short = date.replace(/^\w{3}, /, '')
      await expect(rows.filter({ hasText: title })).toContainText(
        `(era ${short})`,
      )
    }
  })

  test('desmarcar tópicos e dias explica o que fica de fora', async ({
    page,
    open,
  }) => {
    await open('/roadmaps/101?auto=1')
    const dialog = page.getByRole('dialog', { name: 'Agendar automaticamente' })
    await expect(dialog.getByText('1 de 1 selecionados')).toBeVisible()
    await expect(
      dialog.getByText(/^Ficaram de fora: .*concluídos/),
    ).toBeVisible()
    await dialog.getByLabel('Docker Compose').uncheck()
    await expect(dialog.getByText(/1 desmarcado\.$/)).toBeVisible()
    await expect(
      dialog.getByRole('button', { name: 'Nada para agendar' }),
    ).toBeDisabled()
    await dialog.getByLabel('Docker Compose').check()
    for (const day of [
      'Segunda-feira',
      'Terça-feira',
      'Quarta-feira',
      'Quinta-feira',
      'Sexta-feira',
    ])
      await dialog.getByRole('button', { name: day }).click()
    await expect(
      dialog.getByText('Escolha pelo menos um dia da semana.'),
    ).toBeVisible()
    await dialog.getByRole('button', { name: 'Sábado' }).click()
    await expect(
      dialog.getByText(/^1 tópico em 1 dia · termina sáb, 7 de nov$/),
    ).toBeVisible()
  })
})
