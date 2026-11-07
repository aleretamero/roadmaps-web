import { useForm, useStore } from '@tanstack/react-form'
import { Plus, X } from 'lucide-react'
import { useState } from 'react'
import { DatePicker } from '@/components/DatePicker'
import { IconButton } from '@/components/IconButton'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import type { Schemas } from '@/lib/api/client'
import { cn } from '@/lib/utils'
import { splitPastedLines } from './topicLines'

type Row = { key: string; title: string; isOptional: boolean; date: string }

let seq = 0
const newRow = (title = ''): Row => ({
  key: `r${++seq}`,
  title,
  isOptional: false,
  date: '',
})
const blankRows = () => [newRow(), newRow(), newRow()]
const norm = (t: string) => t.trim().toLocaleLowerCase('pt-BR')

export type AddTopicsDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  moduleTitle: string
  roadmapName: string
  /** Títulos que já existem no módulo (para não repetir). */
  existingTitles: ReadonlyArray<string>
  saving?: boolean
  error?: string | null
  onSave: (topics: Array<Schemas['NewTopic']>) => void
}

const focusRow = (key: string, atEnd = true) =>
  requestAnimationFrame(() => {
    const el = document.querySelector<HTMLInputElement>(`[data-tbk="${key}"]`)
    if (!el) return
    el.focus()
    if (atEnd) el.setSelectionRange(el.value.length, el.value.length)
  })

/** Adicionar vários tópicos de uma vez no fim do módulo. */
export function AddTopicsDialog(props: AddTopicsDialogProps) {
  // Criado uma vez: linhas novas (chaves novas) a cada render reiniciariam o formulário sem parar.
  const [defaultValues] = useState(() => ({ rows: blankRows() }))
  const form = useForm({
    defaultValues,
    validators: {
      onSubmit: ({ value }) => {
        const filled = value.rows.filter((r) => r.title.trim())
        if (!filled.length) return 'Escreva pelo menos um tópico.'
        const seen = new Set(props.existingTitles.map(norm))
        for (const r of filled) {
          if (seen.has(norm(r.title)))
            return `“${r.title.trim()}” já existe neste módulo.`
          seen.add(norm(r.title))
        }
        return undefined
      },
    },
    onSubmit: ({ value }) =>
      props.onSave(
        value.rows
          .filter((r) => r.title.trim())
          .map((r) => ({
            title: r.title.trim(),
            isOptional: r.isOptional,
            date: r.date || null,
          })),
      ),
  })
  const rows = useStore(form.store, (s) => s.values.rows)
  const formError = useStore(form.store, (s) => s.errorMap.onSubmit)
  const count = rows.filter((r) => r.title.trim()).length

  const setRows = (next: Array<Row>) => form.setFieldValue('rows', next)

  const onKey = (e: React.KeyboardEvent<HTMLInputElement>, i: number) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault()
      void form.handleSubmit()
    } else if (e.key === 'Enter') {
      e.preventDefault()
      const r = newRow()
      setRows([...rows.slice(0, i + 1), r, ...rows.slice(i + 1)])
      focusRow(r.key)
    } else if (
      e.key === 'Backspace' &&
      !e.currentTarget.value &&
      rows.length > 1
    ) {
      e.preventDefault()
      const prev = rows[i - 1] ?? rows[i + 1]
      setRows(rows.filter((_r, k) => k !== i))
      if (prev) focusRow(prev.key)
    } else if (e.key === 'ArrowDown' && rows[i + 1]) {
      e.preventDefault()
      focusRow(rows[i + 1]!.key)
    } else if (e.key === 'ArrowUp' && rows[i - 1]) {
      e.preventDefault()
      focusRow(rows[i - 1]!.key)
    }
  }

  const onPaste = (e: React.ClipboardEvent<HTMLInputElement>, i: number) => {
    const lines = splitPastedLines(e.clipboardData.getData('text'))
    if (lines.length < 2) return
    e.preventDefault()
    const current = rows[i]!
    const first = { ...current, title: (current.title + lines[0]).trim() }
    const extra = lines.slice(1).map((t) => newRow(t))
    // Linhas vazias logo depois são reaproveitadas, para não sobrar linha em branco no meio.
    let after = rows.slice(i + 1)
    while (after[0] && !after[0].title.trim() && extra.length)
      after = after.slice(1)
    setRows([...rows.slice(0, i), first, ...extra, ...after])
    focusRow(extra.at(-1)!.key)
  }

  return (
    <Dialog
      open={props.open}
      onOpenChange={(o) => {
        if (!o) form.reset({ rows: blankRows() })
        props.onOpenChange(o)
      }}
    >
      <DialogContent className="max-h-[calc(100dvh-32px)] gap-0 overflow-y-auto p-0 sm:max-w-[640px]">
        <form
          noValidate
          onSubmit={(e) => {
            e.preventDefault()
            void form.handleSubmit()
          }}
        >
          <DialogHeader className="px-7 pt-6 pb-4">
            <span className="text-xs font-semibold tracking-[0.04em] text-ink-muted uppercase">
              {props.moduleTitle} · {props.roadmapName}
            </span>
            <DialogTitle className="text-[21px]">Adicionar tópicos</DialogTitle>
            <DialogDescription className="sr-only">
              Os tópicos entram no fim do módulo {props.moduleTitle}.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-2.5 px-7 pb-5">
            <div className="rounded-2xl border border-line px-3 py-2.5">
              <form.Field name="rows" mode="array">
                {() => (
                  <ul className="flex flex-col">
                    {rows.map((r, i) => (
                      <li
                        key={r.key}
                        className="group/row flex min-h-10 items-center gap-1.5"
                      >
                        <span
                          aria-hidden="true"
                          className={cn(
                            'ml-2 size-1.5 flex-none rounded-full',
                            r.isOptional
                              ? 'border-[1.5px] border-ink-subtle'
                              : 'bg-ink-subtle',
                          )}
                        />
                        <label htmlFor={`tr-${r.key}`} className="sr-only">
                          Tópico {i + 1}
                        </label>
                        <input
                          id={`tr-${r.key}`}
                          data-tbk={r.key}
                          value={r.title}
                          maxLength={160}
                          placeholder={
                            i === 0 ? 'Título do tópico' : 'Próximo tópico'
                          }
                          onChange={(e) =>
                            setRows(
                              rows.map((x, k) =>
                                k === i ? { ...x, title: e.target.value } : x,
                              ),
                            )
                          }
                          onKeyDown={(e) => onKey(e, i)}
                          onPaste={(e) => onPaste(e, i)}
                          className="h-9 min-w-0 flex-1 rounded-lg bg-transparent px-1.5 outline-none placeholder:text-ink-soft focus-visible:bg-canvas"
                        />
                        <button
                          type="button"
                          aria-pressed={r.isOptional}
                          title="Tópico opcional: não conta no progresso"
                          onClick={() =>
                            setRows(
                              rows.map((x, k) =>
                                k === i
                                  ? { ...x, isOptional: !x.isOptional }
                                  : x,
                              ),
                            )
                          }
                          className={cn(
                            'h-7 flex-none rounded-full px-2.5 text-xs font-medium',
                            r.isOptional
                              ? 'bg-ink text-surface'
                              : 'border border-line-strong text-ink',
                          )}
                        >
                          Opcional
                          <span className="sr-only"> (tópico {i + 1})</span>
                        </button>
                        <DatePicker
                          value={r.date}
                          label={`Data prevista do tópico ${i + 1}`}
                          onChange={(date) =>
                            setRows(
                              rows.map((x, k) =>
                                k === i ? { ...x, date } : x,
                              ),
                            )
                          }
                        />
                        <IconButton
                          label={`Remover tópico ${i + 1}`}
                          size="sm"
                          onClick={() =>
                            setRows(
                              rows.length > 1
                                ? rows.filter((_x, k) => k !== i)
                                : blankRows(),
                            )
                          }
                        >
                          <X />
                        </IconButton>
                      </li>
                    ))}
                  </ul>
                )}
              </form.Field>
              <button
                type="button"
                onClick={() => {
                  const r = newRow()
                  setRows([...rows, r])
                  focusRow(r.key)
                }}
                className="mt-1 inline-flex h-9 items-center gap-1.5 rounded-lg px-2 text-sm font-medium text-ink-strong hover:bg-canvas"
              >
                <Plus className="size-3.5" aria-hidden="true" />
                Adicionar linha
              </button>
            </div>
            <span className="text-xs text-ink-soft">
              Enter cria o próximo · Backspace num tópico vazio apaga · cole uma
              lista para criar vários de uma vez
            </span>
            {(formError || props.error) && (
              <p
                role="alert"
                className="rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger"
              >
                {props.error ?? String(formError)}
              </p>
            )}
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-7 py-4">
            <span className="text-xs text-ink-soft max-sm:hidden">
              Ctrl+Enter adiciona
            </span>
            <div className="ml-auto flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="lg"
                onClick={() => props.onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                size="lg"
                disabled={props.saving || count === 0}
              >
                {props.saving
                  ? 'Adicionando…'
                  : count > 1
                    ? `Adicionar ${count} tópicos`
                    : count === 1
                      ? 'Adicionar 1 tópico'
                      : 'Adicionar tópicos'}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
