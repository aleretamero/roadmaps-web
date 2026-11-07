import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, screen, userEvent, waitFor, within } from 'storybook/test'
import { roadmapSummary } from '@/mocks/domain'
import { getDb, setScenario } from '@/mocks/state'
import { withRouter } from '@/test/StoryRouter'
import { RoadmapCard } from './RoadmapCard'
import { RoadmapsPage } from './RoadmapsPage'

function lists(scenario: 'padrao' | 'vazio' = 'padrao') {
  setScenario(scenario)
  const db = getDb()
  const all = db.roadmaps.map((r) => roadmapSummary(db, r.id))
  return {
    active: all.filter((r) => !r.archivedAt),
    archived: all.filter((r) => r.archivedAt),
  }
}

const meta = {
  title: 'Telas/Meus roadmaps',
  component: RoadmapsPage,
  parameters: { layout: 'fullscreen' },
  decorators: [withRouter('/roadmaps')],
  args: {
    ...lists(),
    showArchived: false,
    onArchive: fn(),
    onDelete: fn(),
  },
} satisfies Meta<typeof RoadmapsPage>

export default meta
type Story = StoryObj<typeof meta>

export const Ativos: Story = {
  play: async ({ canvasElement, args }) => {
    const c = within(canvasElement)
    await userEvent.click(c.getByRole('button', { name: 'Ações de Frontend' }))
    await userEvent.click(
      await screen.findByRole('menuitem', { name: 'Arquivar' }),
    )
    await expect(args.onArchive).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Frontend' }),
      true,
    )
    await waitFor(() => expect(screen.queryByRole('menu')).toBeNull(), {
      timeout: 3000,
    })
  },
}

export const ApagarComConfirmacao: Story = {
  play: async ({ canvasElement, args }) => {
    const c = within(canvasElement)
    await userEvent.click(
      c.getByRole('button', { name: 'Ações de Algoritmos' }),
    )
    await userEvent.click(
      await screen.findByRole('menuitem', { name: 'Apagar…' }),
    )
    const dialog = await screen.findByRole('alertdialog')
    await waitFor(() => expect(dialog).toBeVisible(), { timeout: 3000 })
    await expect(within(dialog).getByText('Apagar “Algoritmos”?')).toBeVisible()
    await userEvent.click(
      within(dialog).getByRole('button', { name: 'Apagar roadmap' }),
    )
    await expect(args.onDelete).toHaveBeenCalledOnce()
    await waitFor(() => expect(screen.queryByRole('alertdialog')).toBeNull(), {
      timeout: 3000,
    })
  },
}

export const Arquivados: Story = { args: { showArchived: true } }

export const SemRoadmaps: Story = {
  args: { ...lists('vazio') },
  play: async ({ canvasElement }) => {
    await expect(
      within(canvasElement).getByRole('heading', {
        name: 'Você não tem roadmaps ativos',
      }),
    ).toBeVisible()
  },
}

export const SemArquivados: Story = {
  args: { ...lists('vazio'), showArchived: true },
}

export const Celular: Story = { globals: { viewport: { value: 'mobile' } } }

export const EstadosDoCard: StoryObj = {
  parameters: { layout: 'padded' },
  render: () => {
    const { active, archived } = lists()
    const base = active[0]!
    const cards = [
      base,
      {
        ...base,
        id: 900,
        name: 'Concluído',
        progress: { completed: 5, total: 5, percent: 100 },
      },
      {
        ...base,
        id: 901,
        name: 'Novo',
        startedOn: null,
        progress: { completed: 0, total: 3, percent: 0 },
        goal: null,
      },
      ...archived,
    ]
    return (
      <div className="grid max-w-4xl grid-cols-2 gap-5">
        {cards.map((r) => (
          <RoadmapCard
            key={r.id}
            roadmap={r}
            onArchive={fn()}
            onDelete={fn()}
          />
        ))}
      </div>
    )
  },
}
