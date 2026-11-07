import { useQuery } from '@tanstack/react-query'
import {
  ChevronRight,
  File,
  FileText,
  Folder,
  FolderOpen,
  FolderPlus,
  FolderUp,
  Image as ImageIcon,
  MoveRight,
  Pencil,
  Trash2,
  Upload,
} from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { errorMessage, isApiError } from '@/lib/api/errors'
import {
  fileContentQuery,
  filesQuery,
  useCreateFolder,
  useDeleteFile,
  useMoveFile,
  useRefreshFiles,
} from '@/lib/api/queries'
import { MAX_UPLOAD_BYTES, uploadFile } from '@/lib/api/upload'
import { cn } from '@/lib/utils'
import { DriveNotice } from './FilesTab'
import {
  allFolders,
  findNode,
  formatBytes,
  isImage,
  isText,
  joinPath,
  nameProblem,
  parentOf,
  visibleRows,
} from './fileTree'
import type { FileNode } from './fileTree'

type Editing =
  { kind: 'rename'; path: string } | { kind: 'folder'; dir: string } | null
type Upload = { key: string; name: string; progress: number; error?: string }

const label = (path: string) => (path ? path : 'raiz do tópico')

function Preview({ node }: { node: FileNode | null }) {
  const as = node && isImage(node) ? 'blob' : 'text'
  const can =
    !!node &&
    node.type === 'file' &&
    node.id !== null &&
    (isImage(node) || isText(node))
  const q = useQuery({ ...fileContentQuery(node?.id ?? 0, as), enabled: can })
  const url = useMemo(
    () => (q.data instanceof Blob ? URL.createObjectURL(q.data) : null),
    [q.data],
  )
  useEffect(
    () => () => {
      if (url) URL.revokeObjectURL(url)
    },
    [url],
  )
  if (!node)
    return (
      <p className="grid h-full min-h-[200px] place-items-center p-6 text-center text-sm text-ink-muted">
        Escolha um arquivo para ver aqui.
      </p>
    )
  if (node.type === 'folder')
    return (
      <div className="flex h-full min-h-[200px] flex-col items-center justify-center gap-1.5 p-6 text-center">
        <FolderOpen className="size-8 text-ink-muted" aria-hidden="true" />
        <strong>{node.name || 'Arquivos do tópico'}</strong>
        <span className="text-sm text-ink-muted">
          {(node.children ?? []).length}{' '}
          {(node.children ?? []).length === 1 ? 'item' : 'itens'}
        </span>
        <span className="text-xs text-ink-muted">
          Arraste arquivos para cá para enviar para esta pasta.
        </span>
      </div>
    )
  return (
    <div className="flex h-full min-h-[200px] flex-col">
      <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-line px-4 py-2.5">
        <span className="flex min-w-0 flex-col">
          <strong className="truncate">{node.name}</strong>
          <code className="truncate text-xs text-ink-muted">{node.path}</code>
        </span>
        <span className="text-xs text-ink-muted">
          {[node.mimeType, formatBytes(node.sizeBytes)]
            .filter(Boolean)
            .join(' · ')}
        </span>
      </div>
      {!can ? (
        <p className="p-6 text-sm text-ink-muted">
          Sem pré-visualização para este tipo de arquivo.
        </p>
      ) : q.isPending ? (
        <div
          role="status"
          aria-label="Carregando a pré-visualização"
          className="p-4"
        >
          <Skeleton className="h-32 w-full" />
        </div>
      ) : q.error ? (
        <p role="alert" className="p-4 text-sm text-danger">
          Não foi possível abrir o arquivo. {errorMessage(q.error)}
        </p>
      ) : typeof q.data === 'string' ? (
        <pre
          aria-label={`Conteúdo de ${node.name}`}
          // Área com rolagem precisa receber foco pelo teclado (WCAG 2.1.1).
          // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
          tabIndex={0}
          className="max-h-[420px] flex-1 overflow-auto bg-code-bg p-4 font-mono text-[13px] leading-relaxed text-code-fg"
        >
          {q.data.split('\n').map((line, i) => (
            <div key={i} className="flex gap-4">
              <span
                aria-hidden="true"
                className="w-8 flex-none text-right text-code-muted select-none"
              >
                {i + 1}
              </span>
              <code className="whitespace-pre-wrap">{line || ' '}</code>
            </div>
          ))}
        </pre>
      ) : (
        url && (
          <img
            src={url}
            alt={`Pré-visualização de ${node.name}`}
            className="m-auto max-h-[420px] max-w-full p-4"
          />
        )
      )}
    </div>
  )
}

function NameInput({
  initial,
  label: aria,
  siblings,
  onSubmit,
  onCancel,
}: {
  initial: string
  label: string
  siblings: ReadonlyArray<string>
  onSubmit: (name: string) => void
  onCancel: () => void
}) {
  const [v, setV] = useState(initial)
  const [err, setErr] = useState<string | null>(null)
  const ref = useRef<HTMLInputElement>(null)
  useEffect(() => {
    ref.current?.focus()
    ref.current?.select()
  }, [])
  const submit = () => {
    const p = nameProblem(v, siblings)
    if (p) setErr(p)
    else onSubmit(v.trim())
  }
  return (
    <span className="flex min-w-0 flex-1 flex-col">
      <Input
        ref={ref}
        value={v}
        aria-label={aria}
        aria-invalid={err ? true : undefined}
        aria-describedby={err ? 'fs-name-err' : undefined}
        onChange={(e) => {
          setV(e.target.value)
          setErr(null)
        }}
        onKeyDown={(e) => {
          e.stopPropagation()
          if (e.key === 'Enter') {
            e.preventDefault()
            submit()
          } else if (e.key === 'Escape') {
            e.preventDefault()
            onCancel()
          }
        }}
        onBlur={() =>
          v.trim() && v.trim() !== initial ? submit() : onCancel()
        }
        className="h-8"
      />
      {err && (
        <span id="fs-name-err" role="alert" className="text-xs text-danger">
          {err}
        </span>
      )}
    </span>
  )
}

/** Aba Arquivos com o Drive conectado: árvore com teclado, envio com progresso, pastas, renomear, mover, apagar e pré-visualização. */
export function FileExplorer({ topicId }: { topicId: number }) {
  const q = useQuery(filesQuery(topicId))
  const createFolder = useCreateFolder(topicId)
  const move = useMoveFile(topicId)
  const remove = useDeleteFile(topicId)
  const refresh = useRefreshFiles(topicId)
  const [expanded, setExpanded] = useState<ReadonlySet<string>>(new Set())
  const [selected, setSelected] = useState<string | null>(null)
  const [editing, setEditing] = useState<Editing>(null)
  const [deleting, setDeleting] = useState<FileNode | null>(null)
  const [moving, setMoving] = useState<FileNode | null>(null)
  const [moveTo, setMoveTo] = useState('')
  const [uploads, setUploads] = useState<Array<Upload>>([])
  const [dropTarget, setDropTarget] = useState<string | null>(null)
  const [msg, setMsg] = useState('')
  const treeRef = useRef<HTMLDivElement>(null)

  if (q.isPending)
    return (
      <div role="status" aria-label="Carregando arquivos">
        <Skeleton className="h-60 w-full" />
      </div>
    )
  if (isApiError(q.error, 'drive_not_connected'))
    return <DriveNotice topicId={topicId} />
  if (q.error)
    return (
      <div
        role="alert"
        className="flex flex-wrap items-center gap-3 rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger"
      >
        Não foi possível carregar os arquivos. {errorMessage(q.error)}
        <Button size="sm" variant="outline" onClick={() => void q.refetch()}>
          Tentar de novo
        </Button>
      </div>
    )

  const root = q.data.root
  const rows = visibleRows(root, expanded)
  const sel = selected !== null ? findNode(root, selected) : null
  /** Pasta onde entram envios e pastas novas: a selecionada, ou a pasta do arquivo selecionado. */
  const targetDir = sel
    ? sel.type === 'folder'
      ? sel.path
      : parentOf(sel.path)
    : ''
  const focusRow = (path: string) =>
    requestAnimationFrame(() =>
      treeRef.current
        ?.querySelector<HTMLElement>(`[data-path="${CSS.escape(path)}"]`)
        ?.focus(),
    )
  const expand = (path: string, open = true) =>
    setExpanded((s) => {
      const n = new Set(s)
      for (let p = path; p; p = parentOf(p)) if (open || p !== path) n.add(p)
      if (!open) n.delete(path)
      return n
    })
  const siblingsOf = (dir: string, except?: string) =>
    (findNode(root, dir)?.children ?? [])
      .map((c) => c.name)
      .filter((n) => n !== except)

  const upload = async (files: ReadonlyArray<File>, dir: string) => {
    const list = files.map((f, i) => {
      const rel = (f as File & { webkitRelativePath?: string })
        .webkitRelativePath
      const sub = rel ? parentOf(rel) : ''
      return {
        file: f,
        dir: joinPath(dir, sub),
        key: `${Date.now()}-${i}-${f.name}`,
      }
    })
    setUploads((u) => [
      ...u,
      ...list.map((x) => ({ key: x.key, name: x.file.name, progress: 0 })),
    ])
    let ok = 0
    for (const x of list) {
      const set = (patch: Partial<Upload>) =>
        setUploads((u) =>
          u.map((it) => (it.key === x.key ? { ...it, ...patch } : it)),
        )
      if (x.file.size > MAX_UPLOAD_BYTES) {
        set({ error: 'maior que 20 MB' })
        continue
      }
      try {
        await uploadFile(topicId, x.file, x.dir, (p) => set({ progress: p }))
        ok++
        set({ progress: 1 })
      } catch (e) {
        set({ error: errorMessage(e) })
      }
    }
    refresh()
    if (dir) expand(dir)
    setMsg(
      `${ok} de ${list.length} ${list.length === 1 ? 'arquivo enviado' : 'arquivos enviados'} para ${label(dir)}.`,
    )
    if (ok)
      toast.success(ok === 1 ? 'Arquivo enviado' : `${ok} arquivos enviados`)
    setTimeout(
      () => setUploads((u) => u.filter((it) => it.error || it.progress < 1)),
      1500,
    )
  }

  const doMove = (node: FileNode, dir: string) => {
    const to = joinPath(dir, node.name)
    if (
      to === node.path ||
      dir === node.path ||
      dir.startsWith(`${node.path}/`)
    )
      return
    if (siblingsOf(dir).includes(node.name)) {
      toast.error(`Já existe “${node.name}” em ${label(dir)}.`)
      return
    }
    move.mutate(
      { from: node.path, to },
      {
        onSuccess: () => {
          expand(dir)
          setSelected(to)
          setMsg(`“${node.name}” movido para ${label(dir)}.`)
          toast.success(`Movido para ${label(dir)}`)
        },
        onError: (e) => toast.error(errorMessage(e)),
      },
    )
  }

  const onKey = (e: React.KeyboardEvent, index: number) => {
    const r = rows[index]!
    const n = r.node
    const go = (i: number) => {
      const t = rows[Math.max(0, Math.min(rows.length - 1, i))]
      if (t) {
        setSelected(t.node.path)
        focusRow(t.node.path)
      }
    }
    switch (e.key) {
      case 'ArrowDown':
        go(index + 1)
        break
      case 'ArrowUp':
        go(index - 1)
        break
      case 'Home':
        go(0)
        break
      case 'End':
        go(rows.length - 1)
        break
      case 'ArrowRight':
        if (n.type === 'folder') {
          if (!expanded.has(n.path)) expand(n.path)
          else if (rows[index + 1]?.parent === n.path) go(index + 1)
        }
        break
      case 'ArrowLeft':
        if (n.type === 'folder' && expanded.has(n.path)) expand(n.path, false)
        else if (r.parent !== null)
          go(rows.findIndex((x) => x.node.path === r.parent))
        break
      case 'Enter':
      case ' ':
        setSelected(n.path)
        if (n.type === 'folder') expand(n.path, !expanded.has(n.path))
        break
      case 'F2':
        setEditing({ kind: 'rename', path: n.path })
        break
      case 'Delete':
        setDeleting(n)
        break
      default:
        return
    }
    e.preventDefault()
  }

  const dropProps = (dir: string) => ({
    onDragOver: (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setDropTarget(dir)
    },
    onDragLeave: () => setDropTarget((d) => (d === dir ? null : d)),
    onDrop: (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setDropTarget(null)
      const moved = e.dataTransfer.getData('application/x-roadmaps-path')
      if (moved) {
        const node = findNode(root, moved)
        if (node) doMove(node, dir)
      } else if (e.dataTransfer.files.length)
        void upload(Array.from(e.dataTransfer.files), dir)
    },
  })

  const activePath = selected ?? rows[0]?.node.path ?? null
  const newFolderRow = editing?.kind === 'folder' && (
    <div
      className="flex items-center gap-2 px-2 py-1"
      style={{
        paddingLeft: 8 + (editing.dir ? editing.dir.split('/').length : 0) * 18,
      }}
    >
      <Folder className="size-4 flex-none text-ink-muted" aria-hidden="true" />
      <NameInput
        initial=""
        label={`Nome da nova pasta em ${label(editing.dir)}`}
        siblings={siblingsOf(editing.dir)}
        onCancel={() => setEditing(null)}
        onSubmit={(name) => {
          const path = joinPath(editing.dir, name)
          setEditing(null)
          createFolder.mutate(path, {
            onSuccess: () => {
              expand(path)
              setSelected(path)
              focusRow(path)
              setMsg(`Pasta “${name}” criada em ${label(editing.dir)}.`)
            },
            onError: (err) => toast.error(errorMessage(err)),
          })
        }}
      />
    </div>
  )

  return (
    <section
      aria-labelledby="files-title"
      className="overflow-hidden rounded-2xl border border-line bg-surface"
    >
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-4 py-2.5">
        <h2 id="files-title" className="text-lg font-semibold">
          Explorador{' '}
          <span className="text-[13px] font-normal text-ink-muted">
            · {q.data.totalFiles}{' '}
            {q.data.totalFiles === 1 ? 'arquivo' : 'arquivos'}
          </span>
        </h2>
        <div
          role="toolbar"
          aria-label="Ações dos arquivos"
          className="flex flex-wrap items-center gap-1"
        >
          <label
            htmlFor="fs-files"
            title={`Enviar arquivos para ${label(targetDir)}`}
            className="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-md px-2.5 text-[13px] hover:bg-surface-sunken has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-link"
          >
            <Upload className="size-4" aria-hidden="true" />
            Enviar arquivos
            <input
              id="fs-files"
              type="file"
              multiple
              className="sr-only"
              onChange={(e) => {
                const files = Array.from(e.target.files ?? [])
                e.target.value = ''
                if (files.length) void upload(files, targetDir)
              }}
            />
          </label>
          <label
            htmlFor="fs-folder"
            title={`Enviar uma pasta para ${label(targetDir)}`}
            className="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-md px-2.5 text-[13px] hover:bg-surface-sunken has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-link"
          >
            <FolderUp className="size-4" aria-hidden="true" />
            Enviar pasta
            <input
              id="fs-folder"
              type="file"
              multiple
              className="sr-only"
              {...({ webkitdirectory: '', directory: '' } as Record<
                string,
                string
              >)}
              onChange={(e) => {
                const files = Array.from(e.target.files ?? [])
                e.target.value = ''
                if (files.length) void upload(files, targetDir)
              }}
            />
          </label>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setEditing({ kind: 'folder', dir: targetDir })}
          >
            <FolderPlus aria-hidden="true" />
            Nova pasta
          </Button>
          <Button
            variant="ghost"
            size="sm"
            disabled={!sel || !sel.path}
            onClick={() =>
              sel && setEditing({ kind: 'rename', path: sel.path })
            }
          >
            <Pencil aria-hidden="true" />
            Renomear
          </Button>
          <Button
            variant="ghost"
            size="sm"
            disabled={!sel || !sel.path}
            onClick={() => {
              if (!sel) return
              setMoveTo(parentOf(sel.path))
              setMoving(sel)
            }}
          >
            <MoveRight aria-hidden="true" />
            Mover
          </Button>
          <Button
            variant="ghost"
            size="sm"
            disabled={!sel || !sel.path}
            onClick={() => sel && setDeleting(sel)}
          >
            <Trash2 aria-hidden="true" />
            Apagar
          </Button>
        </div>
      </div>

      <div className="grid md:grid-cols-[minmax(260px,2fr)_3fr]">
        <div
          {...dropProps('')}
          className={cn(
            'flex min-h-[140px] flex-col border-line md:min-h-[260px] md:border-r',
            dropTarget === '' && 'bg-stage-studying',
          )}
        >
          {editing?.kind === 'folder' && editing.dir === '' && newFolderRow}
          <div
            ref={treeRef}
            role="tree"
            aria-label="Arquivos do tópico"
            className="flex flex-col py-1"
          >
            {rows.map((r, i) => {
              const n = r.node
              const open = n.type === 'folder' && expanded.has(n.path)
              const Icon =
                n.type === 'folder'
                  ? open
                    ? FolderOpen
                    : Folder
                  : isImage(n)
                    ? ImageIcon
                    : isText(n)
                      ? FileText
                      : File
              const renaming =
                editing?.kind === 'rename' && editing.path === n.path
              return (
                <div key={n.path} role="none">
                  <div
                    role="treeitem"
                    data-path={n.path}
                    aria-level={r.level}
                    aria-expanded={n.type === 'folder' ? open : undefined}
                    aria-selected={selected === n.path}
                    tabIndex={n.path === activePath ? 0 : -1}
                    draggable={!renaming}
                    onDragStart={(e) => {
                      e.dataTransfer.setData(
                        'application/x-roadmaps-path',
                        n.path,
                      )
                      e.dataTransfer.effectAllowed = 'move'
                    }}
                    {...(n.type === 'folder' ? dropProps(n.path) : {})}
                    onClick={() => {
                      setSelected(n.path)
                      if (n.type === 'folder') expand(n.path, !open)
                    }}
                    onKeyDown={(e) => onKey(e, i)}
                    className={cn(
                      'flex h-9 cursor-default items-center gap-1.5 pr-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-link focus-visible:ring-inset',
                      selected === n.path
                        ? 'bg-surface-sunken'
                        : 'hover:bg-canvas',
                      dropTarget === n.path && 'bg-stage-studying',
                    )}
                    style={{ paddingLeft: 8 + (r.level - 1) * 18 }}
                  >
                    {n.type === 'folder' ? (
                      <ChevronRight
                        className={cn(
                          'size-3.5 flex-none text-ink-muted transition-transform',
                          open && 'rotate-90',
                        )}
                        aria-hidden="true"
                      />
                    ) : (
                      <span className="w-3.5 flex-none" />
                    )}
                    <Icon
                      className="size-4 flex-none text-ink-muted"
                      aria-hidden="true"
                    />
                    {renaming ? (
                      <NameInput
                        initial={n.name}
                        label={`Novo nome de ${n.name}`}
                        siblings={siblingsOf(parentOf(n.path), n.name)}
                        onCancel={() => {
                          setEditing(null)
                          focusRow(n.path)
                        }}
                        onSubmit={(name) => {
                          setEditing(null)
                          if (name === n.name) return
                          const to = joinPath(parentOf(n.path), name)
                          move.mutate(
                            { from: n.path, to },
                            {
                              onSuccess: () => {
                                setSelected(to)
                                focusRow(to)
                                setMsg(`“${n.name}” agora se chama “${name}”.`)
                              },
                              onError: (err) => toast.error(errorMessage(err)),
                            },
                          )
                        }}
                      />
                    ) : (
                      <span className="min-w-0 flex-1 truncate">
                        {n.type === 'folder' && (
                          <span className="sr-only">Pasta </span>
                        )}
                        {n.name}
                      </span>
                    )}
                    {n.type === 'file' && !renaming && (
                      <span className="flex-none text-xs text-ink-soft">
                        <span className="sr-only">, </span>
                        {formatBytes(n.sizeBytes)}
                      </span>
                    )}
                  </div>
                  {editing?.kind === 'folder' &&
                    editing.dir === n.path &&
                    open &&
                    newFolderRow}
                </div>
              )
            })}
          </div>
          {rows.length === 0 && editing === null && (
            <p className="m-3 rounded-xl border border-dashed border-line-control p-4 text-center text-sm text-ink-muted">
              Pasta vazia. Arraste arquivos ou uma pasta para cá, ou use os
              botões acima.
            </p>
          )}
          {uploads.length > 0 && (
            <ul
              aria-label="Envios"
              className="mt-auto flex flex-col gap-1.5 border-t border-line-soft p-3"
            >
              {uploads.map((u) => (
                <li key={u.key} className="flex flex-col gap-1 text-xs">
                  <span className="flex justify-between gap-2">
                    <span className="truncate">{u.name}</span>
                    <span
                      className={u.error ? 'text-danger' : 'text-ink-muted'}
                    >
                      {u.error ?? `${Math.round(u.progress * 100)}%`}
                    </span>
                  </span>
                  <progress
                    value={u.error ? 0 : u.progress}
                    max={1}
                    aria-label={`Envio de ${u.name}`}
                    className="h-1.5 w-full overflow-hidden rounded-full [&::-webkit-progress-bar]:bg-surface-sunken [&::-webkit-progress-value]:bg-link"
                  />
                </li>
              ))}
            </ul>
          )}
          <p role="status" className="sr-only">
            {msg}
          </p>
        </div>
        <div
          className={cn('min-w-0', dropTarget === targetDir && 'bg-canvas')}
          {...dropProps(targetDir)}
        >
          <Preview node={sel} />
        </div>
      </div>

      <AlertDialog
        open={deleting !== null}
        onOpenChange={(o) => !o && setDeleting(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Apagar “{deleting?.name}”?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleting?.type === 'folder'
                ? 'A pasta e tudo o que tem dentro vão para a lixeira do seu Google Drive.'
                : 'O arquivo vai para a lixeira do seu Google Drive.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                const d = deleting
                if (!d) return
                remove.mutate(d.path, {
                  onSuccess: () => {
                    setDeleting(null)
                    setSelected(parentOf(d.path) || null)
                    setMsg(`“${d.name}” apagado.`)
                    toast.success(`“${d.name}” apagado`)
                  },
                  onError: (err) => toast.error(errorMessage(err)),
                })
              }}
            >
              Apagar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog
        open={moving !== null}
        onOpenChange={(o) => !o && setMoving(null)}
      >
        <DialogContent className="sm:max-w-[440px]">
          <DialogHeader>
            <DialogTitle>Mover “{moving?.name}”</DialogTitle>
            <DialogDescription>
              Escolha a pasta de destino. Você também pode arrastar na árvore.
            </DialogDescription>
          </DialogHeader>
          <label htmlFor="fs-move-to" className="text-sm font-medium">
            Para a pasta
          </label>
          <select
            id="fs-move-to"
            value={moveTo}
            onChange={(e) => setMoveTo(e.target.value)}
            className="h-10 rounded-md border border-line-control bg-surface px-2 text-sm"
          >
            {allFolders(root)
              .filter(
                (f) =>
                  !moving ||
                  (f !== moving.path && !f.startsWith(`${moving.path}/`)),
              )
              .map((f) => (
                <option key={f} value={f}>
                  {f || 'Raiz do tópico'}
                </option>
              ))}
          </select>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMoving(null)}>
              Cancelar
            </Button>
            <Button
              disabled={!moving || moveTo === parentOf(moving.path)}
              onClick={() => {
                if (moving) doMove(moving, moveTo)
                setMoving(null)
              }}
            >
              Mover
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  )
}
