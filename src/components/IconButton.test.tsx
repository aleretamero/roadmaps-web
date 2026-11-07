import { screen } from '@testing-library/react'
import { renderWithProviders as render } from '@/test/render'
import { MoreHorizontal } from 'lucide-react'
import { IconButton } from './IconButton'

describe('IconButton', () => {
  it('tem nome acessível mesmo só com ícone', () => {
    render(
      <IconButton label="Ações do tópico">
        <MoreHorizontal />
      </IconButton>,
    )
    expect(
      screen.getByRole('button', { name: 'Ações do tópico' }),
    ).toBeInTheDocument()
  })
})
