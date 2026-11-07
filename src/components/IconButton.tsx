import * as React from 'react'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

type IconButtonProps = Omit<React.ComponentProps<typeof Button>, 'size'> & {
  /** Nome acessível e texto do tooltip. Obrigatório: o botão só tem ícone. */
  label: string
  size?: 'sm' | 'md' | 'lg'
  round?: boolean
}

const sizes = { sm: 'icon-sm', md: 'icon', lg: 'icon-lg' } as const

/** Botão só com ícone (play, ⋯, fechar), sempre com nome acessível e tooltip. */
export function IconButton({
  label,
  size = 'md',
  round = false,
  variant = 'ghost',
  className,
  children,
  ...props
}: IconButtonProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant={variant}
          size={sizes[size]}
          aria-label={label}
          className={cn(round && 'rounded-full', className)}
          {...props}
        >
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  )
}
