import { HttpResponse } from 'msw'
import { createOpenApiHttp } from 'openapi-msw'
import type { ProblemDetails } from '@/lib/api/errors'
import type { paths } from '@/lib/api/schema'
import { getDb } from '../state'

/** `http` tipado pelo contrato. `*` no início aceita qualquer origem (navegador e Node). */
export const http = createOpenApiHttp<paths>({ baseUrl: '*/api/v1' })

/** Resposta de erro (Problem Details). Use quando o resultado vai ser guardado e testado. */
export function problemResponse(
  status: number,
  code: ProblemDetails['code'],
  title: string,
  errors?: Record<string, Array<string>>,
) {
  const body: ProblemDetails = {
    type: 'about:blank',
    title,
    status,
    code,
    ...(errors ? { errors } : {}),
  }
  return HttpResponse.json(body, {
    status,
    headers: { 'Content-Type': 'application/problem+json' },
  })
}

/**
 * Erro para devolver direto do handler. `never` porque as respostas de erro
 * não fazem parte dos tipos de sucesso do contrato.
 */
export const problem = (...args: Parameters<typeof problemResponse>) =>
  problemResponse(...args) as never

export const notFound = () => problem(404, 'not_found', 'Não encontrado')
export const noContent = () => new HttpResponse(null, { status: 204 }) as never

export const num = (v: string | ReadonlyArray<string> | undefined) => Number(v)

export const etag = (version: string | number) => `"${version}"`

/** 412 quando o `If-Match` veio e não bate com a versão atual. */
export function preconditionFailed(request: Request, version: string | number) {
  const ifMatch = request.headers.get('If-Match')
  return ifMatch !== null && ifMatch !== etag(version)
    ? problemResponse(412, 'edit_conflict', 'Versão desatualizada')
    : null
}

export function findTopic(id: number) {
  return getDb().topics.find((t) => t.id === id)
}
export function findModule(id: number) {
  return getDb().modules.find((m) => m.id === id)
}
export function findRoadmap(id: number) {
  return getDb().roadmaps.find((r) => r.id === id)
}

/** Valida campos obrigatórios e devolve 400 com os erros por campo. */
export function required(fields: Record<string, unknown>) {
  const errors: Record<string, Array<string>> = {}
  for (const [k, v] of Object.entries(fields)) {
    if (v === undefined || v === null || (typeof v === 'string' && !v.trim()))
      errors[k] = ['Obrigatório']
  }
  return Object.keys(errors).length
    ? problemResponse(400, 'validation_error', 'Campos inválidos', errors)
    : null
}
