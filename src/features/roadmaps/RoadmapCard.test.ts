import { describe, expect, it } from 'vitest'
import type { Schemas } from '@/lib/api/client'
import { roadmapState } from './RoadmapCard'

const base = {
  archivedAt: null,
  startedOn: '2026-10-01',
  progress: { completed: 2, total: 5, percent: 40 },
} as Schemas['RoadmapSummary']

describe('roadmapState', () => {
  it('arquivado, concluído, não iniciado ou em andamento', () => {
    expect(roadmapState({ ...base, archivedAt: '2026-11-01T00:00:00Z' })).toBe(
      'archived',
    )
    expect(
      roadmapState({
        ...base,
        progress: { completed: 5, total: 5, percent: 100 },
      }),
    ).toBe('completed')
    expect(roadmapState({ ...base, startedOn: null })).toBe('notStarted')
    expect(roadmapState(base)).toBe('inProgress')
  })
})
