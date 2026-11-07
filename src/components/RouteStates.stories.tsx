import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, within } from 'storybook/test'
import { ApiError } from '@/lib/api/errors'
import { withRouter } from '@/test/StoryRouter'
import { NotFound, PagePending, RouteError } from './RouteStates'

const meta = {
  title: 'App/Estados de rota',
  parameters: { layout: 'fullscreen' },
  decorators: [withRouter('/dashboard')],
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

export const Carregando: Story = {
  render: () => <PagePending />,
  play: async ({ canvasElement }) => {
    await expect(
      await within(canvasElement).findByRole('status', { name: 'Carregando' }),
    ).toBeVisible()
  },
}

export const Erro: Story = {
  render: () => <RouteError error={new ApiError(500)} reset={() => {}} />,
  play: async ({ canvasElement }) => {
    const c = within(canvasElement)
    await expect(await c.findByRole('alert')).toBeVisible()
    await expect(
      c.getByRole('button', { name: 'Tentar de novo' }),
    ).toBeEnabled()
  },
}

export const NaoEncontrado: Story = {
  render: () => <NotFound />,
  play: async ({ canvasElement }) => {
    await expect(
      await within(canvasElement).findByRole('link', {
        name: 'Ir para o painel',
      }),
    ).toHaveAttribute('href', '/dashboard')
  },
}
