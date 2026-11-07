import type { Meta, StoryObj } from '@storybook/react-vite'
import { toast } from 'sonner'
import { expect, screen, userEvent, waitFor, within } from 'storybook/test'
import { Button } from '@/components/ui/button'
import { AppToaster } from './AppToaster'

const meta = {
  title: 'Produto/Toast',
  component: AppToaster,
  parameters: { layout: 'centered' },
  render: () => (
    <>
      <Button onClick={() => toast.success('Sessão registrada')}>
        Registrar
      </Button>
      <AppToaster />
    </>
  ),
} satisfies Meta<typeof AppToaster>

export default meta
type Story = StoryObj<typeof meta>

export const Confirmacao: Story = {
  play: async ({ canvasElement }) => {
    await userEvent.click(
      within(canvasElement).getByRole('button', { name: 'Registrar' }),
    )
    const title = await screen.findByText('Sessão registrada')
    await waitFor(() => expect(title).toBeVisible(), { timeout: 3000 })
  },
}
