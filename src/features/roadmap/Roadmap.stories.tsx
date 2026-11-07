import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, userEvent, within } from 'storybook/test'
import {
  linearRoadmap,
  optionalRoadmap,
  splitRoadmap,
} from '@/mocks/mapExamples'
import { withRouter } from '@/test/StoryRouter'
import { ProgressTab } from './ProgressTab'
import { RoadmapList } from './RoadmapList'
import { RoadmapMap } from './RoadmapMap'
import { RoadmapPage } from './RoadmapPage'

const meta = {
  title: 'Telas/Roadmap',
  component: RoadmapMap,
  parameters: { layout: 'padded' },
  decorators: [withRouter('/roadmaps/1')],
  args: { roadmap: linearRoadmap(), onChoose: fn() },
} satisfies Meta<typeof RoadmapMap>

export default meta
type Story = StoryObj<typeof meta>

export const MapaLinear: Story = {
  play: async ({ canvasElement }) => {
    const c = within(canvasElement)
    const mod = c.getByRole('link', { name: 'Gramática' })
    await expect(mod).toHaveAttribute(
      'href',
      expect.stringMatching(/^\/modules\/\d+$/),
    )
    await expect(mod).toHaveAccessibleDescription(/^Módulo, em andamento/)
    await expect(
      c.getByRole('link', { name: 'Verbos' }),
    ).toHaveAccessibleDescription('Concluído')
  },
}

export const MapaComDivisao: Story = {
  args: { roadmap: splitRoadmap() },
  play: async ({ canvasElement, args }) => {
    const c = within(canvasElement)
    await expect(c.getByText('Escolha um caminho')).toBeVisible()
    await expect(
      c.getByRole('button', { name: 'Meu caminho' }),
    ).toHaveAttribute('aria-pressed', 'true')
    await expect(
      c.getByRole('link', { name: 'Angular' }),
    ).toHaveAccessibleDescription(/caminho não escolhido/)
    await userEvent.click(
      c.getByRole('button', { name: 'Seguir este caminho' }),
    )
    await expect(args.onChoose).toHaveBeenCalledWith(
      args.roadmap.modules[0]!.id,
      args.roadmap.modules[2]!.id,
    )
  },
}

export const MapaSemEscolha: Story = { args: { roadmap: splitRoadmap('none') } }

export const MapaComOpcionais: Story = {
  args: { roadmap: optionalRoadmap() },
  play: async ({ canvasElement }) => {
    await expect(
      within(canvasElement).getByRole('link', { name: 'Certificação' }),
    ).toHaveAccessibleDescription(/^Módulo, opcional/)
  },
}

/** Tab percorre módulo → tópicos → próximo módulo, na ordem de leitura. */
export const Teclado: Story = {
  args: { roadmap: splitRoadmap() },
  play: async ({ canvasElement }) => {
    const c = within(canvasElement)
    c.getByRole('link', { name: 'JavaScript' }).focus()
    await userEvent.tab()
    await expect(c.getByRole('link', { name: 'Promises' })).toHaveFocus()
    await userEvent.tab()
    await expect(c.getByRole('link', { name: 'React' })).toHaveFocus()
  },
}

export const Pagina: StoryObj<typeof RoadmapPage> = {
  parameters: { layout: 'fullscreen' },
  render: () => (
    <RoadmapPage
      roadmap={splitRoadmap()}
      tab="roadmap"
      view="map"
      activeModules={1}
      onArchive={fn()}
      onChoose={fn()}
    />
  ),
}

export const PaginaArquivada: StoryObj<typeof RoadmapPage> = {
  parameters: { layout: 'fullscreen' },
  render: () => (
    <RoadmapPage
      roadmap={{ ...linearRoadmap(), archivedAt: '2026-11-01T00:00:00Z' }}
      tab="roadmap"
      view="map"
      onArchive={fn()}
      onChoose={fn()}
    />
  ),
}

export const PaginaSemModulos: StoryObj<typeof RoadmapPage> = {
  parameters: { layout: 'fullscreen' },
  render: () => (
    <RoadmapPage
      roadmap={{ ...linearRoadmap(), modules: [], startedOn: null }}
      tab="roadmap"
      view="map"
      onArchive={fn()}
      onChoose={fn()}
    />
  ),
}

export const Lista: StoryObj<typeof RoadmapList> = {
  parameters: { layout: 'padded' },
  render: () => <RoadmapList roadmap={linearRoadmap()} onReorder={fn()} />,
}

export const ListaAtalhos: StoryObj<typeof RoadmapList> = {
  parameters: { layout: 'padded' },
  args: { onReorder: fn() },
  render: (args) => (
    <RoadmapList roadmap={linearRoadmap()} onReorder={args.onReorder} />
  ),
  play: async ({ canvasElement, args }) => {
    const c = within(canvasElement)
    c.getByRole('link', { name: 'Tempos' }).focus()
    await userEvent.keyboard('{Alt>}{ArrowDown}{/Alt}')
    await expect(args.onReorder).toHaveBeenCalledWith(
      expect.objectContaining({
        call: expect.objectContaining({ kind: 'move', position: 0 }),
      }),
    )
  },
}

export const ListaComDivisao: StoryObj<typeof RoadmapList> = {
  parameters: { layout: 'padded' },
  render: () => <RoadmapList roadmap={splitRoadmap()} onReorder={fn()} />,
}

function progressOf(r: ReturnType<typeof splitRoadmap>, started = true) {
  const mods = r.modules
  return {
    progress: r.progress,
    totals: { planned: 2, studying: 1, practicing: 1, completed: 1 },
    startedOn: started ? '2026-10-08' : null,
    groups: {
      inProgress: started ? mods.filter((m) => m.status === 'inProgress') : [],
      upcoming: mods.filter(
        (m) => m.status === 'notStarted' && m.kind !== 'alternative',
      ),
      completed: mods.filter((m) => m.status === 'completed'),
      notChosen: mods.filter((m) => m.kind === 'alternative').slice(1),
    },
  }
}

export const Progresso: StoryObj<typeof ProgressTab> = {
  parameters: { layout: 'padded' },
  render: () => (
    <ProgressTab data={progressOf(splitRoadmap())} today="2026-11-07" />
  ),
  play: async ({ canvasElement }) => {
    const c = within(canvasElement)
    await expect(
      c.getByRole('img', { name: /^Tópicos por etapa: Concluído 1/ }),
    ).toBeVisible()
    await expect(
      c.getByRole('link', { name: 'Registrar sessão em Promises' }),
    ).toHaveAttribute('href', expect.stringMatching(/\?log=1$/))
    await expect(
      c.getByRole('region', { name: 'Caminhos não escolhidos' }),
    ).toBeVisible()
  },
}

export const ProgressoNaoIniciado: StoryObj<typeof ProgressTab> = {
  parameters: { layout: 'padded' },
  render: () => (
    <ProgressTab
      data={{
        ...progressOf(splitRoadmap(), false),
        totals: { planned: 0, studying: 0, practicing: 0, completed: 0 },
      }}
    />
  ),
}
