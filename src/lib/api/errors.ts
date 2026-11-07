import type { components } from './schema'

export type ProblemDetails = components['schemas']['ProblemDetails']
export type ErrorCode = ProblemDetails['code']

/** Erro de uma chamada da API, com o Problem Details que o backend devolveu. */
export class ApiError extends Error {
  readonly status: number
  readonly code: ErrorCode | 'network_error'
  readonly problem?: ProblemDetails

  constructor(status: number, problem?: ProblemDetails) {
    super(problem?.detail ?? problem?.title ?? `Erro ${status}`)
    this.name = 'ApiError'
    this.status = status
    this.problem = problem
    this.code =
      problem?.code ?? (status === 0 ? 'network_error' : codeFromStatus(status))
  }

  /** Erros por campo (validação e dry run da importação). */
  get fieldErrors(): Record<string, Array<string>> {
    return this.problem?.errors ?? {}
  }
}

function codeFromStatus(status: number): ErrorCode {
  if (status === 400 || status === 422) return 'validation_error'
  if (status === 401) return 'unauthorized'
  if (status === 404) return 'not_found'
  if (status === 409) return 'conflict'
  if (status === 412) return 'edit_conflict'
  return 'internal_error'
}

const messages: Record<ApiError['code'], string> = {
  validation_error: 'Confira os campos destacados.',
  not_found: 'Não encontramos o que você procurava. Talvez tenha sido apagado.',
  unauthorized: 'Sua sessão terminou. Entre de novo para continuar.',
  edit_conflict:
    'Isso foi alterado em outro lugar. Recarregue para ver a versão mais recente.',
  dependency_cycle:
    'Essa dependência criaria um ciclo: um módulo acabaria dependendo dele mesmo.',
  invalid_stage: 'Essa etapa não pode ser escolhida agora.',
  drive_not_connected: 'Conecte o Google Drive para guardar arquivos.',
  conflict: 'Já existe um registro igual.',
  internal_error: 'Algo deu errado do nosso lado. Tente de novo em instantes.',
  network_error:
    'Sem conexão com o servidor. Verifique a internet e tente de novo.',
}

/** Mensagem para mostrar ao usuário a partir de qualquer erro. */
export function errorMessage(error: unknown): string {
  if (error instanceof ApiError) return messages[error.code]
  return messages.internal_error
}

export function isApiError(
  error: unknown,
  code?: ApiError['code'],
): error is ApiError {
  return (
    error instanceof ApiError && (code === undefined || error.code === code)
  )
}
