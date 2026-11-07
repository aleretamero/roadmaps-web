import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, userEvent, within } from 'storybook/test'
import { getDb, setScenario } from '@/mocks/state'
import { withRouter } from '@/test/StoryRouter'
import { FileExplorer } from './FileExplorer'
import { DriveNotice } from './FilesTab'

function topicId() {
  setScenario('com-drive')
  return getDb().topics.find((t) => t.title === 'Índices')!.id
}

const meta = {
  title: 'Telas/Tópico/Arquivos',
  component: FileExplorer,
  parameters: { layout: 'padded', scenario: 'com-drive' },
  decorators: [withRouter('/topics/1?tab=files')],
  args: { topicId: topicId() },
} satisfies Meta<typeof FileExplorer>

export default meta
type Story = StoryObj<typeof meta>

export const ComArquivos: Story = {
  play: async ({ canvasElement }) => {
    const c = within(canvasElement)
    const folder = await c.findByRole(
      'treeitem',
      { name: 'Pasta scripts' },
      { timeout: 3000 },
    )
    await userEvent.click(folder)
    await expect(folder).toHaveAttribute('aria-expanded', 'true')
    await userEvent.click(c.getByRole('treeitem', { name: /^indices\.sql/ }))
    await expect(
      await c.findByLabelText('Conteúdo de indices.sql', {}, { timeout: 3000 }),
    ).toBeVisible()
  },
}

export const NovaPasta: Story = {
  play: async ({ canvasElement }) => {
    const c = within(canvasElement)
    await userEvent.click(
      await c.findByRole('button', { name: 'Nova pasta' }, { timeout: 3000 }),
    )
    await userEvent.keyboard('a/b{Enter}')
    await expect(await c.findByRole('alert')).toHaveTextContent(
      'O nome não pode ter barras.',
    )
  },
}

export const SemDrive: Story = {
  parameters: { scenario: 'sem-drive' },
  play: async ({ canvasElement }) => {
    const c = within(canvasElement)
    await expect(
      await c.findByRole(
        'heading',
        { name: 'Conecte o Google Drive para guardar arquivos' },
        { timeout: 3000 },
      ),
    ).toBeVisible()
  },
}

export const Aviso: StoryObj<typeof DriveNotice> = {
  render: () => <DriveNotice topicId={1} />,
}

export const Carregando: Story = { parameters: { scenario: 'lento' } }

export const Celular: Story = { globals: { viewport: { value: 'mobile' } } }
