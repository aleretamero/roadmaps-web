import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, userEvent, within } from 'storybook/test'
import { AUTH_PROVIDERS } from '@/lib/auth'
import { withRouter } from '@/test/StoryRouter'
import { LoginCard } from './LoginCard'

const meta = {
  title: 'Telas/Login',
  component: LoginCard,
  parameters: { layout: 'fullscreen' },
  args: { providers: AUTH_PROVIDERS, onLogin: fn() },
  decorators: [withRouter('/login')],
} satisfies Meta<typeof LoginCard>

export default meta
type Story = StoryObj<typeof meta>

export const Padrao: Story = {
  play: async ({ canvasElement, args }) => {
    await userEvent.click(
      await within(canvasElement).findByRole('button', {
        name: 'Continuar com GitHub',
      }),
    )
    await expect(args.onLogin).toHaveBeenCalledWith('github')
  },
}

export const Conectando: Story = {
  args: { busy: 'github' },
  play: async ({ canvasElement }) => {
    const btn = await within(canvasElement).findByRole('button', {
      name: 'Conectando ao GitHub…',
    })
    await expect(btn).toBeDisabled()
    await expect(btn).toHaveAttribute('aria-busy', 'true')
  },
}

export const Erro: Story = {
  args: {
    error:
      'Não foi possível entrar: a autorização foi cancelada no GitHub. Tente de novo.',
  },
}

export const Celular: Story = {
  globals: { viewport: { value: 'mobile' } },
}
