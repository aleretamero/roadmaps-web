import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, screen, userEvent, waitFor, within } from 'storybook/test'
import { withRouter } from '@/test/StoryRouter'
import { AppHeader } from './AppHeader'

const meta = {
  title: 'App/Cabeçalho',
  component: AppHeader,
  parameters: { layout: 'fullscreen' },
  args: {
    name: 'Marina Costa',
    email: 'marina@exemplo.com',
    onLogout: fn(),
    onSearch: fn(),
  },
  decorators: [withRouter('/dashboard')],
} satisfies Meta<typeof AppHeader>

export default meta
type Story = StoryObj<typeof meta>

export const NoPainel: Story = {
  play: async ({ canvasElement }) => {
    const nav = within(
      await within(canvasElement).findByRole('navigation', {
        name: 'Principal',
      }),
    )
    await expect(nav.getByRole('link', { name: 'Painel' })).toHaveAttribute(
      'aria-current',
      'page',
    )
    await expect(
      nav.getByRole('link', { name: 'Meus roadmaps' }),
    ).not.toHaveAttribute('aria-current')
  },
}

/** Módulo e tópico ficam dentro de "Meus roadmaps". */
export const NumTopico: Story = {
  decorators: [withRouter('/topics/42')],
  play: async ({ canvasElement }) => {
    const link = await within(canvasElement).findByRole('link', {
      name: 'Meus roadmaps',
    })
    await expect(link).toHaveAttribute('aria-current', 'page')
  },
}

export const MenuDaConta: Story = {
  play: async ({ canvasElement, args }) => {
    const trigger = await within(canvasElement).findByRole('button', {
      name: 'Conta de Marina Costa',
    })
    await userEvent.click(trigger)
    const menu = await screen.findByRole('menu')
    await waitFor(
      () =>
        expect(
          within(menu).getByRole('menuitem', { name: 'Configurações' }),
        ).toBeVisible(),
      { timeout: 3000 },
    )
    await userEvent.click(within(menu).getByRole('menuitem', { name: 'Sair' }))
    await expect(args.onLogout).toHaveBeenCalledOnce()
    await waitFor(() => expect(screen.queryByRole('menu')).toBeNull(), {
      timeout: 3000,
    })
  },
}

export const Celular: Story = {
  globals: { viewport: { value: 'mobile' } },
}

export const NomeComprido: Story = {
  args: {
    name: 'Maria Eduarda dos Santos Albuquerque',
    email: 'maria.eduarda.albuquerque@empresa-com-nome-longo.com.br',
  },
}
