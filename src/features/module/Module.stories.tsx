import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, screen, userEvent, waitFor, within } from 'storybook/test'
import { moduleDetail } from '@/mocks/domain'
import { getDb, setScenario } from '@/mocks/state'
import { withRouter } from '@/test/StoryRouter'
import { EditModuleDialog } from './EditModuleDialog'
import { ModulePage } from './ModulePage'

function sqlServer() {
  setScenario('padrao')
  const db = getDb()
  const m = db.modules.find((x) => x.title === 'SQL Server')!
  return moduleDetail(db, m)
}

const meta = {
  title: 'Telas/Módulo',
  component: ModulePage,
  parameters: { layout: 'fullscreen' },
  decorators: [withRouter('/modules/1')],
  args: {
    module: sqlServer(),
    tab: 'topics',
    onTabChange: fn(),
    onEdit: fn(),
    onAddTopics: fn(),
    onQuickAdd: fn(),
  },
} satisfies Meta<typeof ModulePage>

export default meta
type Story = StoryObj<typeof meta>

export const ComTopicos: Story = {
  play: async ({ canvasElement, args }) => {
    const c = within(canvasElement)
    await userEvent.type(
      c.getByLabelText(/^Novo tópico em/),
      'Stored procedures{Enter}',
    )
    await expect(args.onQuickAdd).toHaveBeenCalledWith('Stored procedures')
    await userEvent.click(c.getByRole('tab', { name: 'Linha do tempo' }))
    await expect(args.onTabChange).toHaveBeenCalledWith('timeline')
  },
}

export const SemTopicos: Story = {
  args: {
    module: {
      ...sqlServer(),
      topics: [],
      status: 'notStarted',
      startedOn: null,
    },
  },
}

export const Celular: Story = { globals: { viewport: { value: 'mobile' } } }

export const Editar: StoryObj<typeof EditModuleDialog> = {
  render: () => (
    <EditModuleDialog
      open
      onOpenChange={fn()}
      initial={{ title: 'SQL Server', description: '' }}
      onSave={fn()}
    />
  ),
  play: async () => {
    const dialog = await screen.findByRole('dialog')
    await waitFor(() => expect(dialog).toBeVisible(), { timeout: 3000 })
    const name = within(dialog).getByLabelText('Nome')
    await userEvent.clear(name)
    await userEvent.click(
      within(dialog).getByRole('button', { name: 'Salvar' }),
    )
    await expect(
      await within(dialog).findByText('Dê um nome ao módulo'),
    ).toBeVisible()
  },
}
