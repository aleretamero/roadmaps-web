import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, screen, userEvent, waitFor, within } from 'storybook/test'
import { roadmapDetail } from '@/mocks/domain'
import { linearRoadmap } from '@/mocks/mapExamples'
import { getDb, setScenario } from '@/mocks/state'
import { AutoScheduleDialog } from './AutoScheduleDialog'

function backend() {
  setScenario('padrao')
  return roadmapDetail(getDb(), 101)
}

const meta = {
  title: 'Telas/Roadmap/Agendar automaticamente',
  component: AutoScheduleDialog,
  args: {
    roadmap: backend(),
    open: true,
    onOpenChange: fn(),
    today: '2026-11-07',
  },
} satisfies Meta<typeof AutoScheduleDialog>

export default meta
type Story = StoryObj<typeof meta>

const dialog = async () => {
  const d = await screen.findByRole('dialog')
  await waitFor(() => expect(d).toBeVisible(), { timeout: 3000 })
  return within(d)
}

export const ComPrevia: Story = {
  play: async () => {
    const d = await dialog()
    await expect(
      await d.findByText(/^1 tópico em 1 dia · termina/, {}, { timeout: 3000 }),
    ).toBeVisible()
    await expect(
      d.getByRole('button', { name: 'Agendar 1 tópico' }),
    ).toBeEnabled()
  },
}

export const Reagendar: Story = {
  play: async () => {
    const d = await dialog()
    await userEvent.click(d.getByLabelText('Reagendar os que já têm data'))
    await expect(
      await d.findByText(/^2 tópicos em 2 dias/, {}, { timeout: 3000 }),
    ).toBeVisible()
  },
}

export const NadaParaAgendar: Story = {
  args: {
    roadmap: {
      ...linearRoadmap(),
      modules: linearRoadmap().modules.map((m) => ({
        ...m,
        topics: m.topics.map((t) => ({ ...t, stage: 'completed' as const })),
      })),
    },
  },
  play: async () => {
    const d = await dialog()
    await expect(
      d.getByText(/Nenhum tópico sem data para agendar/),
    ).toBeVisible()
    await expect(
      d.getByRole('button', { name: 'Nada para agendar' }),
    ).toBeDisabled()
  },
}

export const ErroNaPrevia: Story = {
  parameters: { scenario: 'erro-500' },
  play: async () => {
    const d = await dialog()
    // Sem preferências (a API falhou), nenhum dia vem marcado.
    await userEvent.click(d.getByRole('button', { name: 'Segunda-feira' }))
    await expect(
      await d.findByText(
        /Não foi possível calcular a prévia/,
        {},
        { timeout: 10000 },
      ),
    ).toBeVisible()
  },
}

export const Celular: Story = { globals: { viewport: { value: 'mobile' } } }
