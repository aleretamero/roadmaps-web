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
