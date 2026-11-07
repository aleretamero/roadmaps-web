import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, within } from 'storybook/test'
import { withRouter } from '@/test/StoryRouter'
import { Breadcrumbs } from './Breadcrumbs'

const meta = {
  title: 'Produto/Breadcrumbs',
  component: Breadcrumbs,
  decorators: [withRouter('/modules/3')],
} satisfies Meta<typeof Breadcrumbs>

export default meta
type Story = StoryObj<typeof meta>

export const Modulo: Story = {
  args: {
    items: [
      { label: 'Meus roadmaps', link: { to: '/roadmaps' } },
      { label: 'Backend com .NET', link: { to: '/roadmaps' } },
      { label: 'C#' },
    ],
  },
  play: async ({ canvasElement }) => {
    const nav = within(
      await within(canvasElement).findByRole('navigation', {
        name: 'Localização',
      }),
    )
    await expect(nav.getAllByRole('link')).toHaveLength(2)
    await expect(nav.getByText('C#')).toHaveAttribute('aria-current', 'page')
  },
}

export const NomesCompridosNoCelular: Story = {
  globals: { viewport: { value: 'mobile' } },
  args: {
    items: [
      { label: 'Meus roadmaps', link: { to: '/roadmaps' } },
      {
        label: 'Arquitetura de sistemas distribuídos na prática',
        link: { to: '/roadmaps' },
      },
      { label: 'Mensageria com filas e tópicos' },
      { label: 'Consumidores idempotentes e reprocessamento' },
    ],
  },
}
