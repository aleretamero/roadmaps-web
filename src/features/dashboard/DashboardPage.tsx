import type { Schemas } from '@/lib/api/client'
import { formatLong } from '@/lib/date'
import {
  AttentionCard,
  NextDaysCard,
  RoadmapsCard,
  TodayCard,
  WeekCard,
} from './cards'

export function greeting(hour: number) {
  if (hour < 12) return 'Bom dia'
  if (hour < 18) return 'Boa tarde'
  return 'Boa noite'
}

/**
 * Painel. `activity` é o espaço do cartão de atividade (mapa de calor, FU04).
 */
export function DashboardPage({
  data,
  date,
  hour,
  activity,
}: {
  data: Schemas['Dashboard']
  /** Hoje (yyyy-mm-dd) e a hora local: vêm de fora para testes e stories. */
  date: string
  hour: number
  activity?: React.ReactNode
}) {
  const worked = data.weekStats.topicsWorked
  const sub = `${formatLong(date)} · ${
    worked
      ? `${worked} ${worked === 1 ? 'tópico trabalhado' : 'tópicos trabalhados'} nesta semana`
      : 'nenhum registro nesta semana ainda'
  }`
  return (
    <div className="mx-auto flex w-full max-w-[1264px] flex-col gap-5 px-4 pt-9 pb-16 sm:px-8">
      <div className="flex flex-col gap-1">
        <h1 className="text-[32px] leading-[1.15] font-semibold tracking-[-0.02em]">
          {greeting(hour)}
        </h1>
        <p className="text-ink-muted">{sub}</p>
      </div>
      <div className="flex flex-wrap items-stretch gap-5">
        <TodayCard
          date={date}
          items={data.today}
          resume={data.resume}
          className="flex-[3_1_460px]"
        />
        <WeekCard
          date={date}
          week={data.week}
          streak={data.streak}
          weekStats={data.weekStats}
          topics={data.topics}
          className="flex-[2_1_380px]"
        />
      </div>
      {activity}
      <div className="flex flex-wrap items-start gap-5">
        <RoadmapsCard
          date={date}
          roadmaps={data.roadmaps}
          className="flex-[3_1_520px]"
        />
        <div className="flex min-w-0 flex-[2_1_340px] flex-col gap-5">
          <NextDaysCard date={date} days={data.next7Days} />
          <AttentionCard date={date} items={data.attention} />
        </div>
      </div>
    </div>
  )
}
