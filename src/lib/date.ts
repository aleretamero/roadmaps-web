/**
 * Datas de calendário trafegam como `yyyy-MM-dd` (DateOnly na API).
 * Estas funções evitam o fuso do navegador mudar o dia.
 */
export function toISODate(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function parseISODate(value: string): Date {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  if (!match) throw new Error(`Data inválida: ${value}`)
  const [, y, m, d] = match
  return new Date(Number(y), Number(m) - 1, Number(d))
}

/** Hoje como data de calendário (no fuso do navegador). */
export function todayISO(): string {
  return toISODate(new Date())
}

export function addDays(value: string, n: number): string {
  const d = parseISODate(value)
  d.setDate(d.getDate() + n)
  return toISODate(d)
}

/** Dias de `from` até `to` (positivo se `to` é depois). */
export function diffDays(from: string, to: string): number {
  return Math.round(
    (parseISODate(to).getTime() - parseISODate(from).getTime()) / 86_400_000,
  )
}

const fmt = (value: string, options: Intl.DateTimeFormatOptions) =>
  parseISODate(value).toLocaleDateString('pt-BR', options).replace(/\./g, '')

export const capitalize = (s: string) =>
  s ? s[0]!.toLocaleUpperCase('pt-BR') + s.slice(1) : s

/** "7 de nov" */
export const formatShort = (value: string) =>
  fmt(value, { day: 'numeric', month: 'short' })

/** "Sáb, 7 de nov" */
export const formatPlan = (value: string) =>
  capitalize(fmt(value, { weekday: 'short', day: 'numeric', month: 'short' }))

/** "Sábado, 7 de novembro" */
export const formatLong = (value: string) =>
  capitalize(fmt(value, { weekday: 'long', day: 'numeric', month: 'long' }))

/** "Seg, 9" */
export const formatWeekdayDay = (value: string) =>
  capitalize(fmt(value, { weekday: 'short', day: 'numeric' }))

/** "sábado, 7" (rótulos acessíveis) */
export const formatWeekdayLong = (value: string) =>
  fmt(value, { weekday: 'long', day: 'numeric' })

/**
 * Data relativa a `today`: "Hoje", "Amanhã", "Ontem", "há 3 dias",
 * o dia da semana nos próximos 6 dias, ou "12 de nov".
 */
export function relativeDay(value: string, today = todayISO()): string {
  const n = diffDays(today, value)
  if (n === 0) return 'Hoje'
  if (n === 1) return 'Amanhã'
  if (n === -1) return 'Ontem'
  if (n < 0) return `há ${-n} dias`
  if (n < 7) return fmt(value, { weekday: 'long' })
  return formatShort(value)
}
