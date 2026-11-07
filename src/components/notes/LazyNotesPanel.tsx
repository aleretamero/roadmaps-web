import { Suspense, lazy } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import type { NoteOwner } from '@/lib/api/queries'

// O editor (Tiptap + realce de código) é o maior pedaço do app: só carrega
// quando a aba Anotações abre.
const NotesPanel = lazy(() =>
  import('./NotesPanel').then((m) => ({ default: m.NotesPanel })),
)

export function LazyNotesPanel({ owner }: { owner: NoteOwner }) {
  return (
    <Suspense
      fallback={
        <div role="status" aria-label="Carregando anotações">
          <Skeleton className="h-64 w-full" />
        </div>
      }
    >
      <NotesPanel owner={owner} />
    </Suspense>
  )
}
