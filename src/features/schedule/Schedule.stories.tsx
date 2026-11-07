import type { Meta, StoryObj } from '@storybook/react-vite'
import { useQuery } from '@tanstack/react-query'
import { expect, fn, screen, userEvent, waitFor, within } from 'storybook/test'
import { scheduleQuery } from '@/lib/api/queries'
import { withRouter } from '@/test/StoryRouter'
import { DayDialog } from './DayDialog'
import { SchedulePage } from './SchedulePage'
import type { SchedulePageProps } from './SchedulePage'

const TODAY = '2026-11-07'

/** Busca a agenda de novembro na API mockada (como a rota faz). */
function WithApi(props: Omit<SchedulePageProps, 'days' | 'upcoming'>) {
  const days = useQuery(scheduleQuery('2026-11-01', '2026-12-05'))
  const upcoming = useQuery(scheduleQuery(TODAY, '2026-11-21'))
  return (
    <SchedulePage
      {...props}
      days={days.data?.days}
      upcoming={upcoming.data?.days}
    />
  )
}

const meta = {
  title: 'Telas/Agenda',
  component: WithApi,
  parameters: { layout: 'fullscreen' },
  decorators: [withRouter('/schedule')],
  args: {
    view: 'month',
    period: '2026-11',
    today: TODAY,
    onViewChange: fn(),
    onPrev: fn(),
    onNext: fn(),
    onToday: fn(),
    onOpenDay: fn(),
  },
} satisfies Meta<typeof WithApi>

export default meta
type Story = StoryObj<typeof meta>

export const Mes: Story = {
  play: async ({ canvasElement, args }) => {
    const c = within(canvasElement)
    const today = await c.findByRole('button', {
      name: /^Hoje, sábado, 7 de novembro/,
    })
    await userEvent.click(today)
    await expect(args.onOpenDay).toHaveBeenCalledWith(TODAY)
    await userEvent.click(c.getByRole('button', { name: 'Próximo mês' }))
    await expect(args.onNext).toHaveBeenCalled()
  },
}

export const Semana: Story = { args: { view: 'week', period: '2026-11-01' } }

export const Vazia: Story = {
  parameters: { scenario: 'vazio' },
  play: async ({ canvasElement }) => {
    const c = within(canvasElement)
    await expect(
      await c.findByText('Nenhum registro neste mês ainda'),
    ).toBeVisible()
    await expect(
      await c.findByText(/Nada agendado para as próximas duas semanas/),
    ).toBeVisible()
  },
}

export const Carregando: StoryObj<typeof SchedulePage> = {
  render: (args) => <SchedulePage {...args} />,
  args: { ...meta.args, days: undefined, upcoming: undefined },
}

export const Erro: StoryObj<typeof SchedulePage> = {
  render: (args) => <SchedulePage {...args} />,
  args: {
    ...meta.args,
    days: undefined,
    upcoming: [],
    error: 'Tente de novo em instantes.',
    onRetry: fn(),
  },
  play: async ({ canvasElement, args }) => {
    const c = within(canvasElement)
    await userEvent.click(c.getByRole('button', { name: 'Tentar de novo' }))
    await expect(args.onRetry).toHaveBeenCalled()
  },
}

export const Celular: Story = { globals: { viewport: { value: 'mobile' } } }

function DayWithApi({
  date,
  ...rest
}: Omit<React.ComponentProps<typeof DayDialog>, 'day'>) {
  const q = useQuery(scheduleQuery(date!, date!))
  return <DayDialog date={date} day={q.data?.days[0]} {...rest} />
}

const dayArgs = {
  today: TODAY,
  onOpenChange: fn(),
  onLog: fn(),
  onMove: fn(),
  onSchedule: fn(),
  onRemove: fn(),
}

export const DiaPassado: StoryObj<typeof DayWithApi> = {
  render: (args) => <DayWithApi {...args} />,
  args: { ...dayArgs, date: '2026-11-04' },
  play: async ({ args }) => {
    const d = within(await screen.findByRole('dialog'))
    await waitFor(
      () => expect(d.getByText('Registrado neste dia')).toBeVisible(),
      { timeout: 3000 },
    )
    await userEvent.click(d.getByRole('button', { name: 'Trocar data' }))
    await expect(args.onMove).toHaveBeenCalled()
  },
}

export const DiaFuturo: StoryObj<typeof DayWithApi> = {
  render: (args) => <DayWithApi {...args} />,
  args: { ...dayArgs, date: '2026-11-09' },
  play: async ({ args }) => {
    const d = within(await screen.findByRole('dialog'))
    const remove = await d.findByRole(
      'button',
      { name: /^Tirar .* deste dia$/ },
      { timeout: 3000 },
    )
    await userEvent.click(remove)
    await expect(args.onRemove).toHaveBeenCalled()
    await userEvent.type(
      d.getByLabelText('Filtrar tópicos pelo nome'),
      'Índices',
    )
    await userEvent.click(
      await d.findByRole('button', { name: 'Agendar Índices neste dia' }),
    )
    await expect(args.onSchedule).toHaveBeenCalled()
  },
}

export const Hoje: StoryObj<typeof DayWithApi> = {
  render: (args) => <DayWithApi {...args} />,
  args: { ...dayArgs, date: TODAY },
  play: async () => {
    const d = within(await screen.findByRole('dialog'))
    await userEvent.click(
      await d.findByRole('button', { name: 'Registrar o que fiz' }),
    )
    await expect(
      d.getByRole('button', { name: 'Registrar o que fiz' }),
    ).toHaveAttribute('aria-pressed', 'true')
  },
}
