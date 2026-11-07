import type { Schemas } from '@/lib/api/client'
import { getDb } from '../state'
import {
  addDays,
  isLate,
  isStudyDay,
  logChange,
  recalcTopic,
  registerSession,
  schedulePreview,
  sessionWithTopic,
  today,
  topicRef,
  topicSummary,
  topicsOf,
} from '../domain'
import {
  findModule,
  findRoadmap,
  findTopic,
  http,
  noContent,
  notFound,
  num,
  problem,
  problemResponse,
} from './http'

function validDay(day: string | undefined) {
  if (!day || !/^\d{4}-\d{2}-\d{2}$/.test(day))
    return problemResponse(400, 'validation_error', 'Data inválida', {
      day: ['Data inválida'],
    })
  if (day > today())
    return problemResponse(400, 'validation_error', 'Data no futuro', {
      day: ['A sessão não pode ser num dia futuro'],
    })
  return null
}

const topicState = (t: {
  id: number
  stage: Schemas['Stage']
  startedOn: string | null
  completedOn: string | null
}) => ({
  id: t.id,
  stage: t.stage,
  startedOn: t.startedOn,
  completedOn: t.completedOn,
})

export const studyHandlers = [
  http.post('/topics/{id}/sessions', async ({ params, request, response }) => {
    const db = getDb()
    const topic = findTopic(num(params.id))
    if (!topic) return notFound()
    const body = await request.json()
    const invalid = validDay(body.day)
    if (invalid) return invalid as never
    if (!body.studied && !body.practiced && !body.completed)
      return problem(400, 'validation_error', 'Marque o que você fez', {
        activities: ['Marque Estudei, Pratiquei ou Concluí'],
      })
    const session = registerSession(db, topic, body)
    return response(201).json({ session, topic: topicState(topic) })
  }),
  http.get('/sessions', ({ query, response }) => {
    const db = getDb()
    const from = query.get('from')
    const to = query.get('to')
    return response(200).json(
      db.sessions
        .filter((s) => s.day >= from && s.day <= to)
        .sort((a, b) => b.day.localeCompare(a.day))
        .map((s) => sessionWithTopic(db, s)),
    )
  }),
  http.patch('/sessions/{id}', async ({ params, request, response }) => {
    const db = getDb()
    const s = db.sessions.find((x) => x.id === num(params.id))
    if (!s) return notFound()
    const body = await request.json()
    if (body.day !== undefined) {
      const invalid = validDay(body.day)
      if (invalid) return invalid as never
    }
    Object.assign(s, body)
    const topic = findTopic(s.topicId)!
    recalcTopic(db, topic)
    return response(200).json({ session: s, topic: topicState(topic) })
  }),
  http.delete('/sessions/{id}', ({ params, response }) => {
    const db = getDb()
    const s = db.sessions.find((x) => x.id === num(params.id))
    if (!s) return notFound()
    db.sessions = db.sessions.filter((x) => x.id !== s.id)
    const topic = findTopic(s.topicId)!
    recalcTopic(db, topic)
    return response(200).json({ topic: topicSummary(db, topic) })
  }),

  http.get('/schedule', ({ query, response }) => {
    const db = getDb()
    const from = query.get('from')
    const to = query.get('to')
    const days: Array<Schemas['ScheduleDay']> = []
    for (let d = from; d <= to; d = addDays(d, 1)) {
      days.push({
        date: d,
        isStudyDay: isStudyDay(db, d),
        entries: db.schedule
          .filter((e) => e.date === d)
          .map((entry) => {
            const t = findTopic(entry.topicId)!
            return {
              entry,
              topic: topicRef(db, t),
              stage: t.stage,
              isLate: isLate(db, t),
            }
          }),
        sessions: db.sessions
          .filter((s) => s.day === d)
          .map((s) => sessionWithTopic(db, s)),
      })
    }
    return response(200).json({ from, to, days })
  }),
  http.post(
    '/topics/{id}/schedule-entries',
    async ({ params, request, response }) => {
      const db = getDb()
      const topic = findTopic(num(params.id))
      if (!topic) return notFound()
      const { date } = await request.json()
      if (db.schedule.some((e) => e.topicId === topic.id && e.date === date))
        return problem(
          409,
          'conflict',
          'Esse tópico já está agendado nesse dia',
        )
      const entry = {
        id: ++db.seq,
        topicId: topic.id,
        date,
        source: 'manual' as const,
      }
      db.schedule.push(entry)
      return response(201).json(entry)
    },
  ),
  http.patch(
    '/schedule-entries/{id}',
    async ({ params, request, response }) => {
      const db = getDb()
      const entry = db.schedule.find((e) => e.id === num(params.id))
      if (!entry) return notFound()
      const { date } = await request.json()
      if (
        db.schedule.some(
          (e) =>
            e.id !== entry.id && e.topicId === entry.topicId && e.date === date,
        )
      )
        return problem(
          409,
          'conflict',
          'Esse tópico já está agendado nesse dia',
        )
      const topic = findTopic(entry.topicId)!
      const mod = findModule(topic.moduleId)!
      logChange(db, {
        roadmapId: mod.roadmapId,
        moduleId: mod.id,
        topicId: topic.id,
        type: 'dateChanged',
        description: `Data trocada de ${entry.date} para ${date}`,
        payload: { before: entry.date, after: date },
      })
      entry.date = date
      return response(200).json(entry)
    },
  ),
  http.delete('/schedule-entries/{id}', ({ params }) => {
    const db = getDb()
    db.schedule = db.schedule.filter((e) => e.id !== num(params.id))
    return noContent()
  }),
  http.post(
    '/roadmaps/{id}/schedule/preview',
    async ({ params, request, response }) => {
      const id = num(params.id)
      if (!findRoadmap(id)) return notFound()
      return response(200).json(
        schedulePreview(getDb(), id, await request.json()),
      )
    },
  ),
  http.post(
    '/roadmaps/{id}/schedule',
    async ({ params, request, response }) => {
      const db = getDb()
      const id = num(params.id)
      if (!findRoadmap(id)) return notFound()
      const preview = schedulePreview(db, id, await request.json())
      const ids = new Set(preview.items.map((i) => i.topicId))
      // Substitui os agendamentos automáticos futuros dos mesmos tópicos.
      db.schedule = db.schedule.filter(
        (e) =>
          !(ids.has(e.topicId) && e.source === 'auto' && e.date >= today()),
      )
      for (const item of preview.items)
        if (
          !db.schedule.some(
            (e) => e.topicId === item.topicId && e.date === item.date,
          )
        )
          db.schedule.push({
            id: ++db.seq,
            topicId: item.topicId,
            date: item.date,
            source: 'auto',
          })
      return response(200).json(preview)
    },
  ),

  http.get('/topics/{id}/timeline', ({ params, query, response }) => {
    const db = getDb()
    const topic = findTopic(num(params.id))
    if (!topic) return notFound()
    const type = query.get('type')
    const sessions =
      type === 'changes'
        ? []
        : db.sessions.filter((s) => s.topicId === topic.id)
    const changes =
      type === 'sessions'
        ? []
        : db.changes.filter((c) => c.topicId === topic.id)
    const items: Array<Schemas['TimelineItem']> = [
      ...sessions.map((s) => ({
        kind: 'session' as const,
        occurredAt: s.createdAt,
        session: sessionWithTopic(db, s),
        change: null,
      })),
      ...changes.map((c) => ({
        kind: 'change' as const,
        occurredAt: c.occurredAt,
        session: null,
        change: c as Schemas['ChangeLogEntry'],
      })),
    ].sort((a, b) => b.occurredAt.localeCompare(a.occurredAt))
    return response(200).json({ items: items, nextCursor: null })
  }),
  http.get('/modules/{id}/timeline', ({ params, query, response }) => {
    const db = getDb()
    const mod = findModule(num(params.id))
    if (!mod) return notFound()
    const type = query.get('type')
    const topicIds = new Set(topicsOf(db, mod.id).map((t) => t.id))
    const sessions =
      type === 'changes'
        ? []
        : db.sessions.filter(
            (s) => topicIds.has(s.topicId) && s.stageAfter !== s.stageBefore,
          )
    const changes =
      type === 'progress' ? [] : db.changes.filter((c) => c.moduleId === mod.id)
    const items: Array<Schemas['TimelineItem']> = [
      ...sessions.map((s) => ({
        kind: 'session' as const,
        occurredAt: s.createdAt,
        session: sessionWithTopic(db, s),
        change: null,
      })),
      ...changes.map((c) => ({
        kind: 'change' as const,
        occurredAt: c.occurredAt,
        session: null,
        change: c as Schemas['ChangeLogEntry'],
      })),
    ].sort((a, b) => b.occurredAt.localeCompare(a.occurredAt))
    return response(200).json({ items: items, nextCursor: null })
  }),
]
