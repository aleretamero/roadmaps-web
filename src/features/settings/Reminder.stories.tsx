import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, screen, userEvent, within } from 'storybook/test'
import { MockNotifications } from '@/components/MockNotifications'
import { showMockNotification } from '@/lib/push'
import { withRouter } from '@/test/StoryRouter'
import { ReminderRow } from './ReminderRow'

const meta = {
  title: 'Telas/Configurações/Lembrete diário',
  component: ReminderRow,
  decorators: [
    (Story) => (
      <div className="max-w-[760px] rounded-2xl border border-line bg-surface px-6">
        <Story />
      </div>
    ),
  ],
  args: {
    enabled: false,
    time: '20:00',
    topicTitle: 'Índices',
    permission: 'default',
    onEnable: fn(async () => 'enabled' as const),
    onDisable: fn(async () => {}),
    onTimeChange: fn(),
    onTest: fn(async () => {}),
  },
} satisfies Meta<typeof ReminderRow>

export default meta
type Story = StoryObj<typeof meta>

export const Desligado: Story = {
  play: async ({ canvasElement, args }) => {
    const c = within(canvasElement)
    await userEvent.click(c.getByRole('switch', { name: 'Lembrete diário' }))
    const dialog = await screen.findByRole('alertdialog', {
      name: 'Permitir notificações?',
    })
    await userEvent.click(
      within(dialog).getByRole('button', { name: 'Continuar' }),
    )
    await expect(args.onEnable).toHaveBeenCalled()
  },
}

export const Ligado: Story = {
  args: { enabled: true, permission: 'granted' },
  play: async ({ canvasElement }) => {
    const c = within(canvasElement)
    await expect(c.getByText(/O tópico do dia é “Índices”/)).toBeVisible()
  },
}

export const Bloqueado: Story = {
  args: { permission: 'denied' },
  play: async ({ canvasElement }) => {
    const c = within(canvasElement)
    await expect(c.getByRole('alert')).toHaveTextContent('bloqueadas')
  },
}

export const SemSuporte: Story = { args: { permission: 'unsupported' } }

export const NotificacaoSimulada: StoryObj<typeof MockNotifications> = {
  decorators: [withRouter('/settings/study')],
  render: () => <MockNotifications />,
  play: async () => {
    showMockNotification({
      title: 'Hora de estudar',
      body: 'Você ainda não registrou nada hoje.',
      topicId: 1,
    })
    const n = await screen.findByRole('alert', {
      name: 'Notificação (simulada)',
    })
    await expect(
      within(n).getByRole('button', { name: 'Registrar' }),
    ).toBeVisible()
  },
}
