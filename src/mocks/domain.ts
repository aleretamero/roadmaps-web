/**
 * Regras do backend reproduzidas no mock (planejamento › Regras de negócio)
 * e montagem das respostas no formato do contrato.
 */
import type { Schemas } from '@/lib/api/client'
import { parseISODate, toISODate } from '@/lib/date'
import { STAGES } from '@/lib/stage'
import type { Stage } from '@/lib/stage'
import type { Db, DbModule, DbSession, DbTopic, Weekday } from './db'

const WEEKDAYS: Array<Weekday> = [
  'sunday',
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
]

export const today = () => toISODate(new Date())
export const now = () => new Date().toISOString()

export function addDays(date: string, n: number): string {
  const d = parseISODate(date)
  d.setDate(d.getDate() + n)
  return toISODate(d)
}

export function isStudyDay(db: Db, date: string): boolean {
  const wd = WEEKDAYS[parseISODate(date).getDay()]
  return wd !== undefined && db.preferences.studyDays.includes(wd)
}

const stageIndex = (s: Stage) => STAGES.indexOf(s)
const maxStage = (a: Stage, b: Stage) =>
  stageIndex(a) >= stageIndex(b) ? a : b

export function stageFromActivities(s: {
  studied: boolean
  practiced: boolean
  completed: boolean
}): Stage {
  if (s.completed) return 'completed'
  if (s.practiced) return 'practicing'
  if (s.studied) return 'studying'
  return 'planned'
}

/* ---------- consultas ---------- */

export const moduleOf = (db: Db, topic: DbTopic) =>
  db.modules.find((m) => m.id === topic.moduleId)!
export const roadmapOf = (db: Db, mod: DbModule) =>
  db.roadmaps.find((r) => r.id === mod.roadmapId)!
export const topicsOf = (db: Db, moduleId: number) =>
  db.topics
    .filter((t) => t.moduleId === moduleId)
    .sort((a, b) => a.position - b.position)
export const modulesOf = (db: Db, roadmapId: number) =>
  db.modules
    .filter((m) => m.roadmapId === roadmapId)
    .sort((a, b) => a.position - b.position)
export const dependsOn = (db: Db, moduleId: number) =>
  db.dependencies
    .filter((d) => d.moduleId === moduleId)
    .map((d) => d.dependsOnModuleId)

/** Data prevista: próximo agendamento a partir de hoje; se não houver, o último que passou. */
export function dueDate(db: Db, topicId: number): string | null {
  const dates = db.schedule
    .filter((s) => s.topicId === topicId)
    .map((s) => s.date)
    .sort()
  const t = today()
  return dates.find((d) => d >= t) ?? dates.at(-1) ?? null
}

export function isLate(db: Db, topic: DbTopic): boolean {
  const due = dueDate(db, topic.id)
  return (
    !!due && due < today() && !topic.startedOn && topic.stage !== 'completed'
  )
}

/** Módulo alternativo que não foi o escolhido no seu ponto de divisão. */
export function isNotChosen(db: Db, mod: DbModule): boolean {
  if (mod.kind !== 'alternative') return false
  const parents = dependsOn(db, mod.id)
  const choice = db.pathChoices.find(
    (c) => c.roadmapId === mod.roadmapId && parents.includes(c.branchModuleId),
  )
  return !choice || choice.chosenModuleId !== mod.id
}

/** Conta no progresso: tópico obrigatório de módulo obrigatório ou alternativa escolhida. */
function countsForProgress(db: Db, mod: DbModule, topic: DbTopic) {
  return !topic.isOptional && mod.kind !== 'optional' && !isNotChosen(db, mod)
}

function progressOf(
  db: Db,
  pairs: Array<[DbModule, DbTopic]>,
): Schemas['Progress'] {
  const req = pairs.filter(([m, t]) => countsForProgress(db, m, t))
  const completed = req.filter(([, t]) => t.stage === 'completed').length
  const total = req.length
  return {
    completed,
    total,
    percent: total ? Math.round((completed / total) * 100) : 0,
  }
}

export function moduleProgress(db: Db, mod: DbModule): Schemas['Progress'] {
  const ts = topicsOf(db, mod.id).filter((t) => !t.isOptional)
  const completed = ts.filter((t) => t.stage === 'completed').length
  return {
    completed,
    total: ts.length,
    percent: ts.length ? Math.round((completed / ts.length) * 100) : 0,
  }
}

export function roadmapProgress(db: Db, roadmapId: number) {
  const pairs = modulesOf(db, roadmapId).flatMap((m) =>
    topicsOf(db, m.id).map((t) => [m, t] as [DbModule, DbTopic]),
  )
  return progressOf(db, pairs)
}

function moduleStartedOn(db: Db, moduleId: number): string | null {
  return (
    topicsOf(db, moduleId)
      .map((t) => t.startedOn)
      .filter(Boolean)
      .sort()[0] ?? null
  )
}

function moduleStatus(db: Db, mod: DbModule): Schemas['ModuleStatus'] {
  const p = moduleProgress(db, mod)
  if (p.total > 0 && p.completed === p.total) return 'completed'
  return moduleStartedOn(db, mod.id) ? 'inProgress' : 'notStarted'
}

/* ---------- respostas ---------- */

export function topicRef(db: Db, topic: DbTopic): Schemas['TopicRef'] {
  const mod = moduleOf(db, topic)
  const r = roadmapOf(db, mod)
  return {
    id: topic.id,
    title: topic.title,
    moduleId: mod.id,
    moduleTitle: mod.title,
    roadmapId: r.id,
    roadmapName: r.name,
  }
}

export function topicSummary(db: Db, t: DbTopic): Schemas['TopicSummary'] {
  return {
    id: t.id,
    title: t.title,
    isOptional: t.isOptional,
    stage: t.stage,
    position: t.position,
    startedOn: t.startedOn,
    completedOn: t.completedOn,
    dueDate: dueDate(db, t.id),
    isLate: isLate(db, t),
    filesCount: db.files.filter((f) => f.topicId === t.id).length,
  }
}

export function topicDetail(db: Db, t: DbTopic): Schemas['TopicDetail'] {
  const ref = topicRef(db, t)
  return {
    ...topicSummary(db, t),
    description: t.description,
    moduleId: ref.moduleId,
    moduleTitle: ref.moduleTitle,
    roadmapId: ref.roadmapId,
    roadmapName: ref.roadmapName,
    scheduleEntries: db.schedule
      .filter((s) => s.topicId === t.id)
      .sort((a, b) => a.date.localeCompare(b.date)),
    counts: {
      sessions: db.sessions.filter((s) => s.topicId === t.id).length,
      notes: db.notes.filter((n) => n.topicId === t.id).length,
      resources: db.resources.filter((r) => r.topicId === t.id).length,
      files: db.files.filter((f) => f.topicId === t.id).length,
    },
    createdAt: t.createdAt,
    updatedAt: t.updatedAt,
  }
}

export function moduleNode(db: Db, m: DbModule): Schemas['ModuleNode'] {
  return {
    id: m.id,
    title: m.title,
    description: m.description,
    kind: m.kind,
    position: m.position,
    dependsOn: dependsOn(db, m.id),
    startedOn: moduleStartedOn(db, m.id),
    status: moduleStatus(db, m),
    progress: moduleProgress(db, m),
    topics: topicsOf(db, m.id).map((t) => topicSummary(db, t)),
  }
}

export function moduleDetail(db: Db, m: DbModule): Schemas['ModuleDetail'] {
  const r = roadmapOf(db, m)
  return {
    ...moduleNode(db, m),
    roadmapId: r.id,
    roadmapName: r.name,
    createdAt: m.createdAt,
    updatedAt: m.updatedAt,
  }
}

/** Ordem do roadmap: módulos por dependência (topológica) e depois posição. */
export function orderedModules(db: Db, roadmapId: number): Array<DbModule> {
  const mods = modulesOf(db, roadmapId)
  const done = new Set<number>()
  const out: Array<DbModule> = []
  while (out.length < mods.length) {
    const nextMod =
      mods.find(
        (m) => !done.has(m.id) && dependsOn(db, m.id).every((d) => done.has(d)),
      ) ?? mods.find((m) => !done.has(m.id))!
    done.add(nextMod.id)
    out.push(nextMod)
  }
  return out
}

export function roadmapSummary(
  db: Db,
  roadmapId: number,
): Schemas['RoadmapSummary'] {
  const r = db.roadmaps.find((x) => x.id === roadmapId)!
  const mods = orderedModules(db, roadmapId)
  const topics = mods.flatMap((m) => topicsOf(db, m.id))
  const next = mods
    .filter((m) => m.kind !== 'optional' && !isNotChosen(db, m))
    .flatMap((m) => topicsOf(db, m.id))
    .find((t) => t.stage !== 'completed' && !t.isOptional)
  const startedOn =
    topics
      .map((t) => t.startedOn)
      .filter(Boolean)
      .sort()[0] ?? null
  return {
    id: r.id,
    name: r.name,
    goal: r.goal,
    archivedAt: r.archivedAt,
    progress: roadmapProgress(db, r.id),
    nextTopic: next ? topicRef(db, next) : null,
    modulesCount: mods.length,
    topicsCount: topics.length,
    startedOn,
    updatedAt: r.updatedAt,
    stageCounts: stageCounts(db, mods),
    currentModules: mods
      .filter((m) => {
        if (isNotChosen(db, m)) return false
        const p = moduleProgress(db, m)
        return !!moduleStartedOn(db, m.id) && p.completed < p.total
      })
      .map((m) => m.title),
    nextTopicDate: next ? nextScheduled(db, next.id) : null,
  }
}

function stageCounts(db: Db, mods: Array<DbModule>): Schemas['StageCounts'] {
  const counts = { planned: 0, studying: 0, practicing: 0, completed: 0 }
  for (const m of mods)
    for (const t of topicsOf(db, m.id))
      if (countsForProgress(db, m, t)) counts[t.stage] += 1
  return counts
}

/** Próxima data agendada (de hoje em diante). */
function nextScheduled(db: Db, topicId: number): string | null {
  const t = today()
  return (
    db.schedule
      .filter((s) => s.topicId === topicId && s.date >= t)
      .map((s) => s.date)
      .sort()[0] ?? null
  )
}

export function roadmapDetail(
  db: Db,
  roadmapId: number,
): Schemas['RoadmapDetail'] {
  const r = db.roadmaps.find((x) => x.id === roadmapId)!
  const s = roadmapSummary(db, roadmapId)
  return {
    id: r.id,
    name: r.name,
    goal: r.goal,
    archivedAt: r.archivedAt,
    startedOn: s.startedOn,
    progress: s.progress,
    modules: modulesOf(db, roadmapId).map((m) => moduleNode(db, m)),
    pathChoices: db.pathChoices
      .filter((c) => c.roadmapId === roadmapId)
      .map(({ branchModuleId, chosenModuleId }) => ({
        branchModuleId,
        chosenModuleId,
      })),
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
  }
}

export function roadmapProgressDetail(
  db: Db,
  roadmapId: number,
): Schemas['RoadmapProgress'] {
  const mods = orderedModules(db, roadmapId)
  const totals = { planned: 0, studying: 0, practicing: 0, completed: 0 }
  for (const m of mods) {
    if (m.kind === 'optional' || isNotChosen(db, m)) continue
    for (const t of topicsOf(db, m.id)) if (!t.isOptional) totals[t.stage] += 1
  }
  const nodes = mods.map((m) => [m, moduleNode(db, m)] as const)
  return {
    progress: roadmapProgress(db, roadmapId),
    totals,
    startedOn: roadmapSummary(db, roadmapId).startedOn,
    groups: {
      inProgress: nodes
        .filter(([m, n]) => !isNotChosen(db, m) && n.status === 'inProgress')
        .map(([, n]) => n),
      upcoming: nodes
        .filter(([m, n]) => !isNotChosen(db, m) && n.status === 'notStarted')
        .map(([, n]) => n),
      completed: nodes
        .filter(([, n]) => n.status === 'completed')
        .map(([, n]) => n),
      notChosen: nodes.filter(([m]) => isNotChosen(db, m)).map(([, n]) => n),
    },
  }
}

export function sessionWithTopic(
  db: Db,
  s: DbSession,
): Schemas['SessionWithTopic'] {
  const topic = db.topics.find((t) => t.id === s.topicId)!
  return { ...s, topic: topicRef(db, topic) }
}

/* ---------- regras de escrita ---------- */

/** Recalcula etapa, início e conclusão do tópico a partir das sessões que existem. */
export function recalcTopic(db: Db, topic: DbTopic) {
  const sessions = db.sessions
    .filter((s) => s.topicId === topic.id)
    .sort((a, b) => a.day.localeCompare(b.day))
  let stage: Stage = 'planned'
  for (const s of sessions) stage = maxStage(stage, stageFromActivities(s))
  topic.stage = stage
  topic.startedOn = sessions[0]?.day ?? null
  topic.completedOn = sessions.find((s) => s.completed)?.day ?? null
  topic.updatedAt = now()
}

/** Registra a sessão: a etapa só avança (maior entre a atual e a das atividades). */
export function registerSession(
  db: Db,
  topic: DbTopic,
  body: Schemas['RegisterSessionRequest'],
): DbSession {
  const activities = {
    studied: body.studied ?? false,
    practiced: body.practiced ?? false,
    completed: body.completed ?? false,
  }
  const before = topic.stage
  const after = maxStage(before, stageFromActivities(activities))
  const session: DbSession = {
    id: ++db.seq,
    topicId: topic.id,
    day: body.day,
    ...activities,
    note: body.note ?? null,
    stageBefore: before,
    stageAfter: after,
    createdAt: now(),
  }
  db.sessions.push(session)
  topic.stage = after
  if (!topic.startedOn || body.day < topic.startedOn) topic.startedOn = body.day
  if (activities.completed && !topic.completedOn) topic.completedOn = body.day
  topic.updatedAt = now()
  return session
}

export function logChange(
  db: Db,
  change: Omit<Db['changes'][number], 'id' | 'occurredAt'>,
) {
  db.changes.push({ ...change, id: ++db.seq, occurredAt: now() })
}

/** `true` se `moduleId` passar a depender de `dependsOnId` criaria um ciclo. */
export function createsCycle(
  db: Db,
  moduleId: number,
  dependsOnIds: Array<number>,
): boolean {
  const seen = new Set<number>()
  const stack = [...dependsOnIds]
  while (stack.length) {
    const id = stack.pop()!
    if (id === moduleId) return true
    if (seen.has(id)) continue
    seen.add(id)
    stack.push(...dependsOn(db, id))
  }
  return false
}

/** Agendamento automático: um tópico por dia de estudo, na ordem do roadmap. */
export function schedulePreview(
  db: Db,
  roadmapId: number,
  body: Schemas['SchedulePreviewRequest'],
): Schemas['SchedulePreview'] {
  const includeOptional = body.includeOptional ?? db.preferences.includeOptional
  const only = body.topicIds?.length ? new Set(body.topicIds) : null
  const items: Schemas['SchedulePreview']['items'] = []
  const skipped: Schemas['SchedulePreview']['skipped'] = []
  let date = body.startDate
  const nextStudyDay = (from: string) => {
    let d = from
    for (let i = 0; i < 14 && !isStudyDay(db, d); i++) d = addDays(d, 1)
    return d
  }
  for (const m of orderedModules(db, roadmapId)) {
    for (const t of topicsOf(db, m.id)) {
      if (only && !only.has(t.id)) continue
      if (t.stage === 'completed') {
        skipped.push({ topicId: t.id, title: t.title, reason: 'completed' })
        continue
      }
      if (isNotChosen(db, m)) {
        skipped.push({ topicId: t.id, title: t.title, reason: 'notChosen' })
        continue
      }
      if ((t.isOptional || m.kind === 'optional') && !includeOptional) {
        skipped.push({ topicId: t.id, title: t.title, reason: 'optional' })
        continue
      }
      date = nextStudyDay(date)
      items.push({ topicId: t.id, title: t.title, moduleTitle: m.title, date })
      date = addDays(date, 1)
    }
  }
  return { items, skipped }
}

/* ---------- painel ---------- */

function sessionDays(db: Db): Set<string> {
  return new Set(db.sessions.map((s) => s.day))
}

/** Sequência: dias de estudo seguidos com sessão; dia fora dos dias de estudo não quebra. */
export function streak(db: Db): { current: number; best: number } {
  const days = sessionDays(db)
  const t = today()
  let current = 0
  let d = days.has(t) ? t : addDays(t, -1)
  for (let i = 0; i < 400; i++) {
    if (days.has(d)) current += 1
    else if (isStudyDay(db, d)) break
    d = addDays(d, -1)
  }
  const sorted = [...days].sort()
  let best = current
  let run = 0
  if (sorted.length) {
    let cursor = sorted[0]!
    const last = sorted.at(-1)!
    while (cursor <= last) {
      if (days.has(cursor)) best = Math.max(best, ++run)
      else if (isStudyDay(db, cursor)) run = 0
      cursor = addDays(cursor, 1)
    }
  }
  return { current, best }
}

const ACTIONS = ['studied', 'practiced', 'completed'] as const
type Action = (typeof ACTIONS)[number]

function actionsOf(sessions: Array<DbSession>): Array<Action> {
  return ACTIONS.filter((a) => sessions.some((s) => s[a]))
}

export function lastSessionOn(db: Db, topicId: number): string | null {
  return (
    db.sessions
      .filter((s) => s.topicId === topicId)
      .map((s) => s.day)
      .sort()
      .at(-1) ?? null
  )
}

const STALL_DAYS = 5

/** Em andamento sem sessão há 5+ dias e sem nada agendado de hoje em diante. */
export function isStalled(db: Db, t: DbTopic): boolean {
  if (t.stage !== 'studying' && t.stage !== 'practicing') return false
  const last = lastSessionOn(db, t.id) ?? t.startedOn
  if (!last || nextScheduled(db, t.id)) return false
  return last <= addDays(today(), -STALL_DAYS)
}

export function dashboardTopic(
  db: Db,
  t: DbTopic,
  attentionReason: 'late' | 'stalled' | null = null,
): Schemas['DashboardTopic'] {
  const day = today()
  return {
    topic: topicRef(db, t),
    stage: t.stage,
    isLate: isLate(db, t),
    dueDate: dueDate(db, t.id),
    lastSessionOn: lastSessionOn(db, t.id),
    todayActions: actionsOf(
      db.sessions.filter((s) => s.topicId === t.id && s.day === day),
    ),
    attentionReason,
  }
}

const activeTopics = (db: Db) =>
  db.topics.filter((t) => {
    const r = roadmapOf(db, moduleOf(db, t))
    return !r.archivedAt
  })

export function dashboard(db: Db): Schemas['Dashboard'] {
  const t = today()
  const topics = activeTopics(db)
  const scheduledOn = (date: string) =>
    topics.filter((tp) =>
      db.schedule.some((s) => s.topicId === tp.id && s.date === date),
    )
  const start = addDays(t, -parseISODate(t).getDay())
  const week = Array.from({ length: 7 }, (_, i) => {
    const date = addDays(start, i)
    const sessionsCount = db.sessions.filter((s) => s.day === date).length
    const plannedCount = scheduledOn(date).length
    const study = isStudyDay(db, date)
    const status: 'done' | 'planned' | 'missed' | 'rest' | 'future' =
      sessionsCount > 0
        ? 'done'
        : date > t
          ? plannedCount
            ? 'planned'
            : 'future'
          : date === t
            ? plannedCount
              ? 'planned'
              : study
                ? 'future'
                : 'rest'
            : study
              ? 'missed'
              : 'rest'
    const byTopic = new Map<number, Array<DbSession>>()
    for (const s of db.sessions.filter((x) => x.day === date))
      byTopic.set(s.topicId, [...(byTopic.get(s.topicId) ?? []), s])
    const workedActions = [...byTopic.values()].map(
      (ss) => actionsOf(ss).at(-1) ?? 'studied',
    )
    return {
      date,
      isStudyDay: study,
      sessionsCount,
      plannedCount,
      workedActions,
      status,
    }
  })
  const weekSessions = db.sessions.filter(
    (s) => s.day >= start && s.day <= addDays(start, 6),
  )
  const lastWeekSessions = db.sessions.filter(
    (s) => s.day >= addDays(start, -7) && s.day <= addDays(start, -1),
  )
  const countedTopics = topics.filter((tp) => {
    const m = moduleOf(db, tp)
    return countsForProgress(db, m, tp)
  })
  const inProgress = topics.filter(
    (tp) => tp.stage === 'studying' || tp.stage === 'practicing',
  )
  // Hoje: agendados (não concluídos) + os que tiveram sessão hoje.
  const workedToday = topics.filter((tp) =>
    db.sessions.some((s) => s.topicId === tp.id && s.day === t),
  )
  const todayTopics = [
    ...scheduledOn(t).filter((tp) => tp.stage !== 'completed'),
    ...workedToday,
  ].filter((tp, i, all) => all.findIndex((x) => x.id === tp.id) === i)
  const resume = inProgress
    .map((tp) => ({ tp, last: lastSessionOn(db, tp.id) ?? tp.startedOn ?? '' }))
    .sort((a, b) => (a.last < b.last ? 1 : -1))[0]
  const late = topics.filter((tp) => isLate(db, tp))
  const stalled = topics.filter((tp) => isStalled(db, tp))
  return {
    today: todayTopics.map((tp) => dashboardTopic(db, tp)),
    week,
    streak: streak(db),
    weekStats: {
      sessions: weekSessions.length,
      studyDays: new Set(weekSessions.map((s) => s.day)).size,
      topicsCompleted: weekSessions.filter((s) => s.completed).length,
      topicsWorked: new Set(
        weekSessions.filter((s) => s.day <= t).map((s) => s.topicId),
      ).size,
      topicsWorkedLastWeek: new Set(lastWeekSessions.map((s) => s.topicId))
        .size,
    },
    topics: {
      inProgress: inProgress.length,
      stalled: stalled.length,
      completed: countedTopics.filter((tp) => tp.stage === 'completed').length,
      required: countedTopics.length,
    },
    resume: resume ? dashboardTopic(db, resume.tp) : null,
    roadmaps: db.roadmaps
      .filter((r) => !r.archivedAt)
      .map((r) => roadmapSummary(db, r.id)),
    next7Days: Array.from({ length: 7 }, (_, i) => {
      const date = addDays(t, i + 1)
      return {
        date,
        topics: scheduledOn(date)
          .filter((tp) => tp.stage !== 'completed')
          .map((tp) => dashboardTopic(db, tp)),
      }
    }),
    attention: [
      ...late.map((tp) => dashboardTopic(db, tp, 'late')),
      ...stalled.map((tp) => dashboardTopic(db, tp, 'stalled')),
    ],
  }
}

export function activity(db: Db, weeks: number): Schemas['Activity'] {
  const t = today()
  const start = addDays(t, -(weeks * 7 - 1))
  const days: Schemas['Activity']['days'] = []
  for (let d = start; d <= t; d = addDays(d, 1)) {
    const ss = db.sessions.filter((s) => s.day === d)
    days.push({
      date: d,
      count: ss.length,
      topics: [
        ...new Set(
          ss.map(
            (s) => db.topics.find((tp) => tp.id === s.topicId)?.title ?? '',
          ),
        ),
      ],
    })
  }
  const inRange = db.sessions.filter((s) => s.day >= start && s.day <= t)
  return {
    weeks,
    days,
    totals: {
      studied: inRange.filter((s) => s.studied).length,
      practiced: inRange.filter((s) => s.practiced).length,
      completed: inRange.filter((s) => s.completed).length,
    },
  }
}

/* ---------- busca ---------- */

const fold = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

/** Busca simples: termos (com prefixo*), "frase exata" e -excluir, sem acento e sem caixa. */
export function matcher(q: string) {
  const phrases = [...q.matchAll(/"([^"]+)"/g)].map((m) => fold(m[1] ?? ''))
  const rest = q
    .replace(/"[^"]+"/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
  const exclude = rest
    .filter((w) => w.startsWith('-'))
    .map((w) => fold(w.slice(1)))
  const terms = rest
    .filter((w) => !w.startsWith('-'))
    .map((w) => fold(w.replace(/\*$/, '')))
  // "consultas" acha "consulta": compara pelo radical (sem s final).
  const stem = (w: string) => (w.length > 3 ? w.replace(/s$/, '') : w)
  return (text: string) => {
    const f = fold(text)
    if (exclude.some((e) => e && f.includes(e))) return false
    return (
      phrases.every((p) => f.includes(p)) &&
      terms.every((w) => f.includes(stem(w)))
    )
  }
}

export function snippet(text: string, q: string): string {
  const words = q
    .replace(/["*-]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 1)
  let out = text.length > 180 ? text.slice(0, 180) + '…' : text
  for (const w of words) {
    const re = new RegExp(
      `(${w
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`,
      'gi',
    )
    out = out.replace(re, '<mark>$1</mark>')
  }
  return out
}

/* ---------- arquivos ---------- */

export function fileTree(db: Db, topicId: number): Schemas['FileTree'] {
  const root: Schemas['FileNode'] = {
    path: '',
    name: '',
    type: 'folder',
    id: null,
    mimeType: null,
    sizeBytes: null,
    updatedAt: null,
    children: [],
  }
  const folder = (path: string): Schemas['FileNode'] => {
    if (!path) return root
    const parts = path.split('/')
    let node = root
    let acc = ''
    for (const part of parts) {
      acc = acc ? `${acc}/${part}` : part
      node.children ??= []
      let child = node.children.find(
        (c) => c.type === 'folder' && c.name === part,
      )
      if (!child) {
        child = {
          path: acc,
          name: part,
          type: 'folder',
          id: null,
          mimeType: null,
          sizeBytes: null,
          updatedAt: null,
          children: [],
        }
        node.children.push(child)
      }
      node = child
    }
    return node
  }
  for (const f of db.folders.filter((x) => x.topicId === topicId))
    folder(f.path)
  const files = db.files.filter((f) => f.topicId === topicId)
  for (const f of files) {
    const dir = f.path.includes('/')
      ? f.path.slice(0, f.path.lastIndexOf('/'))
      : ''
    const parent = folder(dir)
    ;(parent.children ??= []).push({
      path: f.path,
      name: f.path.split('/').at(-1) ?? f.path,
      type: 'file',
      id: f.id,
      mimeType: f.mimeType,
      sizeBytes: f.sizeBytes,
      updatedAt: f.updatedAt,
      children: [],
    })
  }
  return { root, totalFiles: files.length }
}
