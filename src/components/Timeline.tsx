import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import type { Schemas } from '@/lib/api/client'
import { formatPlan, formatShort, toISODate } from '@/lib/date'
import { cn } from '@/lib/utils'

type Change = Schemas['ChangeLogEntry']

/** Dia (yyyy-mm-dd) de um instante ISO, no fuso de quem está vendo. */
export const dayOfInstant = (iso: string) => toISODate(new Date(iso))

const isDate = (v: unknown): v is string =>
  typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v)

/** Texto de uma alteração: usa o `payload` quando dá ("Data trocada: 4 de nov → 20 de nov"). */
export function changeText(c: Change): string {
  const p = (c.payload ?? {}) as Record<string, unknown>
  if (c.type === 'dateChanged' && isDate(p.before) && isDate(p.after))
    return `Data trocada: ${formatShort(p.before)} → ${formatShort(p.after)}`
  return c.description
}

/** Marca quais itens abrem um dia novo (o dia aparece só no primeiro item de cada dia). */
export function withDayBreaks<T>(
  items: ReadonlyArray<T>,
  dayOf: (item: T) => string,
) {
  return items.map((item, i) => ({
    item,
    day: dayOf(item),
    first: i === 0 || dayOf(items[i - 1]!) !== dayOf(item),
  }))
}

export function TimelineRow({
  day,
  showDay,
  mark,
  children,
  aside,
  last = false,
}: {
  day: string
  showDay: boolean
  mark?: React.ReactNode
  children: React.ReactNode
  aside?: React.ReactNode
  last?: boolean
}) {
  return (
    <li className="grid grid-cols-[76px_24px_minmax(0,1fr)_auto] items-start gap-x-2.5 sm:grid-cols-[88px_24px_minmax(0,1fr)_auto] sm:gap-x-3">
      <span className="pt-1 text-xs text-ink-muted">
        <time dateTime={day} className={cn(!showDay && 'sr-only')}>
          {formatPlan(day)}
        </time>
      </span>
      <span className="relative flex h-full justify-center">
        {!last && (
          <span
            aria-hidden="true"
            className="absolute top-6 bottom-[-12px] w-px bg-line"
          />
        )}
        <span className="relative">{mark}</span>
      </span>
      <div className="flex min-w-0 flex-col gap-2 pb-3">{children}</div>
      {aside ? <div className="flex-none">{aside}</div> : <span />}
    </li>
  )
}

export function TimelineCard({
  title,
  count,
  loading = false,
  error,
  empty,
  hasMore = false,
  loadingMore = false,
  onMore,
  className,
  children,
}: {
  title: string
  count?: string
  loading?: boolean
  error?: string | null
  empty?: string | null
  hasMore?: boolean
  loadingMore?: boolean
  onMore?: () => void
  className?: string
  children?: React.ReactNode
}) {
  const id = `tl-${title.replace(/\W+/g, '-').toLowerCase()}`
  return (
    <section
      aria-labelledby={id}
      className={cn(
        'flex min-w-0 flex-col gap-3 rounded-2xl border border-line bg-surface p-5',
        className,
      )}
    >
      <div className="flex items-baseline justify-between gap-3 border-b border-line-soft pb-3">
        <h2 id={id} className="text-lg font-semibold">
          {title}
        </h2>
        {count && <span className="text-[13px] text-ink-muted">{count}</span>}
      </div>
      {loading ? (
        <div
          role="status"
          aria-label={`Carregando ${title.toLocaleLowerCase('pt-BR')}`}
          className="flex flex-col gap-2"
        >
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-6 w-2/3" />
          <Skeleton className="h-6 w-1/2" />
        </div>
      ) : error ? (
        <p
          role="alert"
          className="rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger"
        >
          Não foi possível carregar. {error}
        </p>
      ) : empty ? (
        <p className="text-sm text-ink-muted">{empty}</p>
      ) : (
        <ol className="flex flex-col">{children}</ol>
      )}
      {hasMore && (
        <Button
          variant="outline"
          size="sm"
          className="self-start"
          disabled={loadingMore}
          onClick={onMore}
        >
          {loadingMore ? 'Carregando…' : 'Ver mais'}
        </Button>
      )}
    </section>
  )
}

/** Histórico de alterações (tópico ou módulo): data e texto de cada alteração. */
export function ChangesList({ changes }: { changes: ReadonlyArray<Change> }) {
  return (
    <>
      {changes.map((c) => (
        <li
          key={c.id}
          className="flex flex-col gap-0.5 border-t border-line-soft py-2.5 first:border-t-0 first:pt-0"
        >
          <time dateTime={c.occurredAt} className="text-xs text-ink-muted">
            {formatPlan(dayOfInstant(c.occurredAt))}
          </time>
          <span>{changeText(c)}</span>
        </li>
      ))}
    </>
  )
}
