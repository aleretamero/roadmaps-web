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
