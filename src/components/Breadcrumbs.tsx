import { Link } from '@tanstack/react-router'
import type { LinkProps } from '@tanstack/react-router'

export type Crumb = { label: string; link?: LinkProps }

/**
 * Trilha das telas internas (Meus roadmaps / Backend com .NET / C#).
 * O último item é a página atual e não é link.
 */
export function Breadcrumbs({ items }: { items: ReadonlyArray<Crumb> }) {
  return (
    <nav aria-label="Localização" className="text-sm text-ink-muted">
      <ol className="flex flex-wrap items-center gap-2">
        {items.map((item, i) => {
          const last = i === items.length - 1
          return (
            <li key={i} className="flex min-w-0 items-center gap-2">
              {item.link && !last ? (
                <Link
                  {...item.link}
                  className="text-link underline underline-offset-2 hover:no-underline focus-visible:rounded-xs focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                >
                  {item.label}
                </Link>
              ) : (
                <span
                  aria-current={last ? 'page' : undefined}
                  className="truncate"
                >
                  {item.label}
                </span>
              )}
              {!last && <span aria-hidden="true">/</span>}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
