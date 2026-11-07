import type { Meta, StoryObj } from '@storybook/react-vite'
import { Plus } from 'lucide-react'
import { Button } from './button'

const meta = {
  title: 'Base/Button',
  component: Button,
  args: { children: 'Registrar sessão' },
  argTypes: {
    variant: {
      control: 'select',
      options: [
        'default',
        'outline',
        'secondary',
        'ghost',
        'destructive',
        'link',
      ],
    },
    size: { control: 'select', options: ['default', 'sm', 'lg'] },
  },
} satisfies Meta<typeof Button>

export default meta
type Story = StoryObj<typeof meta>

export const Primario: Story = {}
export const Contorno: Story = {
  args: { variant: 'outline', children: 'Editar módulo' },
}
export const Fantasma: Story = {
  args: { variant: 'ghost', children: 'Cancelar' },
}
export const Destrutivo: Story = {
  args: { variant: 'destructive', children: 'Apagar' },
}
export const ComIcone: Story = {
  args: {
    children: (
      <>
        <Plus /> Adicionar tópicos
      </>
    ),
  },
}
export const Desabilitado: Story = { args: { disabled: true } }
