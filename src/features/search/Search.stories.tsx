import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, screen, userEvent, waitFor, within } from 'storybook/test'
import { SearchDialog } from './SearchDialog'

const meta = {
  title: 'Telas/Busca',
  component: SearchDialog,
  args: { open: true, onOpenChange: fn(), onOpenResult: fn() },
} satisfies Meta<typeof SearchDialog>

export default meta
type Story = StoryObj<typeof meta>

const dialog = async () => {
  const d = await screen.findByRole('dialog')
  await waitFor(() => expect(d).toBeVisible(), { timeout: 3000 })
  return within(d)
}

export const Vazia: Story = {
  play: async () => {
    const d = await dialog()
    await expect(d.getByText(/Digite pelo menos duas letras/)).toBeVisible()
  },
}

export const ComResultados: Story = {
  play: async ({ args }) => {
    const d = await dialog()
    await userEvent.type(d.getByRole('combobox'), 'índices')
    await expect(
      await d.findByText(/do mais relevante/, {}, { timeout: 3000 }),
    ).toBeVisible()
    await userEvent.keyboard('{Enter}')
    await expect(args.onOpenResult).toHaveBeenCalled()
  },
}

export const SoArquivos: Story = {
  play: async () => {
    const d = await dialog()
    await userEvent.click(d.getByRole('button', { name: 'Arquivos' }))
    await userEvent.type(d.getByRole('combobox'), 'índices')
    const first = await d.findByRole('option', {}, { timeout: 3000 })
    await expect(first).toHaveTextContent('Arquivo em')
  },
}

export const SemResultados: Story = {
  play: async () => {
    const d = await dialog()
    await userEvent.type(d.getByRole('combobox'), 'xyzinexistente')
    await expect(
      await d.findByText(/Nenhum resultado/, {}, { timeout: 3000 }),
    ).toBeVisible()
  },
}

export const Erro: Story = {
  parameters: { scenario: 'erro-500' },
  play: async () => {
    const d = await dialog()
    await userEvent.type(d.getByRole('combobox'), 'índices')
    await expect(
      await d.findByText(/Não foi possível buscar/, {}, { timeout: 10000 }),
    ).toBeVisible()
  },
}

export const Celular: Story = { globals: { viewport: { value: 'mobile' } } }
