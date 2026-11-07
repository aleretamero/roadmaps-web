/** Roadmaps pequenos para testes e stories do mapa (sem depender do mock). */
import type { Schemas } from '@/lib/api/client'

type M = Schemas['ModuleNode']
type T = Schemas['TopicSummary']

let id = 1000
const topic = (
  title: string,
  stage: T['stage'] = 'planned',
  isOptional = false,
): T => ({
  id: ++id,
  title,
  isOptional,
  stage,
  position: 0,
  startedOn: null,
  completedOn: null,
  dueDate: null,
  isLate: false,
  filesCount: 0,
})
const mod = (
  title: string,
  over: Partial<M> = {},
  topics: Array<T> = [],
): M => ({
  id: ++id,
  title,
  description: null,
  kind: 'required',
  position: 0,
  dependsOn: [],
  startedOn: null,
  status: 'notStarted',
  progress: { completed: 0, total: topics.length, percent: 0 },
  topics,
  ...over,
})

function roadmap(
  name: string,
  modules: Array<M>,
  pathChoices: Schemas['PathChoice'][] = [],
): Schemas['RoadmapDetail'] {
  modules.forEach((m, i) => (m.position = i))
  return {
    id: ++id,
    name,
    goal: 'Exemplo para o mapa.',
    archivedAt: null,
    startedOn: '2026-10-01',
    progress: { completed: 1, total: 4, percent: 25 },
    modules,
    pathChoices,
    createdAt: '2026-10-01T00:00:00Z',
    updatedAt: '2026-10-01T00:00:00Z',
  }
}

export function linearRoadmap() {
  const a = mod('Gramática', { status: 'inProgress' }, [
    topic('Verbos', 'completed'),
    topic('Tempos', 'studying'),
  ])
  const b = mod('Conversação', { dependsOn: [a.id] }, [
    topic('Diálogos'),
    topic('Pronúncia', 'planned', true),
  ])
  return roadmap('Inglês', [a, b])
}

export function splitRoadmap(chosen: 'first' | 'none' = 'first') {
  const base = mod('JavaScript', { status: 'inProgress' }, [
    topic('Promises', 'practicing'),
  ])
  const react = mod('React', { kind: 'alternative', dependsOn: [base.id] }, [
    topic('Hooks'),
  ])
  const angular = mod(
    'Angular',
    { kind: 'alternative', dependsOn: [base.id] },
    [topic('RxJS')],
  )
  const tests = mod('Testes', { dependsOn: [react.id, angular.id] }, [
    topic('Unitários'),
  ])
  return roadmap(
    'Frontend',
    [base, react, angular, tests],
    chosen === 'first'
      ? [{ branchModuleId: base.id, chosenModuleId: react.id }]
      : [],
  )
}

export function optionalRoadmap() {
  const a = mod('Fundamentos', { status: 'completed' }, [
    topic('IAM', 'completed'),
  ])
  const opt = mod('Certificação', { kind: 'optional', dependsOn: [a.id] }, [
    topic('Simulado', 'planned', true),
  ])
  const b = mod('Mensageria', { dependsOn: [a.id] }, [topic('SQS')])
  return roadmap('AWS', [a, opt, b])
}
