import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, within } from 'storybook/test'
import { getDb, setScenario } from '@/mocks/state'
import { ModuleTimeline } from './ModuleTimeline'

function moduleId(title: string) {
  setScenario('padrao')
  return getDb().modules.find((m) => m.title === title)!.id
}

/** Um módulo sem nenhuma sessão nos tópicos. */
function untouchedModule() {
  setScenario('padrao')
  const db = getDb()
  const worked = new Set(db.sessions.map((s) => s.topicId))
  return db.modules.find(
    (m) => !db.topics.some((t) => t.moduleId === m.id && worked.has(t.id)),
  )!.id
}

const meta = {
  title: 'Telas/Módulo/Linha do tempo',
  component: ModuleTimeline,
  parameters: { layout: 'padded' },
  args: { moduleId: moduleId('SQL Server') },
} satisfies Meta<typeof ModuleTimeline>

export default meta
type Story = StoryObj<typeof meta>

export const ComProgresso: Story = {
  play: async ({ canvasElement }) => {
    const c = within(canvasElement)
    await expect(
      await c.findByText('“Modelagem” concluído', {}, { timeout: 3000 }),
    ).toBeVisible()
  },
}

export const SemProgresso: Story = {
  args: { moduleId: untouchedModule() },
  play: async ({ canvasElement }) => {
    const c = within(canvasElement)
    await expect(
      await c.findByText(/Nenhum tópico começou ainda/, {}, { timeout: 3000 }),
    ).toBeVisible()
  },
}

export const Carregando: Story = { parameters: { scenario: 'lento' } }
