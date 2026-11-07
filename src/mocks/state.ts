/**
 * Estado do mock: o banco em memória, o cenário escolhido e a persistência opcional.
 */
import { createDb } from './db'
import { addDays, isLate, isStalled, today } from './domain'
import type { Db } from './db'

export const SCENARIOS = [
  'padrao',
  'vazio',
  'deslogado',
  'sem-drive',
  'com-drive',
  'erro-500',
  'lento',
  'sem-agenda-hoje',
  'em-dia',
] as const
export type Scenario = (typeof SCENARIOS)[number]

const STORAGE_DB = 'roadmaps-mock-db'
const STORAGE_PERSIST = 'roadmaps-mock-persist'
const STORAGE_SCENARIO = 'roadmaps-mock-scenario'

let scenario: Scenario = 'padrao'
let db: Db = build('padrao')

function build(s: Scenario): Db {
  const fresh = createDb({ empty: s === 'vazio' })
  fresh.loggedIn = s !== 'deslogado'
  if (s === 'com-drive') {
    fresh.drive = {
      connected: true,
      accountEmail: fresh.user.email,
      rootFolderName: 'Roadmaps',
      connectedAt: new Date().toISOString(),
    }
  }
  if (s === 'sem-agenda-hoje') {
    // Dia sem tópico: nada agendado para hoje.
    const t = today()
    fresh.schedule = fresh.schedule.filter((e) => e.date !== t)
  }
  if (s === 'em-dia') {
    // Tudo em dia: sem datas perdidas nem tópicos parados.
    const t = today()
    const late = new Set(
      fresh.topics.filter((tp) => isLate(fresh, tp)).map((tp) => tp.id),
    )
    fresh.schedule = fresh.schedule.filter(
      (e) => !(late.has(e.topicId) && e.date < t),
    )
    for (const tp of fresh.topics.filter((x) => isStalled(fresh, x)))
      fresh.schedule.push({
        id: ++fresh.seq,
        topicId: tp.id,
        date: addDays(t, 2),
        source: 'manual',
      })
  }
  return fresh
}

const storage = (): Storage | null => {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage
  } catch {
    return null
  }
}

export const getDb = () => db
export const getScenario = () => scenario

/** Troca o cenário e recria o banco (testes, Storybook, `?mock=` na URL). */
export function setScenario(s: Scenario) {
  scenario = s
  db = build(s)
  try {
    sessionStorage.setItem(STORAGE_SCENARIO, s)
  } catch {
    /* fora do navegador */
  }
}

/** Volta ao banco inicial do cenário atual. */
export function resetDb() {
  db = build(scenario)
  storage()?.removeItem(STORAGE_DB)
}

/** Persistência em localStorage, para testar recarregando a página. Ligue com `?mock-persist=1`. */
export function persistEnabled(): boolean {
  return storage()?.getItem(STORAGE_PERSIST) === '1'
}

export function persist() {
  if (persistEnabled()) storage()?.setItem(STORAGE_DB, JSON.stringify(db))
}

/** Lê cenário e persistência da URL/armazenamento ao iniciar no navegador. */
export function initFromBrowser() {
  const params = new URLSearchParams(window.location.search)
  const fromUrl = params.get('mock') as Scenario | null
  let fromSession: Scenario | null = null
  try {
    fromSession = sessionStorage.getItem(STORAGE_SCENARIO) as Scenario | null
  } catch {
    /* ignore */
  }
  const chosen = [fromUrl, fromSession].find(
    (s): s is Scenario =>
      !!s && (SCENARIOS as ReadonlyArray<string>).includes(s),
  )
  if (chosen) setScenario(chosen)
  const persistParam = params.get('mock-persist')
  if (persistParam === '1') storage()?.setItem(STORAGE_PERSIST, '1')
  if (persistParam === '0') storage()?.removeItem(STORAGE_PERSIST)
  if (persistEnabled()) {
    const saved = storage()?.getItem(STORAGE_DB)
    if (saved) db = JSON.parse(saved) as Db
  }
}
