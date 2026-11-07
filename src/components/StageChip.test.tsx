import { render, screen } from '@testing-library/react'
import { StageChip } from './StageChip'
import { STAGES, stageLabel } from '@/lib/stage'

describe('StageChip', () => {
  it.each(STAGES)('mostra o nome da etapa %s', (stage) => {
    render(<StageChip stage={stage} />)
    expect(screen.getByText(stageLabel[stage])).toBeInTheDocument()
  })

  it('aceita um texto no lugar do nome', () => {
    render(<StageChip stage="studying">Em andamento</StageChip>)
    expect(screen.getByText('Em andamento')).toHaveClass('bg-stage-studying')
  })
})
