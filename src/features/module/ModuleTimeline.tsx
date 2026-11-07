import { useInfiniteQuery } from '@tanstack/react-query'
import { ActionMark } from '@/components/ActionMark'
import {
  ChangesList,
  TimelineCard,
  TimelineRow,
  withDayBreaks,
} from '@/components/Timeline'
import type { Schemas } from '@/lib/api/client'
import { errorMessage } from '@/lib/api/errors'
import { moduleTimelineQuery } from '@/lib/api/queries'
import { stageLabel } from '@/lib/stage'

type Session = Schemas['SessionWithTopic']

/** "Começou “Índices”", "“Modelagem” concluído", "“Índices” passou para Praticando". */
export function progressText(s: Session) {
  const t = `“${s.topic.title}”`
  if (s.stageAfter === 'completed') return `${t} concluído`
  if (s.stageBefore === 'planned') return `Começou ${t}`
  return `${t} passou para ${stageLabel[s.stageAfter]}`
}

const MARK = {
  studying: 'studied',
  practicing: 'practiced',
  completed: 'completed',
  planned: 'planned',
} as const

/** Aba Linha do tempo do módulo: progresso nos tópicos (mudanças de etapa) e alterações do módulo. */
export function ModuleTimeline({ moduleId }: { moduleId: number }) {
  const progress = useInfiniteQuery(moduleTimelineQuery(moduleId, 'progress'))
  const changes = useInfiniteQuery(moduleTimelineQuery(moduleId, 'changes'))
  const events = (progress.data?.pages ?? []).flatMap((p) =>
    p.items.flatMap((i) => (i.session ? [i.session] : [])),
  )
  const changeList = (changes.data?.pages ?? []).flatMap((p) =>
    p.items.flatMap((i) => (i.change ? [i.change] : [])),
  )
  const rows = withDayBreaks(events, (s) => s.day)
  const plus = (more: boolean) => (more ? '+' : '')
  return (
    <div className="flex flex-wrap items-start gap-5">
      <TimelineCard
        title="Progresso nos tópicos"
        count={
          events.length
            ? `${events.length}${plus(progress.hasNextPage)} ${events.length === 1 ? 'evento' : 'eventos'}`
            : undefined
        }
        loading={progress.isPending}
        error={progress.error ? errorMessage(progress.error) : null}
        empty={
          events.length === 0
            ? 'Nenhum tópico começou ainda. O progresso aparece aqui quando um tópico muda de etapa.'
            : null
        }
        hasMore={progress.hasNextPage}
        loadingMore={progress.isFetchingNextPage}
        onMore={() => void progress.fetchNextPage()}
        className="flex-[1_1_480px]"
      >
        {rows.map(({ item: s, day, first }, i) => (
          <TimelineRow
            key={s.id}
            day={day}
            showDay={first}
            last={i === rows.length - 1}
            mark={<ActionMark action={MARK[s.stageAfter]} size="md" />}
          >
            <span className="pt-0.5 font-medium">{progressText(s)}</span>
          </TimelineRow>
        ))}
      </TimelineCard>
      <TimelineCard
        title="Histórico de alterações"
        count={
          changeList.length
            ? `${changeList.length}${plus(changes.hasNextPage)} ${changeList.length === 1 ? 'alteração' : 'alterações'}`
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
    </div>
  )
}
