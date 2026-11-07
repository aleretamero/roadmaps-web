import createClient from 'openapi-fetch'
import { ApiError } from './errors'
import type { ProblemDetails } from './errors'
import type { components, paths } from './schema'

export type Schemas = components['schemas']

/** Base da API. Em dev com mock, o MSW responde em /api/v1 (FS07). */
export const API_BASE_URL: string = import.meta.env.VITE_API_URL ?? '/api/v1'

/** Cliente tipado pelo contrato `contracts/openapi.yaml`. Use pelos hooks de `queries/`. */
export const api = createClient<paths>({
  baseUrl: API_BASE_URL,
  credentials: 'include',
  // Lido na hora da chamada: permite que o MSW intercepte em testes.
  fetch: (request) => globalThis.fetch(request),
})

type FetchResult<T> = {
  data?: T
  error?: unknown
  response: Response
}

/** Devolve `data` ou lança `ApiError` com o Problem Details da resposta. */
export async function unwrap<T>(promise: Promise<FetchResult<T>>): Promise<T> {
  let result: FetchResult<T>
  try {
    result = await promise
  } catch {
    throw new ApiError(0)
  }
  const { data, error, response } = result
  if (!response.ok || error !== undefined) {
    throw new ApiError(response.status, error as ProblemDetails | undefined)
  }
  return data as T
}

/** ETag da resposta, para mandar em `If-Match` ao editar. */
export function etagOf(response: Response): string | undefined {
  return response.headers.get('ETag') ?? undefined
}
