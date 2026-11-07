import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, userEvent, within } from 'storybook/test'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './tabs'

const meta = {
  title: 'Base/Tabs',
  component: Tabs,
} satisfies Meta<typeof Tabs>

export default meta
type Story = StoryObj<typeof meta>

export const SecoesDoModulo: Story = {
  render: () => (
    <Tabs defaultValue="topics">
      <TabsList aria-label="Seções do módulo">
        <TabsTrigger value="topics">Tópicos</TabsTrigger>
        <TabsTrigger value="timeline">Linha do tempo</TabsTrigger>
        <TabsTrigger value="notes">Anotações</TabsTrigger>
      </TabsList>
      <TabsContent value="topics">Lista de tópicos</TabsContent>
      <TabsContent value="timeline">Linha do tempo do módulo</TabsContent>
      <TabsContent value="notes">Anotações do módulo</TabsContent>
    </Tabs>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('tab', { name: 'Anotações' }))
    await expect(canvas.getByText('Anotações do módulo')).toBeVisible()
  },
}
