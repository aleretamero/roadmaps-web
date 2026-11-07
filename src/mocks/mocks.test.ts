import { readFileSync } from 'node:fs'
import createClient from 'openapi-fetch'
import { parse } from 'yaml'
import type { paths } from '@/lib/api/schema'
import { handlers } from './handlers'
import { server } from './node'
import { getDb, setScenario } from './state'

// `fetch` lido na hora da chamada, para o MSW (ligado no beforeAll) interceptar.
const api = createClient<paths>({
  baseUrl: 'http://localhost/api/v1',
  fetch: (req) => globalThis.fetch(req),
})

beforeAll(() => server.listen({ onUnhandledFrame: 'error' }))
afterAll(() => server.close())
beforeEach(() => setScenario('padrao'))

const topicByTitle = (title: string) =>
  getDb().topics.find((t) => t.title === title)!

describe('mock da API', () => {
  it('tem handler para toda rota do contrato', () => {
    const spec = parse(readFileSync('contracts/openapi.yaml', 'utf8')) as {
      paths: Record<string, Record<string, unknown>>
    }
    const expected = Object.entries(spec.paths).flatMap(([path, ops]) =>
      Object.keys(ops).map(
        (m) =>
          `${m.toUpperCase()} */api/v1${path.replace(/\{(\w+)\}/g, ':$1')}`,
      ),
    )
    const actual = new Set(
      handlers.map((h) => {
        const info = h.info as { method?: unknown; path?: unknown }
        return `${String(info.method)} ${String(info.path)}`
      }),
    )
    const missing = expected.filter((e) => !actual.has(e))
    expect(missing).toEqual([])
  })

  it('registrar sessão avança a etapa e nunca volta', async () => {
    const t = topicByTitle('Volumes')
    const today = new Date().toISOString().slice(0, 10)
    const r1 = await api.POST('/topics/{id}/sessions', {
      params: { path: { id: t.id } },
      body: { day: today, practiced: true, studied: false, completed: false },
    })
    expect(r1.data?.topic.stage).toBe('practicing')
    expect(r1.data?.topic.startedOn).toBe(today)
    const r2 = await api.POST('/topics/{id}/sessions', {
      params: { path: { id: t.id } },
      body: { day: today, studied: true, practiced: false, completed: false },
    })
    expect(r2.data?.topic.stage).toBe('practicing')
  })

  it('apagar a única sessão volta o tópico para planejado', async () => {
    const t = topicByTitle('Docker Compose')
    const today = new Date().toISOString().slice(0, 10)
    const { data } = await api.POST('/topics/{id}/sessions', {
      params: { path: { id: t.id } },
      body: { day: today, studied: true, practiced: false, completed: false },
    })
    const del = await api.DELETE('/sessions/{id}', {
      params: { path: { id: data!.session.id } },
    })
    expect(del.data?.topic.stage).toBe('planned')
    expect(del.data?.topic.startedOn).toBeNull()
  })

  it('tópicos novos entram no fim do módulo', async () => {
    const mod = getDb().modules.find((m) => m.title === 'Docker')!
    const { data } = await api.POST('/modules/{id}/topics', {
      params: { path: { id: mod.id } },
      body: { topics: [{ title: 'Redes' }, { title: 'Healthcheck' }] },
    })
    expect(data?.map((t) => t.position)).toEqual([3, 4])
  })

  it('arquivos sem Drive respondem drive_not_connected', async () => {
    const t = topicByTitle('Índices')
    const { error, response } = await api.GET('/topics/{id}/files', {
      params: { path: { id: t.id } },
    })
    expect(response.status).toBe(409)
    expect(error?.code).toBe('drive_not_connected')
    setScenario('com-drive')
    const ok = await api.GET('/topics/{id}/files', {
      params: { path: { id: topicByTitle('Índices').id } },
    })
    expect(ok.data?.totalFiles).toBe(1)
  })

  it('recusa dependência que cria ciclo', async () => {
    const db = getDb()
    const csharp = db.modules.find((m) => m.title === 'C#')!
    const docker = db.modules.find((m) => m.title === 'Docker')!
    const { response } = await api.PUT('/modules/{id}/dependencies', {
      params: { path: { id: csharp.id } },
      body: { ids: [docker.id] },
    })
    expect(response.status).toBe(409)
  })

  it('a prévia e o agendamento gravado têm as mesmas datas', async () => {
    const r = getDb().roadmaps.find((x) => x.name === 'Backend com .NET')!
    const body = { startDate: '2026-11-09', includeOptional: false }
    const preview = await api.POST('/roadmaps/{id}/schedule/preview', {
      params: { path: { id: r.id } },
      body,
    })
    const applied = await api.POST('/roadmaps/{id}/schedule', {
      params: { path: { id: r.id } },
      body,
    })
    expect(applied.data?.items).toEqual(preview.data?.items)
    // um tópico por dia, só em dias de estudo (seg a sex)
    const dates = preview.data!.items.map((i) => i.date)
    expect(new Set(dates).size).toBe(dates.length)
    expect(dates[0]).toBe('2026-11-09')
  })

  it('cenários deslogado e erro-500', async () => {
    setScenario('deslogado')
    expect((await api.GET('/me')).response.status).toBe(401)
    setScenario('erro-500')
    expect((await api.GET('/dashboard')).response.status).toBe(500)
    setScenario('vazio')
    expect((await api.GET('/roadmaps')).data).toEqual([])
  })

  it('busca ignora acento e plural', async () => {
    const { data } = await api.GET('/search', {
      params: { query: { q: 'indices' } },
    })
    expect(data?.items.some((i) => i.title === 'Índices')).toBe(true)
  })
})

describe('fábricas', () => {
  it('geram sempre os mesmos dados com a mesma semente', async () => {
    const { addRandomRoadmaps } = await import('./factories')
    const { createDb } = await import('./db')
    const a = addRandomRoadmaps(createDb({ empty: true }), 3)
    const b = addRandomRoadmaps(createDb({ empty: true }), 3)
    expect(a.topics.map((t) => t.title)).toEqual(b.topics.map((t) => t.title))
    expect(a.roadmaps).toHaveLength(3)
  })
})
