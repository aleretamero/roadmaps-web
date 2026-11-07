import { useQuery } from '@tanstack/react-query'
import type { Editor } from '@tiptap/core'
import { useState } from 'react'
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
import { Skeleton } from '@/components/ui/skeleton'
import type { Schemas } from '@/lib/api/client'
import { errorMessage, isApiError } from '@/lib/api/errors'
import {
  notesQuery,
  useCreateNote,
  useDeleteNote,
  useUpdateNote,
} from '@/lib/api/queries'
import type { NoteOwner } from '@/lib/api/queries'
import { MarkdownEditor, MarkdownView } from './MarkdownEditor'

type Note = Schemas['Note']

/** "30 de out, 20:15" */
export const noteWhen = (iso: string) =>
  new Date(iso)
    .toLocaleString('pt-BR', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    })
    .replace(/\./g, '')
    .replace(/ de (\d{4})?/, ' de ')

/** Número de cada anotação pela ordem em que foi criada (a primeira é #1). */
export function noteNumbers(notes: ReadonlyArray<Note>) {
  const sorted = [...notes].sort((a, b) =>
    a.createdAt.localeCompare(b.createdAt),
  )
  return new Map(sorted.map((n, i) => [n.id, i + 1]))
}

function Composer({ owner }: { owner: NoteOwner }) {
  const create = useCreateNote(owner)
  const [md, setMd] = useState('')
  const [empty, setEmpty] = useState(true)
  const [editor, setEditor] = useState<Editor | null>(null)
  const publish = () => {
    if (empty || create.isPending) return
    create.mutate(md, {
      onSuccess: () => {
        editor?.commands.clearContent(true)
        toast.success('Anotação publicada')
      },
    })
  }
  return (
    <div className="flex flex-col gap-2">
      <div className="overflow-hidden rounded-xl border border-line-control bg-surface focus-within:border-ink-faint">
        <MarkdownEditor
          idPrefix={`new-${owner.kind}-${owner.id}`}
          label="Nova anotação"
          onChange={(m, e) => {
            setMd(m)
            setEmpty(e)
          }}
          onSubmit={publish}
          onReady={setEditor}
        />
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line-soft px-3 py-2.5">
          <span className="text-xs text-ink-muted">
            {empty ? 'Ctrl+Enter publica' : 'Rascunho não publicado'}
          </span>
          <Button disabled={empty || create.isPending} onClick={publish}>
            {create.isPending ? 'Publicando…' : 'Publicar anotação'}
          </Button>
        </div>
      </div>
      {create.error && (
        <div
          role="alert"
          className="flex flex-wrap items-center gap-3 rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger"
        >
          <span>
            <strong>Não foi possível publicar.</strong> Seu texto continua no
            editor. {errorMessage(create.error)}
          </span>
          <Button size="sm" variant="outline" onClick={publish}>
            Tentar novamente
          </Button>
        </div>
      )}
    </div>
  )
}

function NoteItem({
  note,
  num,
  owner,
  onDelete,
}: {
  note: Note
  num: number
  owner: NoteOwner
  onDelete: (note: Note, num: number) => void
}) {
  const update = useUpdateNote(owner)
  const [editing, setEditing] = useState(false)
  const [md, setMd] = useState(note.content)
  const [empty, setEmpty] = useState(false)
  const conflict = isApiError(update.error) && update.error.status === 412
  const save = () => {
    if (empty || update.isPending) return
    update.mutate(
      { note, content: md },
      {
        onSuccess: () => {
          setEditing(false)
          toast.success('Anotação atualizada')
        },
      },
    )
  }
  return (
    <li className="overflow-hidden rounded-xl border border-line bg-surface">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line bg-canvas px-4 py-2">
        <span className="text-[13px] text-ink-muted">
          <strong className="font-semibold text-ink">Anotação #{num}</strong> ·{' '}
          {noteWhen(note.createdAt)}
          {note.editedAt && ' · editada'}
        </span>
        {!editing && (
          <span className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              aria-label={`Editar anotação ${num}`}
              onClick={() => {
                setMd(note.content)
                update.reset()
                setEditing(true)
              }}
            >
              Editar
            </Button>
            <Button
              variant="ghost"
              size="sm"
              aria-label={`Excluir anotação ${num}`}
              onClick={() => onDelete(note, num)}
            >
              Excluir
            </Button>
          </span>
        )}
      </div>
      {editing ? (
        <div className="flex flex-col">
          <MarkdownEditor
            key={note.id}
            idPrefix={`note-${note.id}`}
            label={`Editar anotação ${num}`}
            initial={md}
            autofocus
            onChange={(m, e) => {
              setMd(m)
              setEmpty(e)
            }}
            onSubmit={save}
          />
          {update.error && (
            <div
              role="alert"
              className="mx-3 flex flex-wrap items-center gap-3 rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger"
            >
              {conflict ? (
                <>
                  <span>
                    <strong>Esta anotação mudou em outro lugar.</strong> Seu
                    texto continua aqui; copie o que quiser manter e veja a
                    versão nova.
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      update.reset()
                      setEditing(false)
                    }}
                  >
                    Ver a versão nova
                  </Button>
                </>
              ) : (
                <span>
                  Não foi possível salvar. {errorMessage(update.error)}
                </span>
              )}
            </div>
          )}
          <div className="flex justify-end gap-2 px-3 py-2.5">
            <Button variant="outline" onClick={() => setEditing(false)}>
              Cancelar
            </Button>
            <Button disabled={empty || update.isPending} onClick={save}>
              {update.isPending ? 'Salvando…' : 'Salvar'}
            </Button>
          </div>
        </div>
      ) : (
        <div className="px-4 py-3.5">
          <MarkdownView content={note.content} label={`Anotação ${num}`} />
        </div>
      )}
    </li>
  )
}

/** Aba Anotações (tópico ou módulo): editor para publicar e a lista com editar e excluir. */
export function NotesPanel({ owner }: { owner: NoteOwner }) {
  const q = useQuery(notesQuery(owner))
  const remove = useDeleteNote(owner)
  const [deleting, setDeleting] = useState<{ note: Note; num: number } | null>(
    null,
  )
  const notes = q.data ?? []
  const nums = noteNumbers(notes)
  return (
    <section
      aria-labelledby={`notes-${owner.kind}`}
      className="flex flex-col gap-4 rounded-2xl border border-line bg-surface p-4 sm:p-5"
    >
      <div className="flex items-baseline justify-between gap-3">
        <h2 id={`notes-${owner.kind}`} className="text-lg font-semibold">
          Anotações
        </h2>
        {q.data && (
          <span className="text-[13px] text-ink-muted">
            {notes.length === 0
              ? 'Nenhuma anotação ainda'
              : `${notes.length} ${notes.length === 1 ? 'anotação' : 'anotações'}`}
          </span>
        )}
      </div>
      <Composer owner={owner} />
      {q.isPending ? (
        <div
          role="status"
          aria-label="Carregando anotações"
          className="flex flex-col gap-2"
        >
          <Skeleton className="h-24 w-full" />
        </div>
      ) : q.error ? (
        <div
          role="alert"
          className="flex flex-wrap items-center gap-3 rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger"
        >
          Não foi possível carregar as anotações. {errorMessage(q.error)}
          <Button size="sm" variant="outline" onClick={() => void q.refetch()}>
            Tentar de novo
          </Button>
        </div>
      ) : (
        notes.length > 0 && (
          <ol aria-label="Anotações publicadas" className="flex flex-col gap-3">
            {notes.map((n) => (
              <NoteItem
                key={n.id}
                note={n}
                num={nums.get(n.id)!}
                owner={owner}
                onDelete={(note, num) => setDeleting({ note, num })}
              />
            ))}
          </ol>
        )
      )}
      <AlertDialog
        open={deleting !== null}
        onOpenChange={(o) => !o && setDeleting(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Excluir a anotação #{deleting?.num}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              O texto some da lista e não dá para desfazer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              disabled={remove.isPending}
              onClick={(e) => {
                e.preventDefault()
                if (!deleting) return
                remove.mutate(deleting.note.id, {
                  onSuccess: () => {
                    toast.success('Anotação excluída')
                    setDeleting(null)
                  },
                  onError: (err) => toast.error(errorMessage(err)),
                })
              }}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  )
}
