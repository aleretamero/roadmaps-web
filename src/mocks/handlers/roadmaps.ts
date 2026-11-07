import type { Schemas } from '@/lib/api/client'
import type { Db, DbModule, DbTopic } from '../db'
import { getDb } from '../state'
import {
  createsCycle,
  dependsOn,
  logChange,
  moduleDetail,
  modulesOf,
  now,
  roadmapDetail,
  roadmapProgressDetail,
  roadmapSummary,
  topicDetail,
  topicSummary,
  topicsOf,
} from '../domain'
import {
  etag,
  findModule,
  findRoadmap,
  findTopic,
  http,
  noContent,
  notFound,
  num,
  preconditionFailed,
  problem,
  required,
} from './http'

/* ---------- apagar em cascata ---------- */

function deleteTopic(db: Db, topicId: number) {
  db.topics = db.topics.filter((t) => t.id !== topicId)
  db.schedule = db.schedule.filter((s) => s.topicId !== topicId)
  db.sessions = db.sessions.filter((s) => s.topicId !== topicId)
  db.notes = db.notes.filter((n) => n.topicId !== topicId)
  db.resources = db.resources.filter((r) => r.topicId !== topicId)
  db.files = db.files.filter((f) => f.topicId !== topicId)
  db.folders = db.folders.filter((f) => f.topicId !== topicId)
}

function deleteModule(db: Db, moduleId: number) {
  for (const t of topicsOf(db, moduleId)) deleteTopic(db, t.id)
  db.modules = db.modules.filter((m) => m.id !== moduleId)
  db.dependencies = db.dependencies.filter(
    (d) => d.moduleId !== moduleId && d.dependsOnModuleId !== moduleId,
  )
  db.notes = db.notes.filter((n) => n.moduleId !== moduleId)
  db.pathChoices = db.pathChoices.filter(
    (c) => c.branchModuleId !== moduleId && c.chosenModuleId !== moduleId,
  )
}

function touchRoadmap(db: Db, roadmapId: number) {
  const r = db.roadmaps.find((x) => x.id === roadmapId)
  if (r) r.updatedAt = now()
}

/* ---------- criar módulos (criação manual e importação) ---------- */

function addModule(
  db: Db,
  roadmapId: number,
  input: {
    title: string
    description?: string | null
    kind?: DbModule['kind']
  },
  after: Array<number>,
  alternativeTo: number | null,
): DbModule {
  const mods = modulesOf(db, roadmapId)
  const mod: DbModule = {
    id: ++db.seq,
    roadmapId,
    title: input.title.trim(),
    description: input.description ?? null,
    kind: alternativeTo ? 'alternative' : (input.kind ?? 'required'),
    position: mods.length,
    createdAt: now(),
    updatedAt: now(),
  }
  db.modules.push(mod)
  if (alternativeTo) {
    // Alternativa herda as dependências do módulo indicado, e ele passa a ser alternativa também.
    for (const d of dependsOn(db, alternativeTo))
      db.dependencies.push({ moduleId: mod.id, dependsOnModuleId: d })
    const other = db.modules.find((m) => m.id === alternativeTo)
    if (other) other.kind = 'alternative'
  } else {
    for (const a of after) {
      // Quem dependia de `a` passa a depender do módulo novo.
      for (const d of db.dependencies.filter((x) => x.dependsOnModuleId === a))
        d.dependsOnModuleId = mod.id
      db.dependencies.push({ moduleId: mod.id, dependsOnModuleId: a })
    }
  }
  logChange(db, {
    roadmapId,
    moduleId: mod.id,
    topicId: null,
    type: 'created',
    description: `Módulo “${mod.title}” criado`,
    payload: null,
  })
  return mod
}

function addTopics(
  db: Db,
  moduleId: number,
  topics: Array<Schemas['NewTopic']>,
): Array<DbTopic> {
  const start = topicsOf(db, moduleId).length
  const mod = db.modules.find((m) => m.id === moduleId)!
  return topics.map((t, i) => {
    const topic: DbTopic = {
      id: ++db.seq,
      moduleId,
      title: t.title.trim(),
      description: null,
      isOptional: t.isOptional ?? false,
      stage: 'planned',
      position: start + i,
      startedOn: null,
      completedOn: null,
      createdAt: now(),
      updatedAt: now(),
    }
    db.topics.push(topic)
    if (t.date)
      db.schedule.push({
        id: ++db.seq,
        topicId: topic.id,
        date: t.date,
        source: 'manual',
      })
    logChange(db, {
      roadmapId: mod.roadmapId,
      moduleId,
      topicId: topic.id,
      type: 'created',
      description: `Tópico “${topic.title}” criado`,
      payload: null,
    })
    return topic
  })
}

/** Valida e (se não for dry run) importa módulos, resolvendo `after`/`alternativeTo` por título. */
function importModules(
  db: Db,
  roadmapId: number,
  modules: Array<Schemas['ImportModule']>,
  dryRun: boolean,
): { errors: Record<string, Array<string>>; modules: number; topics: number } {
  const errors: Record<string, Array<string>> = {}
  const err = (path: string, msg: string) => (errors[path] ??= []).push(msg)
  const existing = new Map(
    modulesOf(db, roadmapId).map((m) => [m.title.toLowerCase(), m.id]),
  )
  const inFile = new Set<string>()
  modules.forEach((m, i) => {
    if (!m.title.trim()) err(`modules[${i}].title`, 'Obrigatório')
    const known = (t: string) =>
      existing.has(t.toLowerCase()) || inFile.has(t.toLowerCase())
    ;(m.after ?? []).forEach((a, j) => {
      if (!known(a))
        err(`modules[${i}].after[${j}]`, `Módulo “${a}” não existe antes deste`)
      if (a.toLowerCase() === m.title.toLowerCase())
        err(
          `modules[${i}].after[${j}]`,
          'Um módulo não pode depender dele mesmo',
        )
    })
    if (m.alternativeTo && !known(m.alternativeTo))
      err(
        `modules[${i}].alternativeTo`,
        `Módulo “${m.alternativeTo}” não existe`,
      )
    ;(m.topics ?? []).forEach((t, j) => {
      if (!t.title.trim())
        err(`modules[${i}].topics[${j}].title`, 'Obrigatório')
    })
    inFile.add(m.title.toLowerCase())
  })
  const topics = modules.reduce((n, m) => n + (m.topics?.length ?? 0), 0)
  if (dryRun || Object.keys(errors).length)
    return { errors, modules: modules.length, topics }
  const ids = new Map(existing)
  for (const m of modules) {
    const after = (m.after ?? [])
      .map((a) => ids.get(a.toLowerCase())!)
      .filter(Boolean)
    const alt = m.alternativeTo
      ? (ids.get(m.alternativeTo.toLowerCase()) ?? null)
      : null
    const mod = addModule(db, roadmapId, m, after, alt)
    ids.set(mod.title.toLowerCase(), mod.id)
    addTopics(
      db,
      mod.id,
      (m.topics ?? []).map((t) => ({
        title: t.title,
        isOptional: t.isOptional ?? false,
        date: null,
      })),
    )
  }
  touchRoadmap(db, roadmapId)
  return { errors, modules: modules.length, topics }
}

function newRoadmap(db: Db, name: string, goal: string | null) {
  const r = {
    id: ++db.seq,
    name: name.trim(),
    goal,
    archivedAt: null,
    createdAt: now(),
    updatedAt: now(),
  }
  db.roadmaps.push(r)
  logChange(db, {
    roadmapId: r.id,
    moduleId: null,
    topicId: null,
    type: 'created',
    description: `Roadmap “${r.name}” criado`,
    payload: null,
  })
  return r
}

function reorder<T extends { id: number; position: number }>(
  items: Array<T>,
  ids: Array<number>,
) {
  if (ids.length !== items.length || !items.every((i) => ids.includes(i.id)))
    return false
  for (const item of items) item.position = ids.indexOf(item.id)
  return true
}

export const roadmapHandlers = [
  http.get('/roadmaps', ({ query, response }) => {
    const db = getDb()
    const archived = query.get('archived') === 'true'
    return response(200).json(
      db.roadmaps
        .filter((r) => !!r.archivedAt === archived)
        .map((r) => roadmapSummary(db, r.id)),
    )
  }),
  http.post('/roadmaps', async ({ request, response }) => {
    const body = await request.json()
    const invalid = required({ name: body.name })
    if (invalid) return invalid as never
    const db = getDb()
    if (body.modules?.length) {
      const probe = { ...db, modules: [...db.modules] }
      const check = importModules(probe, -1, body.modules, true)
      if (Object.keys(check.errors).length)
        return problem(
          400,
          'validation_error',
          'Módulos inválidos',
          check.errors,
        )
    }
    const r = newRoadmap(db, body.name, body.goal ?? null)
    if (body.modules?.length) importModules(db, r.id, body.modules, false)
    return response(201).json(roadmapDetail(db, r.id))
  }),
  http.post('/roadmaps/import', async ({ request, query, response }) => {
    const body = await request.json()
    const db = getDb()
    const dryRun = query.get('dryRun') === 'true'
    const invalid = required({ name: body.name })
    if (invalid) return invalid as never
    const check = importModules(
      { ...db, modules: [...db.modules] },
      -1,
      body.modules,
      true,
    )
    if (Object.keys(check.errors).length)
      return problem(400, 'validation_error', 'Arquivo inválido', check.errors)
    if (dryRun)
      return response(201).json({
        roadmapId: 0,
        modulesCreated: check.modules,
        topicsCreated: check.topics,
        dryRun: true,
      })
    const r = newRoadmap(db, body.name, body.goal ?? null)
    const res = importModules(db, r.id, body.modules, false)
    return response(201).json({
      roadmapId: r.id,
      modulesCreated: res.modules,
      topicsCreated: res.topics,
      dryRun: false,
    })
  }),
  http.get('/roadmaps/{id}', ({ params, response }) => {
    const r = findRoadmap(num(params.id))
    if (!r) return notFound()
    return response(200).json(roadmapDetail(getDb(), r.id), {
      headers: { ETag: etag(r.updatedAt) },
    })
  }),
  http.patch('/roadmaps/{id}', async ({ params, request, response }) => {
    const db = getDb()
    const r = findRoadmap(num(params.id))
    if (!r) return notFound()
    const stale = preconditionFailed(request, r.updatedAt)
    if (stale) return stale as never
    const body = await request.json()
    if (body.name !== undefined && body.name !== r.name) {
      if (!body.name.trim())
        return problem(400, 'validation_error', 'Campos inválidos', {
          name: ['Obrigatório'],
        })
      logChange(db, {
        roadmapId: r.id,
        moduleId: null,
        topicId: null,
        type: 'renamed',
        description: `Renomeado de “${r.name}” para “${body.name}”`,
        payload: { before: r.name, after: body.name },
      })
      r.name = body.name.trim()
    }
    if (body.goal !== undefined) r.goal = body.goal
    r.updatedAt = now()
    return response(200).json(roadmapDetail(db, r.id))
  }),
  http.delete('/roadmaps/{id}', ({ params }) => {
    const db = getDb()
    const id = num(params.id)
    if (!findRoadmap(id)) return notFound()
    for (const m of modulesOf(db, id)) deleteModule(db, m.id)
    db.roadmaps = db.roadmaps.filter((r) => r.id !== id)
    db.changes = db.changes.filter((c) => c.roadmapId !== id)
    return noContent()
  }),
  http.post('/roadmaps/{id}/archive', ({ params }) => {
    const r = findRoadmap(num(params.id))
    if (!r) return notFound()
    r.archivedAt = now()
    return noContent()
  }),
  http.post('/roadmaps/{id}/unarchive', ({ params }) => {
    const r = findRoadmap(num(params.id))
    if (!r) return notFound()
    r.archivedAt = null
    return noContent()
  }),
  http.get('/roadmaps/{id}/progress', ({ params, response }) => {
    const r = findRoadmap(num(params.id))
    if (!r) return notFound()
    return response(200).json(roadmapProgressDetail(getDb(), r.id))
  }),
  http.put(
    '/roadmaps/{id}/path-choices/{branchModuleId}',
    async ({ params, request, response }) => {
      const db = getDb()
      const roadmapId = num(params.id)
      const branchModuleId = num(params.branchModuleId)
      const { chosenModuleId } = await request.json()
      const chosen = findModule(chosenModuleId)
      if (!findRoadmap(roadmapId) || !chosen || chosen.roadmapId !== roadmapId)
        return notFound()
      if (
        chosen.kind !== 'alternative' ||
        !dependsOn(db, chosen.id).includes(branchModuleId)
      )
        return problem(
          400,
          'validation_error',
          'Esse módulo não é alternativa deste ponto',
          { chosenModuleId: ['Não é alternativa deste ponto'] },
        )
      db.pathChoices = db.pathChoices.filter(
        (c) =>
          !(c.roadmapId === roadmapId && c.branchModuleId === branchModuleId),
      )
      db.pathChoices.push({ roadmapId, branchModuleId, chosenModuleId })
      return response(200).json({ branchModuleId, chosenModuleId })
    },
  ),
  http.put('/roadmaps/{id}/modules/order', async ({ params, request }) => {
    const db = getDb()
    const { ids } = await request.json()
    if (!reorder(modulesOf(db, num(params.id)), ids))
      return problem(400, 'validation_error', 'Lista de módulos incompleta', {
        ids: ['Mande todos os módulos do roadmap'],
      })
    return noContent()
  }),
  http.get('/roadmaps/{id}/changelog', ({ params, response }) => {
    const db = getDb()
    const items = db.changes
      .filter((c) => c.roadmapId === num(params.id))
      .sort((a, b) => b.occurredAt.localeCompare(a.occurredAt))
    return response(200).json({
      items: items as Array<Schemas['ChangeLogEntry']>,
      nextCursor: null,
    })
  }),
  http.post(
    '/roadmaps/{id}/import',
    async ({ params, request, query, response }) => {
      const db = getDb()
      const id = num(params.id)
      if (!findRoadmap(id)) return notFound()
      const { modules } = await request.json()
      const dryRun = query.get('dryRun') === 'true'
      const res = importModules(db, id, modules, dryRun)
      if (Object.keys(res.errors).length)
        return problem(400, 'validation_error', 'Arquivo inválido', res.errors)
      return response(200).json({
        roadmapId: id,
        modulesCreated: res.modules,
        topicsCreated: res.topics,
        dryRun,
      })
    },
  ),
  http.post('/roadmaps/{id}/modules', async ({ params, request, response }) => {
    const db = getDb()
    const roadmapId = num(params.id)
    if (!findRoadmap(roadmapId)) return notFound()
    const body = await request.json()
    const invalid = required({ title: body.title })
    if (invalid) return invalid as never
    const after = body.after ?? []
    if (after.some((a) => findModule(a)?.roadmapId !== roadmapId))
      return problem(400, 'validation_error', 'Módulo de outro roadmap', {
        after: ['Módulo não pertence a este roadmap'],
      })
    const mod = addModule(
      db,
      roadmapId,
      body,
      after,
      body.alternativeTo ?? null,
    )
    touchRoadmap(db, roadmapId)
    return response(201).json(moduleDetail(db, mod))
  }),

  http.get('/modules/{id}', ({ params, response }) => {
    const m = findModule(num(params.id))
    if (!m) return notFound()
    return response(200).json(moduleDetail(getDb(), m), {
      headers: { ETag: etag(m.updatedAt) },
    })
  }),
  http.patch('/modules/{id}', async ({ params, request, response }) => {
    const db = getDb()
    const m = findModule(num(params.id))
    if (!m) return notFound()
    const stale = preconditionFailed(request, m.updatedAt)
    if (stale) return stale as never
    const body = await request.json()
    if (body.title !== undefined && body.title !== m.title) {
      if (!body.title.trim())
        return problem(400, 'validation_error', 'Campos inválidos', {
          title: ['Obrigatório'],
        })
      logChange(db, {
        roadmapId: m.roadmapId,
        moduleId: m.id,
        topicId: null,
        type: 'renamed',
        description: `Módulo renomeado de “${m.title}” para “${body.title}”`,
        payload: { before: m.title, after: body.title },
      })
      m.title = body.title.trim()
    }
    if (body.description !== undefined) m.description = body.description
    if (body.kind !== undefined) m.kind = body.kind
    m.updatedAt = now()
    return response(200).json(moduleDetail(db, m))
  }),
  http.delete('/modules/{id}', ({ params }) => {
    const db = getDb()
    const m = findModule(num(params.id))
    if (!m) return notFound()
    deleteModule(db, m.id)
    logChange(db, {
      roadmapId: m.roadmapId,
      moduleId: null,
      topicId: null,
      type: 'deleted',
      description: `Módulo “${m.title}” apagado`,
      payload: null,
    })
    return noContent()
  }),
  http.put('/modules/{id}/dependencies', async ({ params, request }) => {
    const db = getDb()
    const m = findModule(num(params.id))
    if (!m) return notFound()
    const { ids } = await request.json()
    if (ids.some((d) => findModule(d)?.roadmapId !== m.roadmapId))
      return problem(400, 'validation_error', 'Módulo de outro roadmap', {
        ids: ['Módulo não pertence a este roadmap'],
      })
    if (createsCycle(db, m.id, ids))
      return problem(
        409,
        'dependency_cycle',
        'Essa dependência criaria um ciclo',
      )
    db.dependencies = [
      ...db.dependencies.filter((d) => d.moduleId !== m.id),
      ...ids.map((d) => ({ moduleId: m.id, dependsOnModuleId: d })),
    ]
    return noContent()
  }),
  http.post('/modules/{id}/topics', async ({ params, request, response }) => {
    const db = getDb()
    const m = findModule(num(params.id))
    if (!m) return notFound()
    const { topics } = await request.json()
    const errors: Record<string, Array<string>> = {}
    topics.forEach((t, i) => {
      if (!t.title.trim()) errors[`topics[${i}].title`] = ['Obrigatório']
    })
    if (!topics.length) errors.topics = ['Mande pelo menos um tópico']
    if (Object.keys(errors).length)
      return problem(400, 'validation_error', 'Tópicos inválidos', errors)
    const created = addTopics(db, m.id, topics)
    return response(201).json(created.map((t) => topicSummary(db, t)))
  }),
  http.put('/modules/{id}/topics/order', async ({ params, request }) => {
    const db = getDb()
    const { ids } = await request.json()
    if (!reorder(topicsOf(db, num(params.id)), ids))
      return problem(400, 'validation_error', 'Lista de tópicos incompleta', {
        ids: ['Mande todos os tópicos do módulo'],
      })
    return noContent()
  }),

  http.get('/topics/{id}', ({ params, response }) => {
    const t = findTopic(num(params.id))
    if (!t) return notFound()
    return response(200).json(topicDetail(getDb(), t), {
      headers: { ETag: etag(t.updatedAt) },
    })
  }),
  http.patch('/topics/{id}', async ({ params, request, response }) => {
    const db = getDb()
    const t = findTopic(num(params.id))
    if (!t) return notFound()
    const stale = preconditionFailed(request, t.updatedAt)
    if (stale) return stale as never
    const body = await request.json()
    const mod = findModule(t.moduleId)!
    if (body.title !== undefined && body.title !== t.title) {
      if (!body.title.trim())
        return problem(400, 'validation_error', 'Campos inválidos', {
          title: ['Obrigatório'],
        })
      logChange(db, {
        roadmapId: mod.roadmapId,
        moduleId: mod.id,
        topicId: t.id,
        type: 'renamed',
        description: `Renomeado de “${t.title}” para “${body.title}”`,
        payload: { before: t.title, after: body.title },
      })
      t.title = body.title.trim()
    }
    if (body.description !== undefined) t.description = body.description
    if (body.isOptional !== undefined) t.isOptional = body.isOptional
    t.updatedAt = now()
    return response(200).json(topicDetail(db, t))
  }),
  http.delete('/topics/{id}', ({ params }) => {
    const db = getDb()
    const t = findTopic(num(params.id))
    if (!t) return notFound()
    const mod = findModule(t.moduleId)!
    deleteTopic(db, t.id)
    topicsOf(db, mod.id).forEach((x, i) => (x.position = i))
    logChange(db, {
      roadmapId: mod.roadmapId,
      moduleId: mod.id,
      topicId: null,
      type: 'deleted',
      description: `Tópico “${t.title}” apagado`,
      payload: null,
    })
    return noContent()
  }),
  http.post('/topics/{id}/move', async ({ params, request }) => {
    const db = getDb()
    const t = findTopic(num(params.id))
    if (!t) return notFound()
    const { moduleId, position } = await request.json()
    const from = findModule(t.moduleId)!
    const to = findModule(moduleId)
    if (!to || to.roadmapId !== from.roadmapId) return notFound()
    const source = topicsOf(db, from.id).filter((x) => x.id !== t.id)
    source.forEach((x, i) => (x.position = i))
    const target = topicsOf(db, to.id).filter((x) => x.id !== t.id)
    target.splice(Math.min(position, target.length), 0, t)
    t.moduleId = to.id
    target.forEach((x, i) => (x.position = i))
    if (from.id !== to.id)
      logChange(db, {
        roadmapId: from.roadmapId,
        moduleId: to.id,
        topicId: t.id,
        type: 'moved',
        description: `Movido de “${from.title}” para “${to.title}”`,
        payload: { from: from.id, to: to.id },
      })
    return noContent()
  }),
  http.post('/topics/{id}/reopen', async ({ params, request, response }) => {
    const db = getDb()
    const t = findTopic(num(params.id))
    if (!t) return notFound()
    const { stage } = await request.json()
    const order = ['planned', 'studying', 'practicing', 'completed']
    if (order.indexOf(stage) >= order.indexOf(t.stage))
      return problem(
        422,
        'invalid_stage',
        'Reabrir só volta para uma etapa anterior',
      )
    const mod = findModule(t.moduleId)!
    logChange(db, {
      roadmapId: mod.roadmapId,
      moduleId: mod.id,
      topicId: t.id,
      type: 'stageReopened',
      description: `Etapa voltou de ${t.stage} para ${stage}`,
      payload: { before: t.stage, after: stage },
    })
    t.stage = stage
    if (stage !== 'completed') t.completedOn = null
    if (stage === 'planned') t.startedOn = null
    t.updatedAt = now()
    return response(200).json(topicDetail(db, t))
  }),
]
