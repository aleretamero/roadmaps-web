/** Etapas de um tópico, na ordem em que avançam. Mesmos nomes do enum `Stage` da API. */
export const STAGES = [
  'planned',
  'studying',
  'practicing',
  'completed',
] as const
export type Stage = (typeof STAGES)[number]

export const stageLabel: Record<Stage, string> = {
  planned: 'Planejado',
  studying: 'Estudando',
  practicing: 'Praticando',
  completed: 'Concluído',
}

const ACTION_STAGE = {
  studied: 'studying',
  practiced: 'practicing',
  completed: 'completed',
} as const

/** Etapa depois de uma sessão: a mais avançada entre a atual e o que foi feito (nunca volta). */
export function stageAfter(
  from: Stage,
  actions: ReadonlyArray<keyof typeof ACTION_STAGE>,
): Stage {
  return actions.reduce<Stage>(
    (cur, a) =>
      STAGES.indexOf(ACTION_STAGE[a]) > STAGES.indexOf(cur)
        ? ACTION_STAGE[a]
        : cur,
    from,
  )
}
