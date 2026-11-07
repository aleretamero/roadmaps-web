import { Link, useRouterState } from '@tanstack/react-router'
import { Search } from 'lucide-react'
import { LogoMark } from '@/components/Logo'
import { cn } from '@/lib/utils'
import { AccountMenu } from './AccountMenu'
import type { AccountMenuProps } from './AccountMenu'

export type Section = 'dashboard' | 'roadmaps' | 'schedule' | null

/** Seção ativa da navegação. Roadmap, módulo e tópico ficam em "Meus roadmaps". */
export function sectionOf(pathname: string): Section {
  if (pathname.startsWith('/dashboard')) return 'dashboard'
  if (/^\/(roadmaps|modules|topics)(\/|$)/.test(pathname)) return 'roadmaps'
  if (pathname.startsWith('/schedule')) return 'schedule'
  return null
}

const NAV = [
  { section: 'dashboard', to: '/dashboard', label: 'Painel' },
  { section: 'roadmaps', to: '/roadmaps', label: 'Meus roadmaps' },
  { section: 'schedule', to: '/schedule', label: 'Agenda' },
] as const

export type AppHeaderProps = Omit<AccountMenuProps, 'className'> & {
  /** Abre a busca global (o mesmo que Ctrl+K). */
  onSearch?: () => void
}

/** Cabeçalho das telas logadas: marca, navegação principal e menu da conta. */
export function AppHeader({ onSearch, ...props }: AppHeaderProps) {
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const current = sectionOf(pathname)
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-surface">
      <div className="mx-auto flex max-w-[1264px] flex-wrap items-center gap-x-7 gap-y-1 px-4 py-3 sm:px-8">
        <Link
          to="/dashboard"
          aria-label="Roadmaps, ir para o painel"
          className="flex h-11 items-center gap-2.5 rounded-md text-base font-semibold tracking-tight text-ink-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          <LogoMark />
          Roadmaps
        </Link>
        <nav
          aria-label="Principal"
          className="order-3 -mx-1 flex w-full gap-1 md:order-none md:mx-0 md:w-auto"
        >
          {NAV.map((item) => {
            const active = item.section === current
            return (
              <Link
                key={item.to}
                to={item.to}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex h-11 items-center rounded-md px-3.5 font-medium whitespace-nowrap transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring max-sm:px-3',
                  active
                    ? 'bg-surface-sunken text-ink-strong'
                    : 'text-ink-muted hover:bg-surface-sunken hover:text-ink-strong',
                )}
              >
                {item.label}
              </Link>
            )
          })}
        </nav>
        {onSearch && (
          <button
            type="button"
            onClick={onSearch}
            aria-keyshortcuts="Control+K"
            className="order-4 flex h-11 w-full items-center gap-2.5 rounded-xl border border-line-control bg-canvas px-3.5 text-left text-ink-muted hover:border-ink-faint md:order-none md:ml-auto md:w-[380px]"
          >
            <Search className="size-4 flex-none" aria-hidden="true" />
            <span className="flex-1 truncate">
              Buscar tópicos, anotações e arquivos
            </span>
            <kbd className="hidden rounded border border-line bg-surface px-1.5 font-sans text-[11px] text-ink-muted sm:inline">
              Ctrl K
            </kbd>
          </button>
        )}
        <AccountMenu
          {...props}
          className={cn('order-2 ml-auto md:order-none', onSearch && 'md:ml-0')}
        />
      </div>
    </header>
  )
}
