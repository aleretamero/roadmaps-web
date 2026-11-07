import type { Schemas } from '@/lib/api/client'

export type SessionAction = Schemas['SessionAction']

export const ACTIONS: ReadonlyArray<SessionAction> = [
  'studied',
  'practiced',
  'completed',
]

export const ACTION_LABEL: Record<SessionAction, string> = {
  studied: 'Estudei',
  practiced: 'Pratiquei',
  completed: 'Concluí',
}

/** "Estudei e pratiquei", "Estudei, pratiquei e concluí". */
export function actionWords(actions: ReadonlyArray<SessionAction>): string {
  const sorted = ACTIONS.filter((a) => actions.includes(a))
  const words = sorted.map((a) => ACTION_LABEL[a].toLocaleLowerCase('pt-BR'))
  const text =
    words.length > 1
      ? `${words.slice(0, -1).join(', ')} e ${words.at(-1)}`
      : (words[0] ?? '')
  return text ? text[0]!.toLocaleUpperCase('pt-BR') + text.slice(1) : ''
}
