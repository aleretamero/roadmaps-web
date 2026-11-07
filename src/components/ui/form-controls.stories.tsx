import type { Meta, StoryObj } from '@storybook/react-vite'
import { Checkbox } from './checkbox'
import { Input } from './input'
import { Label } from './label'
import { Switch } from './switch'
import { Textarea } from './textarea'

const meta = {
  title: 'Base/Campos de formulário',
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

export const Todos: Story = {
  render: () => (
    <div className="flex max-w-sm flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="t">Título</Label>
        <Input id="t" placeholder="Ex.: Verbos no passado" />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="n">Nota</Label>
        <Textarea id="n" placeholder="O que você fez?" />
      </div>
      <div className="flex items-center gap-2">
        <Checkbox id="o" />
        <Label htmlFor="o">Opcional</Label>
      </div>
      <div className="flex items-center gap-2">
        <Switch id="r" />
        <Label htmlFor="r">Lembrete diário</Label>
      </div>
    </div>
  ),
}
