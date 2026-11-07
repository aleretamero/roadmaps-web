import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, screen, userEvent, waitFor, within } from 'storybook/test'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { RescheduleForm } from './Reschedule'
import type { RescheduleFormProps } from './Reschedule'

function InDialog(props: RescheduleFormProps) {
  return (
    <Dialog open>
      <DialogContent className="flex flex-col gap-0 bg-surface p-0 sm:max-w-[520px]">
        <RescheduleForm {...props} />
      </DialogContent>
    </Dialog>
  )
}

const meta = {
  title: 'Componentes/Trocar data e agendar',
  component: InDialog,
  args: {
    topic: {
      title: 'Módulos',
      roadmapName: 'Frontend',
      moduleTitle: 'JavaScript',
    },
    entries: [
      { id: 1, date: '2026-11-04' },
      { id: 2, date: '2026-11-12' },
    ],
    mode: 'move',
    today: '2026-11-07',
    onCancel: fn(),
    onSave: fn(),
  },
} satisfies Meta<typeof InDialog>

export default meta
type Story = StoryObj<typeof meta>

const dialog = async () => {
  const d = await screen.findByRole('dialog')
  await waitFor(() => expect(d).toBeVisible(), { timeout: 3000 })
  return within(d)
}

export const TrocarData: Story = {
  play: async () => {
    const d = await dialog()
    await expect(
      d.getByRole('radio', { name: 'Qui, 12 de nov' }),
    ).toHaveAttribute('aria-checked', 'true')
    await expect(d.getByText('Escolha a nova data.')).toBeVisible()
    await userEvent.click(d.getByRole('radio', { name: 'Qua, 4 de nov' }))
    await expect(
      d.getByRole('radio', { name: 'Qua, 4 de nov' }),
    ).toHaveAttribute('aria-checked', 'true')
  },
}

export const AgendarMaisUmDia: Story = { args: { mode: 'add' } }

export const SemDataParaTrocar: Story = { args: { entries: [] } }

export const ErroDaApi: Story = {
  args: { error: 'Esse tópico já está agendado nesse dia' },
}
