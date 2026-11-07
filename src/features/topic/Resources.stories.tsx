import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, userEvent, within } from 'storybook/test'
import { getDb, setScenario } from '@/mocks/state'
import { ResourcesPanel } from './ResourcesPanel'

function topicId(title: string) {
  setScenario('padrao')
  return getDb().topics.find((t) => t.title === title)!.id
}

const meta = {
  title: 'Telas/Tópico/Referências',
  component: ResourcesPanel,
  parameters: { layout: 'padded' },
  args: { topicId: topicId('Índices') },
} satisfies Meta<typeof ResourcesPanel>

export default meta
type Story = StoryObj<typeof meta>

export const ComLinks: Story = {
  play: async ({ canvasElement }) => {
    const c = within(canvasElement)
    const list = await c.findByRole(
      'list',
      { name: 'Links de estudo' },
      { timeout: 3000 },
    )
    await expect(within(list).getAllByRole('link')[0]).toHaveAttribute(
      'rel',
      'noopener noreferrer',
    )
  },
}

export const Vazia: Story = {
  args: { topicId: topicId('Docker Compose') },
  play: async ({ canvasElement }) => {
    const c = within(canvasElement)
    await expect(
      await c.findByText(/Nenhuma referência ainda/, {}, { timeout: 3000 }),
    ).toBeVisible()
  },
}

export const LinkInvalido: Story = {
  args: { topicId: topicId('Docker Compose') },
  play: async ({ canvasElement }) => {
    const c = within(canvasElement)
    await userEvent.type(
      c.getByLabelText('Link da referência'),
      'não é link{Enter}',
    )
    await expect(await c.findByRole('alert')).toHaveTextContent(
      'Cole um link completo',
    )
  },
}

export const Carregando: Story = { parameters: { scenario: 'lento' } }

export const Erro: Story = {
  parameters: { scenario: 'erro-500' },
  play: async ({ canvasElement }) => {
    const c = within(canvasElement)
    await expect(
      await c.findByText(
        /Não foi possível carregar as referências/,
        {},
        { timeout: 10000 },
      ),
    ).toBeVisible()
  },
}

export const Celular: Story = { globals: { viewport: { value: 'mobile' } } }
