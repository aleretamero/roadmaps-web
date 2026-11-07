import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, userEvent, within } from 'storybook/test'
import {
  linearRoadmap,
  optionalRoadmap,
  splitRoadmap,
} from '@/mocks/mapExamples'
import { withRouter } from '@/test/StoryRouter'
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
