import type { Meta, StoryObj } from '@storybook/react-vite'
import { StageChip } from './StageChip'
import { STAGES } from '@/lib/stage'

const meta = {
  title: 'Produto/StageChip',
  component: StageChip,
  args: { stage: 'studying' },
  argTypes: { stage: { control: 'inline-radio', options: STAGES } },
} satisfies Meta<typeof StageChip>

export default meta
type Story = StoryObj<typeof meta>

export const Estudando: Story = {}

export const TodasAsEtapas: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      {STAGES.map((s) => (
        <StageChip key={s} stage={s} />
      ))}
    </div>
  ),
}

export const TextoPersonalizado: Story = {
  args: { stage: 'studying', children: 'Em andamento' },
}
