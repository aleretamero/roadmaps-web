import { Link } from '@tanstack/react-router'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { initials } from '@/lib/user'
import { cn } from '@/lib/utils'

export type AccountMenuProps = {
  name: string
  email: string
  onLogout: () => void
  className?: string
}

/** Avatar com as iniciais e o menu da conta: Configurações e Sair. */
export function AccountMenu({
  name,
  email,
  onLogout,
  className,
}: AccountMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          'grid size-11 shrink-0 place-items-center rounded-full outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50',
          className,
        )}
      >
        <span
          aria-hidden="true"
          className="grid size-[34px] place-items-center rounded-full bg-avatar text-[13px] font-semibold text-avatar-fg"
        >
          {initials(name)}
        </span>
        <span className="sr-only">Conta de {name}</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuLabel className="flex flex-col gap-0.5 font-normal">
          <strong className="font-semibold text-ink-strong">{name}</strong>
          <span className="truncate text-xs text-ink-muted">{email}</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link to="/settings/$section" params={{ section: 'account' }}>
            Configurações
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={onLogout}>Sair</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
