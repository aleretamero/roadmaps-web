import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, screen, userEvent, waitFor, within } from 'storybook/test'
import { withRouter } from '@/test/StoryRouter'
import { BuilderPage } from './BuilderPage'
import { ImportDialog } from './ImportDialog'
import { fromImportModules, parseImportJson } from './model'
import { EXAMPLE_JSON } from './importFormat'

const meta = {
  title: 'Telas/Criador de roadmap',
  component: BuilderPage,
  parameters: { layout: 'fullscreen' },
  decorators: [withRouter('/roadmaps/new')],
  args: {
    destination: { kind: 'new' },
    onSubmit: fn(),
    onCancel: fn(),
    onImport: async (text: string) => {
      const r = parseImportJson(text)
      return r.ok
        ? {
            ok: true as const,
            modules: fromImportModules(r.value.modules, []),
            name: r.value.name,
          }
        : r
    },
  },
} satisfies Meta<typeof BuilderPage>

export default meta
type Story = StoryObj<typeof meta>

export const Novo: Story = {
  play: async ({ canvasElement, args }) => {
    const c = within(canvasElement)
    await userEvent.type(
      c.getByLabelText('Nome do roadmap (obrigatório)'),
      'Inglês',
    )
    await userEvent.type(
      c.getByLabelText('Nome do módulo 1'),
      'Gramática{Enter}Verbos{Enter}Tempos',
    )
    await expect(c.getByLabelText('Tópico 2 do módulo 1')).toHaveFocus()
    await userEvent.click(c.getByRole('button', { name: 'Criar roadmap' }))
    await waitFor(() => expect(args.onSubmit).toHaveBeenCalledOnce())
  },
}

export const ComErros: Story = {
  play: async ({ canvasElement, args }) => {
    const c = within(canvasElement)
    await userEvent.type(
      c.getByLabelText('Tópico 1 do módulo 1'),
      'Verbos{Enter}verbos',
    )
    await userEvent.click(c.getByRole('button', { name: 'Criar roadmap' }))
    await expect(await c.findByText('Dê um nome ao roadmap')).toBeVisible()
    await expect(c.getByText('Dê um nome ao módulo')).toBeVisible()
    await expect(c.getByText('Tópico repetido neste módulo')).toBeVisible()
    await expect(c.getByRole('alert')).toHaveTextContent(
      'Revise 3 campos destacados',
    )
    await expect(args.onSubmit).not.toHaveBeenCalled()
  },
}

export const AtalhosDeTeclado: Story = {
  args: {
    initial: {
      name: 'Inglês',
      modules: fromImportModules(
        [
          {
            title: 'Gramática',
            topics: [{ title: 'Verbos' }, { title: 'Tempos' }],
          },
          { title: 'Conversação', topics: [{ title: 'Diálogos' }] },
        ],
        [],
      ),
    },
  },
  play: async ({ canvasElement }) => {
    const c = within(canvasElement)
    // Alt+↓ no último tópico leva para o módulo seguinte
    c.getByLabelText('Tópico 2 do módulo 1').focus()
    await userEvent.keyboard('{Alt>}{ArrowDown}{/Alt}')
    await expect(c.getByLabelText('Tópico 1 do módulo 2')).toHaveValue('Tempos')
    // Alt+↑ no nome do módulo 2 sobe o módulo
    c.getByLabelText('Nome do módulo 2').focus()
    await userEvent.keyboard('{Alt>}{ArrowUp}{/Alt}')
    await expect(c.getByLabelText('Nome do módulo 1')).toHaveValue(
      'Conversação',
    )
  },
}

export const AdicionarAExistente: Story = {
  args: {
    destination: {
      kind: 'existing',
      id: 1,
      name: 'Backend com .NET',
      moduleTitles: ['C#', 'SQL Server', 'Docker'],
    },
  },
  play: async ({ canvasElement }) => {
    const c = within(canvasElement)
    await userEvent.click(
      c.getByRole('button', { name: /^Opções de Módulo 1/ }),
    )
    const item = await screen.findByRole('menuitemradio', {
      name: 'Depois de “SQL Server”',
    })
    await userEvent.click(item)
    await expect(await c.findByText('depois de “SQL Server”')).toBeVisible()
  },
}

export const Celular: Story = { globals: { viewport: { value: 'mobile' } } }

export const ImportarComErros: StoryObj = {
  render: () => (
    <ImportDialog
      open
      onOpenChange={fn()}
      onImport={async () => [
        { text: 'Filas: Cria um ciclo: Filas → Fundamentos → Filas', line: 5 },
        { text: 'Falta o título do tópico', line: 9 },
      ]}
    />
  ),
  play: async () => {
    const dialog = await screen.findByRole('dialog')
    await userEvent.click(
      within(dialog).getByRole('button', { name: 'Usar um exemplo' }),
    )
    await expect(
      within(dialog).getByLabelText('Ou cole o conteúdo'),
    ).toHaveValue(EXAMPLE_JSON)
    await userEvent.click(
      within(dialog).getByRole('button', { name: 'Importar' }),
    )
    await expect(await within(dialog).findByRole('alert')).toHaveTextContent(
      'Linha 5: Filas: Cria um ciclo',
    )
  },
}
