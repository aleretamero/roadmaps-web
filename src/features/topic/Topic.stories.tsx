import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, screen, userEvent, waitFor, within } from 'storybook/test'
import { topicDetail } from '@/mocks/domain'
import { getDb, setScenario } from '@/mocks/state'
import { withRouter } from '@/test/StoryRouter'
import { EditTopicDialog, ReopenStageDialog } from './TopicDialogs'
import { TopicPage } from './TopicPage'

function indices() {
  setScenario('padrao')
  const db = getDb()
  const t = db.topics.find((x) => x.title === 'Índices')!
  return topicDetail(db, t)
}

const meta = {
  title: 'Telas/Tópico',
  component: TopicPage,
  parameters: { layout: 'fullscreen' },
  decorators: [withRouter('/topics/1')],
  args: {
    topic: indices(),
    tab: 'timeline',
    onTabChange: fn(),
    onRegister: fn(),
    onEdit: fn(),
    onReopen: fn(),
    onAddDay: fn(),
    onRemoveDay: fn(),
  },
} satisfies Meta<typeof TopicPage>

export default meta
type Story = StoryObj<typeof meta>

export const Praticando: Story = {
  play: async ({ canvasElement, args }) => {
    const c = within(canvasElement)
    await expect(
      c.getByRole('listitem', { current: 'step' }),
    ).toHaveTextContent('Praticando')
    await userEvent.click(c.getByRole('button', { name: 'Registrar sessão' }))
    await expect(args.onRegister).toHaveBeenCalled()
    await userEvent.click(
      c.getByRole('button', { name: /^Tirar .* da agenda$/ }),
    )
    await expect(args.onRemoveDay).toHaveBeenCalled()
    await userEvent.click(c.getByRole('tab', { name: /Anotações/ }))
    await expect(args.onTabChange).toHaveBeenCalledWith('notes')
  },
}

export const Planejado: Story = {
  args: {
    topic: {
      ...indices(),
      stage: 'planned',
      stageDates: { studying: null, practicing: null, completed: null },
      lastSessionOn: null,
      scheduleEntries: [],
      counts: { sessions: 0, files: 0, resources: 0, notes: 0 },
    },
  },
  play: async ({ canvasElement }) => {
    const c = within(canvasElement)
    await expect(c.getByText('Nenhuma sessão registrada')).toBeVisible()
    await expect(c.getByText('Sem dia agendado')).toBeVisible()
    await expect(
      c.queryByRole('button', { name: 'Mais ações do tópico' }),
    ).toBeNull()
  },
}

export const Concluido: Story = {
  args: {
    topic: {
      ...indices(),
      stage: 'completed',
      stageDates: {
        studying: '2026-09-03',
        practicing: '2026-09-06',
        completed: '2026-11-05',
      },
      scheduleEntries: [],
    },
  },
}

export const Celular: Story = { globals: { viewport: { value: 'mobile' } } }

export const Editar: StoryObj<typeof EditTopicDialog> = {
  render: () => (
    <EditTopicDialog
      open
      onOpenChange={fn()}
      initial={{ title: 'Índices', description: '', isOptional: false }}
      onSave={fn()}
    />
  ),
  play: async () => {
    const dialog = await screen.findByRole('dialog')
    await waitFor(() => expect(dialog).toBeVisible(), { timeout: 3000 })
    await userEvent.clear(within(dialog).getByLabelText('Título'))
    await userEvent.click(
      within(dialog).getByRole('button', { name: 'Salvar' }),
    )
    await expect(
      await within(dialog).findByText('Dê um nome ao tópico'),
    ).toBeVisible()
  },
}

export const Reabrir: StoryObj<typeof ReopenStageDialog> = {
  render: () => (
    <ReopenStageDialog
      open
      onOpenChange={fn()}
      current="practicing"
      onConfirm={fn()}
    />
  ),
  play: async () => {
    const dialog = await screen.findByRole('alertdialog')
    await waitFor(() => expect(dialog).toBeVisible(), { timeout: 3000 })
    await expect(within(dialog).getAllByRole('radio')).toHaveLength(2)
  },
}
