import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, userEvent, waitFor, within } from 'storybook/test'
import { withRouter } from '@/test/StoryRouter'
import { FAQ } from './content'
import { LandingPage } from './LandingPage'
import { MapPreview, SessionPreview, WeekPreview } from './previews'

const meta = {
  title: 'Telas/Landing',
  component: LandingPage,
  parameters: { layout: 'fullscreen' },
  decorators: [withRouter('/')],
} satisfies Meta<typeof LandingPage>

export default meta
type Story = StoryObj<typeof meta>

export const Desktop: Story = {
  play: async ({ canvasElement }) => {
    const c = within(canvasElement)
    await expect(await c.findByRole('heading', { level: 1 })).toHaveTextContent(
      'Transforme o que você quer aprender em um plano.',
    )
    for (const link of c.getAllByRole('link', { name: /^Entrar/ }))
      await expect(link).toHaveAttribute('href', '/login')
  },
}

export const Celular: Story = {
  globals: { viewport: { value: 'mobile' } },
}

/** Perguntas: abre uma por vez. */
export const Perguntas: Story = {
  play: async ({ canvasElement }) => {
    const c = within(canvasElement)
    const first = await c.findByRole('button', { name: FAQ[0].q })
    const second = c.getByRole('button', { name: FAQ[1].q })
    await userEvent.click(first)
    await expect(first).toHaveAttribute('aria-expanded', 'true')
    await waitFor(() => expect(c.getByText(FAQ[0].a)).toBeVisible())
    await userEvent.click(second)
    await expect(second).toHaveAttribute('aria-expanded', 'true')
    await expect(first).toHaveAttribute('aria-expanded', 'false')
  },
}

export const Previas: StoryObj = {
  render: () => (
    <div className="grid max-w-3xl gap-6 p-6">
      <MapPreview shadow />
      <SessionPreview />
      <WeekPreview shadow />
    </div>
  ),
}
