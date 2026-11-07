/**
 * Banco em memória do mock. Guarda as entidades como as tabelas do backend
 * (planejamento do banco) e as respostas são montadas em `domain.ts`.
 */
import type { Stage } from '@/lib/stage'
import { toISODate } from '@/lib/date'

export type ModuleKind = 'required' | 'optional' | 'alternative'
export type Weekday =
  | 'sunday'
  | 'monday'
  | 'tuesday'
  | 'wednesday'
  | 'thursday'
  | 'friday'
  | 'saturday'

export type DbUser = {
  id: string
  name: string
  email: string
  avatarUrl: string | null
  timeZone: string
}
export type DbPreferences = {
  studyDays: Array<Weekday>
  includeOptional: boolean
  homePage: 'dashboard' | 'roadmaps' | 'schedule'
  reminderEnabled: boolean
  reminderTime: string
}
export type DbRoadmap = {
  id: number
  name: string
  goal: string | null
  archivedAt: string | null
  createdAt: string
  updatedAt: string
}
export type DbModule = {
  id: number
  roadmapId: number
  title: string
  description: string | null
  kind: ModuleKind
  position: number
  createdAt: string
  updatedAt: string
}
export type DbTopic = {
  id: number
  moduleId: number
  title: string
  description: string | null
  isOptional: boolean
  stage: Stage
  position: number
  startedOn: string | null
  completedOn: string | null
  createdAt: string
  updatedAt: string
}
export type DbScheduleEntry = {
  id: number
  topicId: number
  date: string
  source: 'manual' | 'auto'
}
export type DbSession = {
  id: number
  topicId: number
  day: string
  studied: boolean
  practiced: boolean
  completed: boolean
  note: string | null
  stageBefore: Stage
  stageAfter: Stage
  createdAt: string
}
export type DbChange = {
  id: number
  roadmapId: number
  moduleId: number | null
  topicId: number | null
  type:
    | 'created'
    | 'renamed'
    | 'moved'
    | 'dateChanged'
    | 'stageReopened'
    | 'deleted'
    | 'updated'
  description: string
  payload: Record<string, unknown> | null
  occurredAt: string
}
export type DbNote = {
  id: number
  topicId: number | null
  moduleId: number | null
  content: string
  createdAt: string
  editedAt: string | null
  version: number
}
export type DbResource = {
  id: number
  topicId: number
  title: string
  url: string
  kind: 'article' | 'video' | 'book' | 'course' | 'other'
  createdAt: string
}
export type DbFile = {
  id: number
  topicId: number
  path: string
  mimeType: string
  sizeBytes: number
  content: string
  updatedAt: string
}

export type Db = {
  loggedIn: boolean
  user: DbUser
  preferences: DbPreferences
  drive: {
    connected: boolean
    accountEmail: string | null
    rootFolderName: string | null
    connectedAt: string | null
  }
  pushSubscriptions: Array<{ id: number; endpoint: string; createdAt: string }>
  roadmaps: Array<DbRoadmap>
  modules: Array<DbModule>
  dependencies: Array<{ moduleId: number; dependsOnModuleId: number }>
  pathChoices: Array<{
    roadmapId: number
    branchModuleId: number
    chosenModuleId: number
  }>
  topics: Array<DbTopic>
  schedule: Array<DbScheduleEntry>
  sessions: Array<DbSession>
  changes: Array<DbChange>
  notes: Array<DbNote>
  resources: Array<DbResource>
  files: Array<DbFile>
  folders: Array<{ topicId: number; path: string }>
  seq: number
}

/** Dia relativo a hoje, em `yyyy-MM-dd`. */
export function day(offset: number, from = new Date()): string {
  const d = new Date(from.getFullYear(), from.getMonth(), from.getDate())
  d.setDate(d.getDate() + offset)
  return toISODate(d)
}

/** Momento (ISO) num dia relativo a hoje. */
function at(offset: number, hour = 19): string {
  const d = new Date()
  d.setDate(d.getDate() + offset)
  d.setHours(hour, 0, 0, 0)
  return d.toISOString()
}

/** Gerador pseudoaleatório com semente fixa: o mock é igual em toda execução. */
function rng(seed: number) {
  let s = seed
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296
    return s / 4294967296
  }
}

type SeedTopic = {
  title: string
  stage?: Stage
  started?: number
  completed?: number
  due?: number
  optional?: boolean
  description?: string
}
type SeedModule = {
  title: string
  description?: string
  kind?: ModuleKind
  after?: Array<string>
  topics: Array<SeedTopic>
}
type SeedRoadmap = {
  name: string
  goal: string
  archived?: boolean
  created: number
  modules: Array<SeedModule>
  choices?: Array<[string, string]>
}

const SEED: Array<SeedRoadmap> = [
  {
    name: 'Backend com .NET',
    goal: 'Voltar a construir APIs em C# com persistência no SQL Server e ambiente em Docker.',
    created: -34,
    modules: [
      {
        title: 'C#',
        description: 'Linguagem e biblioteca padrão.',
        topics: [
          {
            title: 'Collections',
            stage: 'completed',
            started: -30,
            completed: -27,
          },
          { title: 'LINQ', stage: 'completed', started: -26, completed: -22 },
          {
            title: 'Programação assíncrona',
            stage: 'studying',
            started: -5,
            due: 0,
            description: 'async/await, Task e cancelamento.',
          },
        ],
      },
      {
        title: 'SQL Server',
        description: 'Modelagem, consultas e desempenho.',
        after: ['C#'],
        topics: [
          {
            title: 'Modelagem',
            stage: 'completed',
            started: -21,
            completed: -18,
          },
          {
            title: 'Índices',
            stage: 'practicing',
            started: -13,
            due: -14,
            description: 'Clustered, nonclustered e plano de execução.',
          },
          {
            title: 'Transações no SQL Server',
            stage: 'studying',
            started: -10,
            due: 2,
          },
        ],
      },
      {
        title: 'Docker',
        description: 'Ambiente local com API e banco.',
        after: ['SQL Server'],
        topics: [
          {
            title: 'Imagens e containers',
            stage: 'completed',
            started: -19,
            completed: -16,
          },
          { title: 'Volumes', due: 5 },
          { title: 'Docker Compose' },
        ],
      },
    ],
  },
  {
    name: 'Frontend',
    goal: 'O básico da web até publicar uma aplicação, escolhendo entre React e Angular.',
    created: -90,
    modules: [
      {
        title: 'HTML e CSS',
        topics: [
          {
            title: 'Semântica',
            stage: 'completed',
            started: -88,
            completed: -85,
          },
          {
            title: 'Flexbox e Grid',
            stage: 'completed',
            started: -84,
            completed: -80,
          },
        ],
      },
      {
        title: 'JavaScript',
        after: ['HTML e CSS'],
        topics: [
          {
            title: 'Funções e escopo',
            stage: 'completed',
            started: -78,
            completed: -72,
          },
          { title: 'Promises', stage: 'studying', started: -40 },
          { title: 'Módulos', due: -3 },
        ],
      },
      {
        title: 'React',
        kind: 'alternative',
        after: ['JavaScript'],
        topics: [
          { title: 'Componentes' },
          { title: 'Hooks' },
          { title: 'Estado' },
        ],
      },
      {
        title: 'Angular',
        kind: 'alternative',
        after: ['JavaScript'],
        topics: [{ title: 'Componentes' }, { title: 'RxJS' }],
      },
      {
        title: 'Testes',
        kind: 'optional',
        after: ['React'],
        topics: [{ title: 'Testing Library', optional: true }],
      },
    ],
    choices: [['JavaScript', 'React']],
  },
  {
    name: 'Algoritmos',
    goal: 'Padrões de resolução para exercícios, praticando por conceito.',
    created: -60,
    modules: [
      {
        title: 'Arrays',
        topics: [
          {
            title: 'Two pointers',
            stage: 'completed',
            started: -50,
            completed: -44,
          },
          { title: 'Sliding window', stage: 'studying', started: -8, due: 1 },
        ],
      },
      {
        title: 'Grafos',
        after: ['Arrays'],
        topics: [{ title: 'BFS e DFS' }, { title: 'Caminho mínimo' }],
      },
    ],
  },
  {
    name: 'System Design',
    goal: 'Fundamentos e estudos de caso para projetar sistemas distribuídos.',
    archived: true,
    created: -200,
    modules: [
      {
        title: 'Fundamentos',
        topics: [
          {
            title: 'Escalabilidade',
            stage: 'completed',
            started: -190,
            completed: -180,
          },
        ],
      },
    ],
  },
]

/** Monta o banco com os dados de exemplo do protótipo. `empty` = usuário novo. */
export function createDb({ empty = false }: { empty?: boolean } = {}): Db {
  const db: Db = {
    loggedIn: false,
    user: {
      id: 'u-marina',
      name: 'Marina Costa',
      email: 'marina@exemplo.com',
      avatarUrl: null,
      timeZone: 'America/Sao_Paulo',
    },
    preferences: {
      studyDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
      includeOptional: false,
      homePage: 'dashboard',
      reminderEnabled: false,
      reminderTime: '20:00',
    },
    drive: {
      connected: false,
      accountEmail: null,
      rootFolderName: null,
      connectedAt: null,
    },
    pushSubscriptions: [],
    roadmaps: [],
    modules: [],
    dependencies: [],
    pathChoices: [],
    topics: [],
    schedule: [],
    sessions: [],
    changes: [],
    notes: [],
    resources: [],
    files: [],
    folders: [],
    seq: 100,
  }
  if (empty) return db

  const next = () => ++db.seq
  for (const r of SEED) {
    const roadmap: DbRoadmap = {
      id: next(),
      name: r.name,
      goal: r.goal,
      archivedAt: r.archived ? at(-30) : null,
      createdAt: at(r.created),
      updatedAt: at(-1),
    }
    db.roadmaps.push(roadmap)
    const byTitle = new Map<string, number>()
    r.modules.forEach((m, mi) => {
      const mod: DbModule = {
        id: next(),
        roadmapId: roadmap.id,
        title: m.title,
        description: m.description ?? null,
        kind: m.kind ?? 'required',
        position: mi,
        createdAt: roadmap.createdAt,
        updatedAt: roadmap.createdAt,
      }
      db.modules.push(mod)
      byTitle.set(m.title, mod.id)
      for (const a of m.after ?? []) {
        const dep = byTitle.get(a)
        if (dep)
          db.dependencies.push({ moduleId: mod.id, dependsOnModuleId: dep })
      }
      m.topics.forEach((t, ti) => {
        const topic: DbTopic = {
          id: next(),
          moduleId: mod.id,
          title: t.title,
          description: t.description ?? null,
          isOptional: t.optional ?? false,
          stage: t.stage ?? 'planned',
          position: ti,
          startedOn: t.started !== undefined ? day(t.started) : null,
          completedOn: t.completed !== undefined ? day(t.completed) : null,
          createdAt: roadmap.createdAt,
          updatedAt: roadmap.createdAt,
        }
        db.topics.push(topic)
        if (t.due !== undefined)
          db.schedule.push({
            id: next(),
            topicId: topic.id,
            date: day(t.due),
            source: 'manual',
          })
        if (t.started !== undefined) {
          db.sessions.push({
            id: next(),
            topicId: topic.id,
            day: day(t.started),
            studied: true,
            practiced: false,
            completed: false,
            note: null,
            stageBefore: 'planned',
            stageAfter: 'studying',
            createdAt: at(t.started),
          })
        }
        if (t.stage === 'practicing' && t.started !== undefined) {
          db.sessions.push({
            id: next(),
            topicId: topic.id,
            day: day(t.started + 4),
            studied: false,
            practiced: true,
            completed: false,
            note: 'Testei os índices com o plano de execução.',
            stageBefore: 'studying',
            stageAfter: 'practicing',
            createdAt: at(t.started + 4),
          })
        }
        if (t.completed !== undefined) {
          db.sessions.push({
            id: next(),
            topicId: topic.id,
            day: day(t.completed),
            studied: false,
            practiced: true,
            completed: true,
            note: null,
            stageBefore: 'studying',
            stageAfter: 'completed',
            createdAt: at(t.completed),
          })
        }
      })
    })
    for (const [branch, chosen] of r.choices ?? []) {
      const b = byTitle.get(branch)
      const c = byTitle.get(chosen)
      if (b && c)
        db.pathChoices.push({
          roadmapId: roadmap.id,
          branchModuleId: b,
          chosenModuleId: c,
        })
    }
    db.changes.push({
      id: next(),
      roadmapId: roadmap.id,
      moduleId: null,
      topicId: null,
      type: 'created',
      description: `Roadmap “${r.name}” criado`,
      payload: null,
      occurredAt: roadmap.createdAt,
    })
  }

  // Sessões extras de estudo nos últimos meses (mapa de calor e sequência).
  const rand = rng(42)
  const studyTopics = db.topics.filter((t) => t.stage !== 'planned')
  for (let offset = -160; offset <= -1; offset++) {
    const d = new Date()
    d.setDate(d.getDate() + offset)
    const weekday = d.getDay()
    const recent = offset >= -9
    const chance = weekday === 0 || weekday === 6 ? 0.08 : recent ? 1 : 0.55
    if (rand() > chance) continue
    const n = 1 + Math.floor(rand() * (recent ? 2 : 3))
    for (let i = 0; i < n; i++) {
      const topic = studyTopics[Math.floor(rand() * studyTopics.length)]
      if (!topic) continue
      db.sessions.push({
        id: next(),
        topicId: topic.id,
        day: day(offset),
        studied: true,
        practiced: rand() > 0.6,
        completed: false,
        note: null,
        stageBefore: topic.stage,
        stageAfter: topic.stage,
        createdAt: at(offset, 18 + i),
      })
    }
  }

  // Conteúdo de exemplo do tópico Índices.
  const indices = db.topics.find((t) => t.title === 'Índices')
  if (indices) {
    db.notes.push({
      id: next(),
      topicId: indices.id,
      moduleId: null,
      content:
        '## Índices\n\nClustered define a ordem física; cada tabela tem no máximo um.\n\n```sql\nCREATE INDEX IX_Topics_ModuleId ON Topics (ModuleId);\n```',
      createdAt: at(-12),
      editedAt: null,
      version: 1,
    })
    db.resources.push({
      id: next(),
      topicId: indices.id,
      title: 'Documentação de índices',
      url: 'https://learn.microsoft.com/sql/relational-databases/indexes/indexes',
      kind: 'article',
      createdAt: at(-12),
    })
    db.files.push({
      id: next(),
      topicId: indices.id,
      path: 'scripts/indices.sql',
      mimeType: 'text/plain',
      sizeBytes: 240,
      content: 'CREATE INDEX IX_Topics_ModuleId ON Topics (ModuleId);\n',
      updatedAt: at(-11),
    })
  }
  const sqlModule = db.modules.find((m) => m.title === 'SQL Server')
  if (sqlModule) {
    db.notes.push({
      id: next(),
      topicId: null,
      moduleId: sqlModule.id,
      content:
        'Objetivo do módulo: conseguir modelar o banco do projeto e explicar cada índice.',
      createdAt: at(-20),
      editedAt: null,
      version: 1,
    })
  }
  return db
}
