import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { cn } from '@/lib/utils'

type InfoTooltipProps = {
  /** Nome acessível do botão "i" (ex.: "Atalhos do editor"). */
  label: string
  children: React.ReactNode
  className?: string
}

/**
 * Botão "i" que mostra uma explicação curta (atalhos do editor, operadores da busca).
 * Usa Popover para funcionar também no toque e com leitor de tela.
 */
export function InfoTooltip({ label, children, className }: InfoTooltipProps) {
  return (
    <Popover>
      <PopoverTrigger
        aria-label={label}
        className={cn(
          'grid size-7 shrink-0 cursor-help place-items-center rounded-full border border-line-control bg-surface font-serif text-[13px] font-bold text-ink-muted italic hover:bg-surface-sunken',
          className,
        )}
      >
        i
      </PopoverTrigger>
      <PopoverContent
        aria-label={label}
        className="w-72 text-sm leading-relaxed"
        align="end"
      >
        {children}
      </PopoverContent>
    </Popover>
  )
}
