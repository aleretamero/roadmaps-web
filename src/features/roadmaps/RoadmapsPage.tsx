import { Link } from '@tanstack/react-router'
import { Plus } from 'lucide-react'
import { useState } from 'react'
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
import type { Schemas } from '@/lib/api/client'
import { cn } from '@/lib/utils'
import { RoadmapCard } from './RoadmapCard'

type Summary = Schemas['RoadmapSummary']

export type RoadmapsPageProps = {
  active: ReadonlyArray<Summary>
  archived: ReadonlyArray<Summary>
  showArchived: boolean
  onArchive: (roadmap: Summary, archive: boolean) => void
  onDelete: (roadmap: Summary) => void
  deleting?: boolean
}

function NewRoadmapLink({
  className,
  children,
}: {
  className?: string
  children: React.ReactNode
}) {
  return (
    <Link
      to="/roadmaps/new"
      className={cn(
        'inline-flex h-11 items-center gap-2 rounded-[10px] bg-ink px-[18px] font-medium text-surface hover:opacity-90',
        className,
      )}
    >
      {children}
    </Link>
  )
}

/** Meus roadmaps: filtro Ativos/Arquivados, cards e estados vazios. */
export function RoadmapsPage({
  active,
  archived,
  showArchived,
  onArchive,
  onDelete,
  deleting = false,
}: RoadmapsPageProps) {
  const [confirm, setConfirm] = useState<Summary | null>(null)
  const list = showArchived ? archived : active
  const tab = (on: boolean) =>
    cn(
      'inline-flex h-11 items-center gap-1 border-b-2 px-3.5',
      on
        ? 'border-ink font-semibold text-ink'
        : 'border-transparent font-medium text-ink-muted hover:text-ink',
    )
  return (
    <div className="mx-auto flex w-full max-w-[1264px] flex-col gap-7 px-4 pt-10 pb-16 sm:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-[32px] leading-[1.15] font-semibold tracking-[-0.02em]">
            Meus roadmaps
          </h1>
          <p className="text-ink-muted">
            Objetivos de aprendizado, com módulos, tópicos e anotações.
          </p>
        </div>
        <NewRoadmapLink>
          <Plus className="size-4" strokeWidth={1.8} aria-hidden="true" />
          Novo roadmap
        </NewRoadmapLink>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line">
        <nav aria-label="Filtrar roadmaps" className="flex gap-1">
          <Link
            to="/roadmaps"
            search={{}}
            aria-current={!showArchived ? 'page' : undefined}
            className={tab(!showArchived)}
          >
            Ativos{' '}
            <span className="font-normal text-ink-soft">{active.length}</span>
          </Link>
          <Link
            to="/roadmaps"
            search={{ archived: true }}
            aria-current={showArchived ? 'page' : undefined}
            className={tab(showArchived)}
          >
            Arquivados{' '}
            <span className="font-normal text-ink-soft">{archived.length}</span>
          </Link>
        </nav>
        <p className="pb-2 text-[13px] text-ink-soft sm:pb-0">
          Arquivar não apaga nada: o roadmap continua consultável.
        </p>
      </div>

      {list.length > 0 ? (
        <ul className="grid grid-cols-[repeat(auto-fill,minmax(min(340px,100%),1fr))] gap-5">
          {list.map((r) => (
            <li key={r.id} className="flex">
              <RoadmapCard
                roadmap={r}
                onArchive={(a) => onArchive(r, a)}
                onDelete={() => setConfirm(r)}
              />
            </li>
          ))}
        </ul>
      ) : showArchived ? (
        <p className="rounded-2xl border border-dashed border-line-control bg-surface p-10 text-center text-ink-muted">
          Nenhum roadmap arquivado.
        </p>
      ) : (
        <section
          aria-labelledby="vazio-titulo"
          className="flex flex-col items-center gap-6 rounded-2xl border border-dashed border-line-control bg-surface px-8 py-14 text-center"
        >
          <div className="flex max-w-[520px] flex-col gap-2">
            <h2 id="vazio-titulo" className="text-[22px] font-semibold">
              Você não tem roadmaps ativos
            </h2>
            <p className="text-ink-muted">
              Crie um roadmap com o seu objetivo, separe em módulos e adicione
              os tópicos que quer estudar.
            </p>
          </div>
          <NewRoadmapLink className="px-5">Criar roadmap</NewRoadmapLink>
        </section>
      )}

      <AlertDialog
        open={!!confirm}
        onOpenChange={(o) => !o && setConfirm(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Apagar “{confirm?.name}”?</AlertDialogTitle>
            <AlertDialogDescription>
              Os módulos, tópicos, sessões e anotações deste roadmap serão
              apagados e não dá para desfazer. Se só quer tirar da lista,
              arquive.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={deleting}
              onClick={() => {
                if (confirm) onDelete(confirm)
                setConfirm(null)
              }}
            >
              Apagar roadmap
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
