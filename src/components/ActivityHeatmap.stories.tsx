import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, userEvent, within } from 'storybook/test'
import { todayISO } from '@/lib/date'
import { activity } from '@/mocks/domain'
import { getDb, setScenario } from '@/mocks/state'
import { ActivityHeatmap } from './ActivityHeatmap'

const today = todayISO()

function days(scenario: 'padrao' | 'vazio', keepLast?: number) {
  setScenario(scenario)
  const a = activity(getDb(), 24)
  if (keepLast === undefined) return a.days
  // Poucos registros: só os últimos dias com sessão.
  const cut = a.days.length - keepLast
  return a.days.map((d, i) =>
    i < cut ? { ...d, count: 0, topics: [], entries: [] } : d,
  )
}

const meta = {
  title: 'Produto/ActivityHeatmap',
  component: ActivityHeatmap,
  parameters: { layout: 'padded' },
  args: { weeks: 24, today, streak: 8, onSelectDay: fn(), days: [] },
  decorators: [
    (Story) => (
      <div className="max-w-3xl rounded-2xl border border-line bg-surface p-6">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof ActivityHeatmap>

export default meta
type Story = StoryObj<typeof meta>

export const Vazio: Story = { args: { days: days('vazio'), streak: 0 } }
export const Poucos: Story = { args: { days: days('padrao', 10) } }
export const Muitos: Story = {
  args: { days: days('padrao') },
  play: async ({ canvasElement, args }) => {
    const c = within(canvasElement)
    const todayCell = c
      .getAllByRole('button')
      .find((b) => b.getAttribute('aria-current') === 'date')!
    // Uma parada de Tab: só o dia ativo (hoje) está na ordem do Tab.
    await expect(todayCell).toHaveAttribute('tabindex', '0')
    todayCell.focus()
    await userEvent.keyboard('{ArrowUp}')
    await expect(document.activeElement).not.toBe(todayCell)
    await expect(document.activeElement).toHaveAttribute('tabindex', '0')
    await userEvent.keyboard('{Enter}')
    await expect(args.onSelectDay).toHaveBeenCalledOnce()
  },
}
export const Celular: Story = {
  args: { days: days('padrao') },
  globals: { viewport: { value: 'mobile' } },
}
