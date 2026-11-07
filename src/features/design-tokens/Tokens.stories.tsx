import type { Meta, StoryObj } from '@storybook/react-vite'
import { TokensPage } from './TokensPage'

const meta = {
  title: 'Fundamentos/Tokens',
  component: TokensPage,
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof TokensPage>

export default meta
type Story = StoryObj<typeof meta>

export const Todos: Story = {}
