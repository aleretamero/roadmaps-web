import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, screen, userEvent, waitFor, within } from 'storybook/test'
import { topicDetail } from '@/mocks/domain'
import { getDb, setScenario } from '@/mocks/state'
import { withRouter } from '@/test/StoryRouter'
import { TopicTimeline } from './TopicTimeline'

function topic(title: string) {
  setScenario('padrao')
  const db = getDb()
  return topicDetail(
    db,
    db.topics.find((t) => t.title === title)!,
  )
}

const meta = {
  title: 'Telas/Tópico/Linha do tempo',
  component: TopicTimeline,
  parameters: { layout: 'padded' },
  decorators: [withRouter('/topics/1')],
  args: { topic: topic('Índices'), today: '2026-11-07' },
} satisfies Meta<typeof TopicTimeline>

export default meta
type Story = StoryObj<typeof meta>

export const ComSessoes: Story = {
  play: async ({ canvasElement }) => {
    const c = within(canvasElement)
    const done = await c.findByRole('region', { name: 'O que você fez' })
    await waitFor(
      () =>
        expect(within(done).getAllByRole('listitem').length).toBeGreaterThan(1),
      { timeout: 3000 },
    )
    await userEvent.click(
      within(done).getAllByRole('button', { name: /^Ações da sessão/ })[0]!,
    )
    await userEvent.click(
      await screen.findByRole('menuitem', { name: 'Apagar sessão' }),
    )
    await expect(
      await screen.findByRole('alertdialog', { name: 'Apagar esta sessão?' }),
    ).toBeVisible()
  },
}

export const Vazia: Story = {
  args: { topic: topic('Docker Compose') },
  play: async ({ canvasElement }) => {
    const c = within(canvasElement)
    await expect(
      await c.findByText(/Nenhuma sessão registrada ainda/),
    ).toBeVisible()
  },
}

export const Carregando: Story = { parameters: { scenario: 'lento' } }

export const Erro: Story = {
  parameters: { scenario: 'erro-500' },
  play: async ({ canvasElement }) => {
    const c = within(canvasElement)
    await waitFor(() => expect(c.getAllByRole('alert').length).toBe(2), {
      timeout: 10000,
    })
  },
}

export const Celular: Story = { globals: { viewport: { value: 'mobile' } } }
