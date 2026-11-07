import type { Meta, StoryObj } from '@storybook/react-vite'
import { useQuery } from '@tanstack/react-query'
import { expect, within } from 'storybook/test'
import { errorMessage } from '@/lib/api/errors'
import { meQuery, roadmapsQuery } from '@/lib/api/queries'

/** Mostra o que a API mockada responde no cenário escolhido (barra de ferramentas › Cenário). */
function MockApiPreview() {
  const me = useQuery(meQuery())
  const roadmaps = useQuery(roadmapsQuery())
  if (me.isPending || roadmaps.isPending) return <p>Carregando…</p>
  if (me.error) return <p role="alert">{errorMessage(me.error)}</p>
  return (
    <div className="flex flex-col gap-2">
      <p>
        Olá, <strong>{me.data.name}</strong>
      </p>
      <ul className="list-disc pl-5">
        {roadmaps.data?.map((r) => (
          <li key={r.id}>
            {r.name} · {r.progress.percent}%
          </li>
        ))}
      </ul>
      {roadmaps.data?.length === 0 && <p>Nenhum roadmap ainda.</p>}
    </div>
  )
}

const meta = {
  title: 'Fundamentos/API mockada',
  component: MockApiPreview,
} satisfies Meta<typeof MockApiPreview>

export default meta
type Story = StoryObj<typeof meta>

export const Padrao: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(await canvas.findByText('Marina Costa')).toBeVisible()
    await expect(await canvas.findByText(/Backend com \.NET/)).toBeVisible()
  },
}

export const Vazio: Story = {
  parameters: { scenario: 'vazio' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(await canvas.findByText('Nenhum roadmap ainda.')).toBeVisible()
  },
}

export const Deslogado: Story = {
  parameters: { scenario: 'deslogado' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(await canvas.findByRole('alert')).toHaveTextContent(
      /sessão terminou/,
    )
  },
}
