import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, screen, userEvent, waitFor, within } from 'storybook/test'
import { InfoTooltip } from './InfoTooltip'

const meta = {
  title: 'Produto/InfoTooltip',
  component: InfoTooltip,
  args: {
    label: 'Atalhos do editor',
    children: (
      <>
        Use <code>#</code> para título, <code>-</code> para lista e{' '}
        <strong>Ctrl+Enter</strong> para publicar.
      </>
    ),
  },
} satisfies Meta<typeof InfoTooltip>

export default meta
type Story = StoryObj<typeof meta>

export const Fechado: Story = {}

export const Aberto: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(
      canvas.getByRole('button', { name: 'Atalhos do editor' }),
    )
    // O popover anima ao abrir: espera ficar visível.
    const text = await screen.findByText(/para publicar/)
    await waitFor(() => expect(text).toBeVisible(), { timeout: 3000 })
  },
}
