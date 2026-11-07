import { useId } from 'react'
import { cn } from '@/lib/utils'

/** Cartão do painel: título h2 ligado à seção, ação opcional à direita. */
export function DashCard({
  title,
  aside,
  className,
  children,
}: {
  title: string
  aside?: React.ReactNode
  className?: string
  children: React.ReactNode
}) {
  const id = useId()
  return (
    <section
      aria-labelledby={id}
      className={cn(
        'flex min-w-0 flex-col gap-3 rounded-2xl border border-line bg-surface px-4 py-5 sm:px-[22px]',
        className,
      )}
    >
      <div className="flex flex-wrap items-baseline justify-between gap-x-2.5 gap-y-1">
        <h2 id={id} className="text-lg font-semibold">
          {title}
        </h2>
        {aside}
      </div>
      {children}
    </section>
  )
}
