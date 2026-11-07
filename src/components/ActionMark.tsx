import { cn } from '@/lib/utils'
import type { SessionAction } from '@/lib/actions'

const STYLE: Record<SessionAction | 'planned', string> = {
  studied: 'bg-stage-studying text-stage-studying-fg',
  practiced: 'bg-stage-practicing text-stage-practicing-fg',
  completed: 'bg-stage-completed text-stage-completed-fg',
  planned: 'border border-dashed border-ink-faint bg-surface text-ink-soft',
}

function Icon({ action }: { action: SessionAction | 'planned' }) {
  const common = {
    viewBox: '0 0 16 16',
    fill: 'none',
    stroke: 'currentColor',
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
    className: 'size-4',
  }
  if (action === 'studied')
    return (
      <svg {...common} strokeWidth="1.8">
        <path d="M8 4.2C6.8 3.3 5 3 2.5 3v9.5c2.5 0 4.3.3 5.5 1.2 1.2-.9 3-1.2 5.5-1.2V3C11 3 9.2 3.3 8 4.2zM8 4.2v9.5" />
      </svg>
    )
  if (action === 'practiced')
    return (
      <svg {...common} strokeWidth="1.8">
        <path d="M5.5 4.5L2 8l3.5 3.5M10.5 4.5L14 8l-3.5 3.5" />
      </svg>
    )
  if (action === 'completed')
    return (
      <svg {...common} strokeWidth="2.2">
        <path d="M3 8.5l3.2 3.2L13 4.8" />
      </svg>
    )
  return (
    <svg {...common} strokeWidth="1.8">
      <circle cx="8" cy="8" r="5.5" />
      <path d="M8 5v3.2l2 1.3" />
    </svg>
  )
}

/** Marca redonda de "estudei / pratiquei / concluí" (ou agendado). Decorativa. */
export function ActionMark({
  action,
  size = 'md',
  className,
}: {
  action: SessionAction | 'planned'
  size?: 'sm' | 'md' | 'lg'
  className?: string
}) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'grid flex-none place-items-center rounded-full',
        size === 'sm' && 'size-5 [&_svg]:size-3',
        size === 'md' && 'size-6',
        size === 'lg' && 'size-[30px]',
        STYLE[action],
        className,
      )}
    >
      <Icon action={action} />
    </span>
  )
}
