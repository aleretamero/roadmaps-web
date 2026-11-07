/** Transforma texto colado (uma linha por tópico) em títulos, tirando marcadores de lista. */
export function splitPastedLines(text: string): Array<string> {
  return text
    .split(/\r?\n/)
    .map((l) => l.replace(/^\s*(?:[-*•–]|\d+[.)]|\[[ xX]\])\s+/, '').trim())
    .filter(Boolean)
}
