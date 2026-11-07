import { Link, useRouterState } from '@tanstack/react-router'
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

export type AppHeaderProps = Omit<AccountMenuProps, 'className'>

/** Cabeçalho das telas logadas: marca, navegação principal e menu da conta. */
export function AppHeader(props: AppHeaderProps) {
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
        <AccountMenu {...props} className="order-2 ml-auto md:order-none" />
      </div>
    </header>
  )
}
