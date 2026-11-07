import { cva } from 'class-variance-authority'
import { cn } from '@/lib/utils'
import { stageLabel } from '@/lib/stage'
import type { Stage } from '@/lib/stage'

const stageChip = cva(
  'inline-flex h-6.5 shrink-0 items-center rounded-full px-2.5 text-xs font-medium whitespace-nowrap',
  {
    variants: {
      stage: {
        planned: 'bg-stage-planned text-stage-planned-fg',
        studying: 'bg-stage-studying text-stage-studying-fg',
        practicing: 'bg-stage-practicing text-stage-practicing-fg',
        completed: 'bg-stage-completed text-stage-completed-fg',
      },
    },
  },
)

type StageChipProps = {
  stage: Stage
  /** Texto no lugar do nome da etapa (ex.: "Em andamento"). */
  children?: React.ReactNode
  className?: string
}

/** Selo de etapa usado em listas, cards e cabeçalhos (Planejado, Estudando, Praticando, Concluído). */
export function StageChip({ stage, children, className }: StageChipProps) {
  return (
    <span className={cn(stageChip({ stage }), className)}>
      {children ?? stageLabel[stage]}
    </span>
  )
}
