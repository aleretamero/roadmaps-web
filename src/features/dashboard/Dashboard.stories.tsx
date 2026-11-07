import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, within } from 'storybook/test'
import { todayISO } from '@/lib/date'
import { dashboard } from '@/mocks/domain'
import { getDb, setScenario } from '@/mocks/state'
import type { Scenario } from '@/mocks/state'
import { withRouter } from '@/test/StoryRouter'
import {
  AttentionCard,
  NextDaysCard,
  RoadmapsCard,
  TodayCard,
  WeekCard,
} from './cards'
import { DashboardPage } from './DashboardPage'

/** Resposta do mock (mesmas regras do backend) no cenário pedido. */
function data(scenario: Scenario = 'padrao') {
  setScenario(scenario)
  return dashboard(getDb())
}

const date = todayISO()

const meta = {
  title: 'Telas/Painel',
  parameters: { layout: 'fullscreen', backgrounds: { value: 'canvas' } },
  decorators: [withRouter('/dashboard')],
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

const page =
  (scenario: Scenario, hour = 10) =>
  () => <DashboardPage data={data(scenario)} date={date} hour={hour} />

export const ComDados: Story = {
  render: page('padrao'),
  play: async ({ canvasElement }) => {
    const c = within(canvasElement)
    await expect(c.getByRole('heading', { level: 1 })).toHaveTextContent(
      'Bom dia',
    )
    await expect(c.getByRole('region', { name: 'Hoje' })).toBeVisible()
    await expect(
      c.getByRole('list', { name: 'Dias desta semana' }),
    ).toBeVisible()
  },
}
export const NovoUsuario: Story = {
  render: page('vazio', 20),
  play: async ({ canvasElement }) => {
    const c = within(canvasElement)
    await expect(c.getByText('Você ainda não tem roadmaps.')).toBeVisible()
    await expect(c.getByText('Sem sequência')).toBeVisible()
  },
}
export const DiaSemTopico: Story = {
  render: page('sem-agenda-hoje', 15),
  play: async ({ canvasElement }) => {
    const c = within(canvasElement)
    await expect(c.getByText('Nada agendado para hoje.')).toBeVisible()
    await expect(c.getByRole('button', { name: /^Continuar “/ })).toBeVisible()
  },
}
export const TudoEmDia: Story = {
  render: page('em-dia'),
  play: async ({ canvasElement }) => {
    await expect(
      within(canvasElement).getByText(/^Tudo em dia\./),
    ).toBeVisible()
  },
}
export const Celular: Story = {
  render: page('padrao'),
  globals: { viewport: { value: 'mobile' } },
}

/* Cartões isolados */
const card = (node: () => React.ReactNode) => ({
  parameters: { layout: 'padded' },
  render: () => <div className="max-w-xl">{node()}</div>,
})

export const CartaoHoje: Story = card(() => {
  const d = data()
  return <TodayCard date={date} items={d.today} resume={d.resume} />
})
export const CartaoHojeVazio: Story = card(() => {
  const d = data('sem-agenda-hoje')
  return <TodayCard date={date} items={[]} resume={d.resume} />
})
export const CartaoSemana: Story = card(() => {
  const d = data()
  return (
    <WeekCard
      date={date}
      week={d.week}
      streak={d.streak}
      weekStats={d.weekStats}
      topics={d.topics}
    />
  )
})
export const CartaoRoadmaps: Story = card(() => (
  <RoadmapsCard date={date} roadmaps={data().roadmaps} />
))
export const CartaoProximosDias: Story = card(() => (
  <NextDaysCard date={date} days={data().next7Days} />
))
export const CartaoProximosDiasVazio: Story = card(() => (
  <NextDaysCard date={date} days={[]} />
))
export const CartaoAtencao: Story = card(() => (
  <AttentionCard date={date} items={data().attention} />
))
export const CartaoAtencaoEmDia: Story = card(() => (
  <AttentionCard date={date} items={[]} />
))
