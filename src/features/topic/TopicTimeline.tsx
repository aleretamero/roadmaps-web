import { useInfiniteQuery } from '@tanstack/react-query'
import { MoreHorizontal } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { ActionMark } from '@/components/ActionMark'
import { IconButton } from '@/components/IconButton'
import { LogSessionForm } from '@/components/LogSession'
import type { LogSessionValues } from '@/components/LogSession'
import {
  ChangesList,
  TimelineCard,
  TimelineRow,
  withDayBreaks,
} from '@/components/Timeline'
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
import { Dialog, DialogContent } from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ACTIONS, actionWords } from '@/lib/actions'
import type { Schemas } from '@/lib/api/client'
import { errorMessage } from '@/lib/api/errors'
import {
  topicTimelineQuery,
  useDeleteSession,
  useUpdateSession,
} from '@/lib/api/queries'
import { addDays, formatShort, todayISO } from '@/lib/date'
import { stageLabel } from '@/lib/stage'

type Session = Schemas['SessionWithTopic']
type Topic = Schemas['TopicDetail']

const actionsOf = (s: Session) => ACTIONS.filter((a) => s[a])

/** Valores do formulário a partir de uma sessão já registrada. */
export function sessionValues(s: Session, today: string): LogSessionValues {
  return {
    actions: actionsOf(s),
    when:
      s.day === today
        ? 'today'
        : s.day === addDays(today, -1)
          ? 'yesterday'
          : 'other',
    date: s.day,
    note: s.note ?? '',
  }
}

/** Aba Linha do tempo do tópico: "O que você fez" (sessões) e "Histórico de alterações". */
export function TopicTimeline({
  topic,
  today = todayISO(),
}: {
  topic: Topic
  today?: string
}) {
  const sessions = useInfiniteQuery(topicTimelineQuery(topic.id, 'sessions'))
  const changes = useInfiniteQuery(topicTimelineQuery(topic.id, 'changes'))
  const update = useUpdateSession(topic.id)
  const remove = useDeleteSession(topic.id)
  const [editing, setEditing] = useState<Session | null>(null)
  const [deleting, setDeleting] = useState<Session | null>(null)
  const [editError, setEditError] = useState<string | null>(null)

  const sessionList = (sessions.data?.pages ?? []).flatMap((p) =>
    p.items.flatMap((i) => (i.session ? [i.session] : [])),
  )
  const changeList = (changes.data?.pages ?? []).flatMap((p) =>
    p.items.flatMap((i) => (i.change ? [i.change] : [])),
  )
  const rows = withDayBreaks(sessionList, (s) => s.day)
  const n = topic.counts.sessions

  return (
    <div className="flex flex-wrap items-start gap-5">
      <TimelineCard
        title="O que você fez"
        count={`${n} ${n === 1 ? 'sessão' : 'sessões'}`}
        loading={sessions.isPending}
        error={sessions.error ? errorMessage(sessions.error) : null}
        empty={
          sessionList.length === 0
            ? 'Nenhuma sessão registrada ainda. Use “Registrar sessão” quando estudar ou praticar.'
            : null
        }
        hasMore={sessions.hasNextPage}
        loadingMore={sessions.isFetchingNextPage}
        onMore={() => void sessions.fetchNextPage()}
        className="flex-[1_1_480px]"
      >
        {rows.map(({ item: s, day, first }, i) => {
          const acts = actionsOf(s)
          const top = acts.at(-1) ?? 'studied'
          const words = actionWords(acts)
          return (
            <TimelineRow
              key={s.id}
              day={day}
              showDay={first}
              last={i === rows.length - 1}
              mark={<ActionMark action={top} size="md" />}
              aside={
                <DropdownMenu modal={false}>
                  <DropdownMenuTrigger asChild>
                    <IconButton
                      label={`Ações da sessão de ${formatShort(s.day)} (${words.toLocaleLowerCase('pt-BR')})`}
                      size="sm"
                    >
                      <MoreHorizontal />
                    </IconButton>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onSelect={() => setEditing(s)}>
                      Editar sessão
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      variant="destructive"
                      onSelect={() => setDeleting(s)}
                    >
                      Apagar sessão
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              }
            >
              <span className="pt-0.5 font-medium">{words}</span>
              {s.note && (
                <p className="rounded-r-lg border-l-2 border-line-control bg-canvas px-3.5 py-2.5 text-[15px] text-ink-strong">
                  {s.note}
                </p>
              )}
            </TimelineRow>
          )
        })}
      </TimelineCard>
      <TimelineCard
        title="Histórico de alterações"
        count={
          changeList.length
            ? `${changeList.length}${changes.hasNextPage ? '+' : ''} ${changeList.length === 1 ? 'alteração' : 'alterações'}`
            : undefined
        }
        loading={changes.isPending}
        error={changes.error ? errorMessage(changes.error) : null}
        empty={changeList.length === 0 ? 'Nenhuma alteração ainda.' : null}
        hasMore={changes.hasNextPage}
        loadingMore={changes.isFetchingNextPage}
        onMore={() => void changes.fetchNextPage()}
        className="flex-[1_1_300px] lg:max-w-[434px]"
      >
        <ChangesList changes={changeList} />
      </TimelineCard>

      <Dialog
        open={editing !== null}
        onOpenChange={(o) => {
          if (!o) {
            setEditing(null)
            setEditError(null)
          }
        }}
      >
        <DialogContent className="flex max-h-[calc(100dvh-2rem)] flex-col gap-0 overflow-hidden bg-surface p-0 sm:max-w-[600px]">
          {editing && (
            <LogSessionForm
              key={editing.id}
              mode="edit"
              topic={topic}
              today={today}
              initial={sessionValues(editing, today)}
              saving={update.isPending}
              error={editError}
              onCancel={() => setEditing(null)}
              onSave={(body) =>
                update.mutate(
                  { sessionId: editing.id, body },
                  {
                    onSuccess: () => {
                      toast.success('Sessão atualizada')
                      setEditing(null)
                    },
                    onError: (e) => setEditError(errorMessage(e)),
                  },
                )
              }
            />
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={deleting !== null}
        onOpenChange={(o) => !o && setDeleting(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Apagar esta sessão?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleting &&
                `${actionWords(actionsOf(deleting))} em ${formatShort(deleting.day)}. A etapa do tópico é recalculada com as sessões que ficarem.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              disabled={remove.isPending}
              onClick={(e) => {
                e.preventDefault()
                if (!deleting) return
                remove.mutate(deleting.id, {
                  onSuccess: (res) => {
                    toast.success(
                      `Sessão apagada · ${stageLabel[res.topic.stage]}`,
                    )
                    setDeleting(null)
                  },
                  onError: (err) => toast.error(errorMessage(err)),
                })
              }}
            >
              Apagar sessão
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
