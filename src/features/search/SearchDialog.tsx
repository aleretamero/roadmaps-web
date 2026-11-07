import { useInfiniteQuery } from '@tanstack/react-query'
import { FileText, Folder, Hash, StickyNote } from 'lucide-react'
import { useState } from 'react'
import { InfoTooltip } from '@/components/InfoTooltip'
import { StageChip } from '@/components/StageChip'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Command,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog'
import type { Schemas } from '@/lib/api/client'
import { errorMessage } from '@/lib/api/errors'
import { searchPagesQuery } from '@/lib/api/queries'
import type { SearchType } from '@/lib/api/queries'
import { useDebounced } from '@/lib/useDebounced'
import { cn } from '@/lib/utils'

type Result = Schemas['SearchResult']

/** Trecho da API com `<mark>` nos termos: vira texto e destaques (nada de HTML solto). */
export function snippetParts(
  snippet: string,
): Array<{ text: string; mark: boolean }> {
  const parts: Array<{ text: string; mark: boolean }> = []
  const re = /<mark>([\s\S]*?)<\/mark>/gi
  let last = 0
  for (let m = re.exec(snippet); m; m = re.exec(snippet)) {
    if (m.index > last)
      parts.push({ text: snippet.slice(last, m.index), mark: false })
    parts.push({ text: m[1] ?? '', mark: true })
    last = m.index + m[0].length
  }
  if (last < snippet.length)
    parts.push({ text: snippet.slice(last), mark: false })
  // Qualquer outra tag que vier é mostrada como texto, sem os sinais.
  return parts
    .map((p) => ({ ...p, text: p.text.replace(/<\/?[a-z][^>]*>/gi, '') }))
    .filter((p) => p.text)
}

const FILTERS: Array<[SearchType | undefined, string]> = [
  [undefined, 'Tudo'],
  ['topics', 'Tópicos'],
  ['notes', 'Anotações'],
  ['files', 'Arquivos'],
]

const TYPE = {
  topic: { label: 'Tópico', icon: Hash },
  note: { label: 'Anotação', icon: StickyNote },
  file: { label: 'Arquivo', icon: FileText },
} as const

export type SearchTarget = { topicId: number; tab?: 'notes' | 'files' }

/** Para onde um resultado leva: o tópico, na aba certa. */
export const targetOf = (r: Result): SearchTarget => ({
  topicId: r.topic.id,
  ...(r.type === 'note'
    ? { tab: 'notes' as const }
    : r.type === 'file'
      ? { tab: 'files' as const }
      : {}),
})

export type SearchDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onOpenResult: (target: SearchTarget) => void
}

/** Busca global (Ctrl+K): tópicos, anotações e arquivos, com filtros e navegação por teclado. */
export function SearchDialog({
  open,
  onOpenChange,
  onOpenResult,
}: SearchDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="top-[8vh] flex max-h-[84dvh] translate-y-0 flex-col gap-0 overflow-hidden bg-surface p-0 sm:max-w-[760px]"
      >
        <DialogTitle className="sr-only">Busca</DialogTitle>
        <DialogDescription className="sr-only">
          Busque em títulos de tópicos, anotações e arquivos. Use as setas para
          escolher e Enter para abrir.
        </DialogDescription>
        {open && <SearchBody onOpenResult={onOpenResult} />}
      </DialogContent>
    </Dialog>
  )
}

function SearchBody({
  onOpenResult,
}: {
  onOpenResult: (t: SearchTarget) => void
}) {
  const [q, setQ] = useState('')
  const [type, setType] = useState<SearchType | undefined>(undefined)
  const [archived, setArchived] = useState(false)
  const [page, setPage] = useState(0)
  const query = useDebounced(q.trim(), 250)
  const search = useInfiniteQuery(searchPagesQuery(query, type, archived))
  const pages = search.data?.pages ?? []
  const current = pages[Math.min(page, Math.max(pages.length - 1, 0))]
  const total = pages[0]?.total ?? 0
  const pageCount = Math.max(1, Math.ceil(total / 10))
  const items = current?.items ?? []
  const first = page * 10 + 1
  const reset = () => setPage(0)
  const short = query.length < 2

  return (
    <Command
      shouldFilter={false}
      loop
      className="flex min-h-0 flex-1 flex-col bg-surface"
      onKeyDown={(e) => {
        // As setas e o Enter escolhem resultados só a partir do campo de busca.
        // Nos filtros e na caixa "Incluir arquivados", o Enter aciona o próprio controle.
        const el = e.target as HTMLElement
        if (el.hasAttribute('cmdk-input')) return
        if (e.key === 'Enter' && el instanceof HTMLButtonElement) {
          e.preventDefault()
          el.click()
        } else if (
          ['ArrowDown', 'ArrowUp', 'Home', 'End', 'Enter'].includes(e.key)
        )
          e.preventDefault()
      }}
    >
      <div className="border-b border-line px-3 pt-3 pb-2.5 sm:px-5">
        <CommandInput
          value={q}
          onValueChange={(v) => {
            setQ(v)
            reset()
          }}
          placeholder="Buscar em títulos, anotações e arquivos"
          aria-label="Buscar em títulos, anotações e arquivos"
          className="h-11 text-base"
        />
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <div
            role="group"
            aria-label="Filtrar por tipo"
            className="flex flex-wrap gap-1"
          >
            {FILTERS.map(([k, label]) => (
              <button
                key={label}
                type="button"
                aria-pressed={type === k}
                onClick={() => {
                  setType(k)
                  reset()
                }}
                className={cn(
                  'h-8 rounded-full px-3 text-[13px]',
                  type === k
                    ? 'bg-ink text-surface'
                    : 'border border-line-control text-ink-strong hover:bg-canvas',
                )}
              >
                {label}
              </button>
            ))}
          </div>
          <InfoTooltip label="Dicas de busca">
            <p className="text-[13px]">
              Plural e acentos não importam. Use <code>"frase exata"</code> para
              a frase inteira, <code>prefixo*</code> para o começo de uma
              palavra e <code>-palavra</code> para excluir.
            </p>
          </InfoTooltip>
          <label
            htmlFor="search-archived"
            className="ml-auto flex items-center gap-2 text-[13px]"
          >
            <Checkbox
              id="search-archived"
              checked={archived}
              onCheckedChange={(v) => {
                setArchived(v === true)
                reset()
              }}
            />
            Incluir arquivados
          </label>
        </div>
      </div>
      <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto px-3 py-3 sm:px-5">
        {short ? (
          <p className="px-1 py-4 text-sm text-ink-muted">
            Digite pelo menos duas letras para buscar em títulos de tópicos,
            anotações e arquivos.
          </p>
        ) : search.error ? (
          <p
            role="alert"
            className="rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger"
          >
            Não foi possível buscar. {errorMessage(search.error)}
          </p>
        ) : search.isPending ? (
          <p role="status" className="px-1 py-4 text-sm text-ink-muted">
            Buscando…
          </p>
        ) : total === 0 ? (
          <div className="px-1 py-4">
            <p className="font-medium">Nenhum resultado para “{query}”</p>
            <p className="text-sm text-ink-muted">
              Tente outro termo
              {archived ? '' : ' ou inclua os roadmaps arquivados'}.
            </p>
          </div>
        ) : (
          <p role="status" className="px-1 text-[13px] text-ink-muted">
            {total} {total === 1 ? 'resultado' : 'resultados'}, do mais
            relevante ao menos · mostrando {first}–{first + items.length - 1}
          </p>
        )}
        <CommandList
          aria-label="Resultados da busca"
          className="max-h-none overflow-visible"
        >
          {!short &&
            items.map((r) => {
              const T = TYPE[r.type]
              return (
                <CommandItem
                  key={`${r.type}-${r.id}`}
                  value={`${r.type}-${r.id}`}
                  onSelect={() => onOpenResult(targetOf(r))}
                  className="mb-2 flex flex-col items-start gap-1 rounded-xl border border-line bg-surface px-4 py-3 text-left data-[selected=true]:border-ink data-[selected=true]:bg-canvas"
                >
                  <span className="flex items-center gap-1.5 text-xs text-ink-muted">
                    <Folder className="size-3.5" aria-hidden="true" />
                    {r.topic.roadmapName} <span aria-hidden="true">›</span>{' '}
                    {r.topic.moduleTitle}
                  </span>
                  <span className="flex flex-wrap items-center gap-2">
                    <T.icon
                      className="size-4 text-ink-muted"
                      aria-hidden="true"
                    />
                    <span className="text-base font-semibold text-ink">
                      {r.title}
                    </span>
                    <StageChip stage={r.stage} />
                    <span className="sr-only">{T.label}</span>
                  </span>
                  <span className="text-sm text-ink-strong">
                    {snippetParts(r.snippet).map((p, i) =>
                      p.mark ? (
                        <mark
                          key={i}
                          className="rounded-sm bg-stage-practicing px-0.5 text-ink"
                        >
                          {p.text}
                        </mark>
                      ) : (
                        <span key={i}>{p.text}</span>
                      ),
                    )}
                  </span>
                  <span className="text-xs text-ink-muted">
                    {T.label}
                    {r.type !== 'topic' && ` em ${r.topic.title}`}
                  </span>
                </CommandItem>
              )
            })}
        </CommandList>
        {!short && total > 10 && (
          <nav
            aria-label="Paginação"
            className="flex items-center justify-between gap-2"
          >
            <Button
              variant="outline"
              disabled={page === 0}
              onClick={() => setPage(page - 1)}
            >
              Anterior
            </Button>
            <span className="text-sm text-ink-strong">
              Página {page + 1} de {pageCount}
            </span>
            <Button
              variant="outline"
              disabled={page + 1 >= pageCount || search.isFetchingNextPage}
              onClick={() => {
                if (page + 1 >= pages.length) void search.fetchNextPage()
                setPage(page + 1)
              }}
            >
              Próxima
            </Button>
          </nav>
        )}
      </div>
    </Command>
  )
}
