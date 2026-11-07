import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, userEvent, within } from 'storybook/test'
import { getDb, setScenario } from '@/mocks/state'
import { NotesPanel } from './NotesPanel'

function topicId(title: string) {
  setScenario('padrao')
  return getDb().topics.find((t) => t.title === title)!.id
}

const meta = {
  title: 'Componentes/Anotações',
  component: NotesPanel,
  parameters: { layout: 'padded' },
  args: { owner: { kind: 'topic', id: topicId('Índices') } },
} satisfies Meta<typeof NotesPanel>

export default meta
type Story = StoryObj<typeof meta>

export const ComAnotacoes: Story = {
  play: async ({ canvasElement }) => {
    const c = within(canvasElement)
    const list = await c.findByRole(
      'list',
      { name: 'Anotações publicadas' },
      { timeout: 3000 },
    )
    await expect(
      within(list).getByRole('article', { name: 'Anotação 1' }),
    ).toBeVisible()
    await expect(
      c.getByRole('button', { name: 'Publicar anotação' }),
    ).toBeDisabled()
  },
}

export const Escrevendo: Story = {
  args: { owner: { kind: 'topic', id: topicId('Docker Compose') } },
  play: async ({ canvasElement }) => {
    const c = within(canvasElement)
    const editor = await c.findByRole(
      'textbox',
      { name: 'Nova anotação' },
      { timeout: 3000 },
    )
    await userEvent.click(editor)
    await userEvent.keyboard('# Título{Enter}texto')
    await expect(
      within(editor).getByRole('heading', { level: 1, name: 'Título' }),
    ).toBeVisible()
    await userEvent.click(c.getByRole('button', { name: /^Negrito/ }))
    await expect(c.getByRole('button', { name: /^Negrito/ })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    await expect(
      c.getByRole('button', { name: 'Publicar anotação' }),
    ).toBeEnabled()
  },
}

export const Vazia: Story = {
  args: { owner: { kind: 'topic', id: topicId('Docker Compose') } },
}

export const DoModulo: Story = {
  args: {
    owner: {
      kind: 'module',
      id: (() => {
        setScenario('padrao')
        return getDb().modules.find((m) => m.title === 'SQL Server')!.id
      })(),
    },
  },
}

export const Carregando: Story = { parameters: { scenario: 'lento' } }

export const Erro: Story = {
  parameters: { scenario: 'erro-500' },
  play: async ({ canvasElement }) => {
    const c = within(canvasElement)
    await expect(
      await c.findByText(
        /Não foi possível carregar as anotações/,
        {},
        { timeout: 10000 },
      ),
    ).toBeVisible()
  },
}

export const Celular: Story = { globals: { viewport: { value: 'mobile' } } }
