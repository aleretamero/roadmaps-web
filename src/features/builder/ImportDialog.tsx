import { ChevronRight, Upload } from 'lucide-react'
import { useId, useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import { EXAMPLE_JSON, FORMAT_JSON } from './importFormat'
import type { ImportProblem } from './model'

export type ImportDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Valida (local + `dryRun` na API). Devolve os problemas ou `null` se importou. */
  onImport: (
    text: string,
    source: string,
  ) => Promise<Array<ImportProblem> | null>
}

/** Importar JSON: arrastar/escolher arquivo ou colar; mostra os erros por linha. */
export function ImportDialog({
  open,
  onOpenChange,
  onImport,
}: ImportDialogProps) {
  const [text, setText] = useState('')
  const [problems, setProblems] = useState<Array<ImportProblem>>([])
  const [source, setSource] = useState('o conteúdo colado')
  const [busy, setBusy] = useState(false)
  const [showFormat, setShowFormat] = useState(false)
  const [dragging, setDragging] = useState(false)
  const fileId = useId()
  const pasteId = useId()

  const run = async (content: string, from: string) => {
    setBusy(true)
    setSource(from)
    try {
      const result = await onImport(content, from)
      setProblems(result ?? [])
      if (!result) {
        setText('')
        onOpenChange(false)
      }
    } finally {
      setBusy(false)
    }
  }

  const readFile = async (file: File | undefined) => {
    if (!file) return
    const content = await file.text()
    setText(content)
    await run(content, file.name)
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) setProblems([])
        onOpenChange(o)
      }}
    >
      <DialogContent
        className="max-h-[calc(100dvh-32px)] overflow-y-auto sm:max-w-[620px]"
        onDragOver={(e) => {
          e.preventDefault()
          setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDragging(false)
          void readFile(e.dataTransfer.files[0])
        }}
      >
        <DialogHeader>
          <DialogTitle className="text-[21px]">Importar JSON</DialogTitle>
          <DialogDescription>
            Substitui os módulos que estão no editor. Você revisa antes de
            salvar.
          </DialogDescription>
        </DialogHeader>
        <div
          className={cn(
            'flex flex-wrap items-center justify-center gap-2 rounded-xl border-[1.5px] border-dashed border-line-control px-4 py-5 text-center text-sm text-ink-muted',
            dragging && 'border-link bg-stage-studying',
          )}
        >
          <Upload className="size-4" aria-hidden="true" />
          <span>
            Arraste um arquivo <strong>.json</strong> para cá ou
          </span>
          <label
            htmlFor={fileId}
            className="cursor-pointer font-medium text-link underline underline-offset-2 focus-within:outline-2"
          >
            escolha um arquivo
          </label>
          <input
            id={fileId}
            type="file"
            accept=".json,application/json"
            className="sr-only"
            onChange={(e) => void readFile(e.target.files?.[0])}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor={pasteId} className="text-sm font-medium">
            Ou cole o conteúdo
          </label>
          <Textarea
            id={pasteId}
            value={text}
            onChange={(e) => setText(e.target.value)}
            spellCheck={false}
            placeholder='{ "nome": "...", "modulos": [ ... ] }'
            className="min-h-40 font-mono text-[13px]"
          />
        </div>
        {problems.length > 0 && (
          <div
            role="alert"
            className="rounded-xl bg-danger-soft px-4 py-3 text-sm text-danger"
          >
            <strong>Não importei {source}:</strong>
            <ul className="mt-1 list-disc pl-5">
              {problems.map((p, i) => (
                <li key={i}>
                  {p.line ? (
                    <span className="font-medium">Linha {p.line}: </span>
                  ) : null}
                  {p.text}
                </li>
              ))}
            </ul>
          </div>
        )}
        <div>
          <button
            type="button"
            aria-expanded={showFormat}
            onClick={() => setShowFormat((s) => !s)}
            className="inline-flex items-center gap-1 text-sm font-medium text-link"
          >
            <ChevronRight
              className={cn(
                'size-4 transition-transform',
                showFormat && 'rotate-90',
              )}
              aria-hidden="true"
            />
            Ver o formato aceito
          </button>
          {showFormat && (
            <div className="mt-2 flex flex-col gap-2 text-sm text-ink-muted">
              <span>
                <code>depoisDe</code>: coloca o módulo logo depois de outro. Os
                que vinham depois passam a vir depois dele.
              </span>
              <span>
                <code>alternativaA</code>: cria mais um caminho ao lado de
                outro. Ex.: Vue ao lado de React e Angular.
              </span>
              <span>
                Sem nenhum dos dois, o módulo vai para o final. Para um roadmap
                novo, use também <code>nome</code> e <code>objetivo</code>. As
                chaves em inglês do contrato (<code>name</code>,{' '}
                <code>modules</code>, <code>after</code>…) também valem.
              </span>
              <pre className="overflow-x-auto rounded-lg bg-surface-sunken p-3 font-mono text-xs text-ink-strong">
                {FORMAT_JSON}
              </pre>
            </div>
          )}
        </div>
        <DialogFooter className="flex-row flex-wrap items-center justify-between gap-2 sm:justify-between">
          <Button
            type="button"
            variant="ghost"
            onClick={() => setText(EXAMPLE_JSON)}
          >
            Usar um exemplo
          </Button>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              disabled={busy}
              onClick={() =>
                text.trim()
                  ? void run(text, 'o conteúdo colado')
                  : setProblems([
                      { text: 'Cole o conteúdo de um arquivo JSON.' },
                    ])
              }
            >
              {busy ? 'Conferindo…' : 'Importar'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
