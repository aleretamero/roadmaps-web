import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, screen, userEvent, waitFor, within } from 'storybook/test'
import { AddTopicsDialog } from './AddTopicsDialog'

const meta = {
  title: 'Telas/Módulo/Adicionar tópicos',
  component: AddTopicsDialog,
  args: {
    open: true,
    onOpenChange: fn(),
    onSave: fn(),
    moduleTitle: 'SQL Server',
    roadmapName: 'Backend com .NET',
    existingTitles: ['Modelagem', 'Índices'],
  },
} satisfies Meta<typeof AddTopicsDialog>

export default meta
type Story = StoryObj<typeof meta>

export const Vazio: Story = {}

export const DigitandoVarios: Story = {
  play: async ({ args }) => {
    const dialog = await screen.findByRole('dialog')
    await waitFor(() => expect(dialog).toBeVisible(), { timeout: 3000 })
    const d = within(dialog)
    await userEvent.click(d.getByLabelText('Tópico 1'))
    await userEvent.keyboard('Views{Enter}Triggers')
    await expect(d.getByLabelText('Tópico 2')).toHaveValue('Triggers')
    await userEvent.click(
      d.getByRole('button', { name: 'Adicionar 2 tópicos' }),
    )
    await expect(args.onSave).toHaveBeenCalledWith([
      { title: 'Views', isOptional: false, date: null },
      { title: 'Triggers', isOptional: false, date: null },
    ])
  },
}

export const Repetido: Story = {
  play: async () => {
    const dialog = await screen.findByRole('dialog')
    await waitFor(() => expect(dialog).toBeVisible(), { timeout: 3000 })
    const d = within(dialog)
    await userEvent.type(d.getByLabelText('Tópico 1'), 'Índices')
    await userEvent.click(d.getByRole('button', { name: 'Adicionar 1 tópico' }))
    await expect(await d.findByRole('alert')).toHaveTextContent('já existe')
  },
}

export const ErroDaApi: Story = {
  args: { error: 'Algo deu errado do nosso lado. Tente de novo em instantes.' },
}
