import { HttpResponse, delay } from 'msw'
import { getDb, getScenario } from '../state'
import { accountHandlers } from './account'
import { roadmapHandlers } from './roadmaps'
import { studyHandlers } from './study'
import { contentHandlers } from './content'
import { http, problem } from './http'

/** Aplica o cenário antes de qualquer rota: lento, erro 500 e sessão. */
const scenarioHandler = http.untyped.all('*/api/v1/*', async ({ request }) => {
  const s = getScenario()
  if (s === 'lento') await delay(1500)
  else await delay(import.meta.env.MODE === 'test' ? 0 : 150)
  if (s === 'erro-500')
    return problem(500, 'internal_error', 'Erro simulado (cenário erro-500)')
  const path = new URL(request.url).pathname
  if (!getDb().loggedIn && !path.includes('/api/v1/auth/'))
    return problem(401, 'unauthorized', 'Sem sessão')
  return undefined
})

/** Rota que não está no contrato: avisa em vez de cair na rede. */
const fallback = http.untyped.all('*/api/v1/*', ({ request }) =>
  HttpResponse.json(
    {
      type: 'about:blank',
      title: `Sem mock para ${request.method} ${new URL(request.url).pathname}`,
      status: 501,
      code: 'internal_error',
    },
    { status: 501 },
  ),
)

export const handlers = [
  scenarioHandler,
  ...accountHandlers,
  ...roadmapHandlers,
  ...studyHandlers,
  ...contentHandlers,
  fallback,
]
