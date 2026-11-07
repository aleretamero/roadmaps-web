/** Só aceita voltar para um caminho do próprio app (nada de URL externa). */
export function safeRedirect(value: unknown): string | undefined {
  return typeof value === 'string' &&
    value.startsWith('/') &&
    !value.startsWith('//')
    ? value
    : undefined
}
