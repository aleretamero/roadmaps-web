import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, userEvent, within } from 'storybook/test'
import { withRouter } from '@/test/StoryRouter'
import {
  AccountSection,
  IntegrationsSection,
  SettingsLayout,
  StudySection,
} from './SettingsPage'

const me = {
  id: '1',
  name: 'Marina Costa',
  email: 'marina@exemplo.com',
  avatarUrl: null,
  timeZone: 'America/Sao_Paulo',
}
const prefs = {
  studyDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'] as Array<
    'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday'
  >,
  includeOptional: false,
  homePage: 'dashboard' as const,
  reminderEnabled: false,
  reminderTime: '20:00',
}
const drive = (connected: boolean) => ({
  provider: 'googleDrive' as const,
  available: true,
  connected,
  accountEmail: connected ? 'marina@exemplo.com' : null,
  rootFolderName: connected ? 'Roadmaps' : null,
  connectedAt: null,
})
const calendar = {
  provider: 'googleCalendar' as const,
  available: false,
  connected: false,
  accountEmail: null,
  rootFolderName: null,
  connectedAt: null,
}

const meta = {
  title: 'Telas/Configurações',
  component: SettingsLayout,
  parameters: { layout: 'fullscreen' },
  decorators: [withRouter('/settings/account')],
  args: { section: 'account', children: null },
} satisfies Meta<typeof SettingsLayout>

export default meta
type Story = StoryObj<typeof meta>

export const Conta: Story = {
  render: () => (
    <SettingsLayout section="account">
      <AccountSection me={me} onSave={fn()} onLogout={fn()} />
    </SettingsLayout>
  ),
  play: async ({ canvasElement }) => {
    const c = within(canvasElement)
    await userEvent.clear(c.getByLabelText('Nome'))
    await expect(c.getByText('Alterações não salvas')).toBeVisible()
    await userEvent.click(c.getByRole('button', { name: 'Salvar' }))
    await expect(await c.findByText('Informe seu nome.')).toBeVisible()
  },
}

export const EstudoEAgenda: Story = {
  render: () => (
    <SettingsLayout section="study">
      <StudySection prefs={prefs} onSave={fn()} />
    </SettingsLayout>
  ),
  play: async ({ canvasElement }) => {
    const c = within(canvasElement)
    for (const d of [
      'Segunda-feira',
      'Terça-feira',
      'Quarta-feira',
      'Quinta-feira',
      'Sexta-feira',
    ])
      await userEvent.click(c.getByRole('button', { name: d }))
    await userEvent.click(c.getByRole('button', { name: 'Salvar' }))
    await expect(
      await c.findByText('Escolha pelo menos um dia de estudo.'),
    ).toBeVisible()
  },
}

export const ErroAoSalvar: Story = {
  render: () => (
    <SettingsLayout section="study">
      <StudySection
        prefs={prefs}
        onSave={fn()}
        error="Algo deu errado do nosso lado. Tente de novo em instantes."
      />
    </SettingsLayout>
  ),
}

export const IntegracoesDesconectado: Story = {
  render: () => (
    <SettingsLayout section="integrations">
      <IntegrationsSection
        integrations={[drive(false), calendar]}
        returnTo="/topics/1?tab=files"
        onConnect={fn()}
        onDisconnect={fn()}
        onBack={fn()}
      />
    </SettingsLayout>
  ),
}

export const IntegracoesConectando: Story = {
  render: () => (
    <SettingsLayout section="integrations">
      <IntegrationsSection
        integrations={[drive(false), calendar]}
        connecting
        onConnect={fn()}
        onDisconnect={fn()}
      />
    </SettingsLayout>
  ),
}

export const IntegracoesConectado: Story = {
  render: () => (
    <SettingsLayout section="integrations">
      <IntegrationsSection
        integrations={[drive(true), calendar]}
        onConnect={fn()}
        onDisconnect={fn()}
      />
    </SettingsLayout>
  ),
}

export const Celular: Story = {
  ...EstudoEAgenda,
  play: undefined,
  globals: { viewport: { value: 'mobile' } },
}
