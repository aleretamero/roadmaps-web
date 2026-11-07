import type { Meta, StoryObj } from '@storybook/react-vite'
import { MoreHorizontal, Pause, Play } from 'lucide-react'
import { expect, userEvent, within } from 'storybook/test'
import { IconButton } from './IconButton'

const meta = {
  title: 'Produto/IconButton',
  component: IconButton,
  args: { label: 'Ações do tópico', children: <MoreHorizontal /> },
} satisfies Meta<typeof IconButton>

export default meta
type Story = StoryObj<typeof meta>

export const Menu: Story = {}

export const PlayRedondo: Story = {
  args: {
    label: 'Iniciar',
    round: true,
    variant: 'outline',
    children: <Play />,
  },
}

export const PausarGrande: Story = {
  args: {
    label: 'Pausar',
    round: true,
    variant: 'outline',
    size: 'lg',
    children: <Pause />,
  },
}

export const MostraTooltipNoFoco: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.tab()
    await expect(
      canvas.getByRole('button', { name: 'Ações do tópico' }),
    ).toHaveFocus()
  },
}
