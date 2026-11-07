import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, screen, userEvent, waitFor, within } from 'storybook/test'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { getDb, setScenario } from '@/mocks/state'
import { LogSessionDialog, LogSessionForm } from './LogSession'
import type { LogSessionFormProps } from './LogSession'

const topic = {
  title: 'Índices',
  roadmapName: 'Backend com .NET',
  moduleTitle: 'SQL Server',
  stage: 'studying' as const,
}

function InDialog(props: LogSessionFormProps) {
  return (
    <Dialog open>
      <DialogContent className="flex flex-col gap-0 bg-surface p-0 sm:max-w-[600px]">
        <LogSessionForm {...props} />
      </DialogContent>
    </Dialog>
  )
}

const meta = {
  title: 'Componentes/Registrar sessão',
  component: InDialog,
  args: { topic, today: '2026-11-07', onCancel: fn(), onSave: fn() },
} satisfies Meta<typeof InDialog>

export default meta
type Story = StoryObj<typeof meta>

const dialog = async () => {
  const d = await screen.findByRole('dialog')
  await waitFor(() => expect(d).toBeVisible(), { timeout: 3000 })
  return within(d)
}
const outcome = (text: string | RegExp) => async () => {
  const d = await dialog()
  await expect(d.getByText(text)).toBeVisible()
}

export const Estudei: Story = {
  play: outcome(
    'O tópico continua em Estudando. Entra na agenda em sáb, 7 de nov.',
  ),
}

export const Pratiquei: Story = {
  args: { initial: { actions: ['practiced'] } },
  play: outcome(
    'O tópico passa de Estudando para Praticando. Entra na agenda em sáb, 7 de nov.',
  ),
}

export const Conclui: Story = {
  args: { initial: { actions: ['completed'] } },
  play: outcome(/passa de Estudando para Concluído/),
}

export const EstudeiEPratiquei: Story = {
  args: { initial: { actions: ['studied', 'practiced'] } },
  play: outcome(/passa de Estudando para Praticando/),
}

export const EstudeiEConclui: Story = {
  args: { initial: { actions: ['studied', 'completed'] } },
  play: outcome(/passa de Estudando para Concluído/),
}

export const PratiqueiEConclui: Story = {
  args: { initial: { actions: ['practiced', 'completed'] } },
  play: outcome(/passa de Estudando para Concluído/),
}

export const Todas: Story = {
  args: {
    initial: {
      actions: ['studied', 'practiced', 'completed'],
      when: 'yesterday',
      note: 'Plano de execução.',
    },
  },
  play: async ({ args }) => {
    const d = await dialog()
    await expect(d.getByText(/Entra na agenda em sex, 6 de nov/)).toBeVisible()
    await userEvent.click(d.getByRole('button', { name: 'Salvar registro' }))
    await expect(args.onSave).toHaveBeenCalledWith({
      day: '2026-11-06',
      studied: true,
      practiced: true,
      completed: true,
      note: 'Plano de execução.',
    })
  },
}

export const Nenhuma: Story = {
  play: async () => {
    const d = await dialog()
    await userEvent.click(d.getByRole('button', { name: /^Estudei/ }))
    await expect(d.getByText('Marque o que você fez.')).toBeVisible()
    await expect(
      d.getByRole('button', { name: 'Salvar registro' }),
    ).toBeDisabled()
  },
}

export const RevisaoDeConcluido: Story = {
  args: {
    topic: { ...topic, stage: 'completed' },
    initial: { actions: ['practiced'] },
  },
  play: outcome(/Conta como revisão; o tópico continua concluído/),
}

export const OutroDiaSemData: Story = {
  args: { initial: { when: 'other', date: '' } },
  play: outcome('Escolha a data.'),
}

export const ErroDaApi: Story = {
  args: { error: 'Não foi possível salvar. Tente de novo.' },
  play: async () => {
    const d = await dialog()
    await expect(d.getByRole('alert')).toHaveTextContent(
      'Não foi possível salvar',
    )
  },
}

export const Celular: Story = { globals: { viewport: { value: 'mobile' } } }

/** O modal completo: busca o tópico na API mockada. */
export const ComApi: StoryObj<typeof LogSessionDialog> = {
  render: () => {
    setScenario('padrao')
    const t = getDb().topics.find((x) => x.title === 'Índices')!
    return <LogSessionDialog topicId={t.id} open onOpenChange={fn()} />
  },
  play: async () => {
    const d = await dialog()
    await expect(
      await d.findByRole('heading', { name: 'Índices' }),
    ).toBeVisible()
    await expect(d.getByRole('button', { name: /^Pratiquei/ })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
  },
}

export const Carregando: StoryObj<typeof LogSessionDialog> = {
  parameters: { scenario: 'lento' },
  render: () => <LogSessionDialog topicId={1} open onOpenChange={fn()} />,
  play: async () => {
    const d = await dialog()
    await expect(d.getByText('Carregando o tópico…')).toBeInTheDocument()
  },
}

export const ErroAoCarregar: StoryObj<typeof LogSessionDialog> = {
  render: () => <LogSessionDialog topicId={999999} open onOpenChange={fn()} />,
  play: async () => {
    const d = await dialog()
    await expect(
      await d.findByText(/Não foi possível abrir o tópico/),
    ).toBeVisible()
  },
}
