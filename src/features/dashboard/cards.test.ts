import { describe, expect, it } from 'vitest'
import type { Schemas } from '@/lib/api/client'
import { attentionReason, roadmapLine } from './cards'
import { greeting } from './DashboardPage'

const ref = {
  id: 1,
  title: 'Índices',
  moduleId: 2,
  moduleTitle: 'SQL Server',
  roadmapId: 3,
  roadmapName: 'Backend com .NET',
}
const topic = (
  over: Partial<Schemas['DashboardTopic']>,
): Schemas['DashboardTopic'] => ({
  topic: ref,
  stage: 'studying',
  isLate: false,
  dueDate: null,
  lastSessionOn: null,
  todayActions: [],
  attentionReason: null,
  ...over,
})

describe('painel', () => {
  it('saudação pela hora', () => {
    expect(greeting(9)).toBe('Bom dia')
    expect(greeting(13)).toBe('Boa tarde')
    expect(greeting(21)).toBe('Boa noite')
  })

  it('motivo de atenção', () => {
    const today = '2026-11-07'
    expect(
      attentionReason(
        topic({ attentionReason: 'stalled', lastSessionOn: '2026-10-30' }),
        today,
      ),
    ).toBe('Sem sessão há 8 dias')
    expect(
      attentionReason(
        topic({ attentionReason: 'late', dueDate: '2026-11-04' }),
        today,
      ),
    ).toBe('Estava agendado para 4 de nov e não começou')
  })

  it('linha do roadmap', () => {
    const base: Schemas['RoadmapSummary'] = {
      id: 1,
      name: 'Backend',
      goal: null,
      archivedAt: null,
      progress: { completed: 4, total: 9, percent: 44 },
      nextTopic: ref,
      modulesCount: 3,
      topicsCount: 9,
      startedOn: '2026-10-01',
      updatedAt: '2026-11-01T00:00:00Z',
      stageCounts: { planned: 2, studying: 2, practicing: 1, completed: 4 },
      currentModules: ['C#', 'SQL Server'],
      nextTopicDate: '2026-11-07',
    }
    expect(roadmapLine(base, '2026-11-07')).toBe(
      'Agora: C#, SQL Server · próximo: Índices hoje',
    )
    expect(roadmapLine({ ...base, startedOn: null }, '2026-11-07')).toBe(
      'Não iniciado',
    )
    expect(
      roadmapLine(
        { ...base, currentModules: [], nextTopicDate: null },
        '2026-11-07',
      ),
    ).toBe('Nenhum módulo em andamento')
  })
})
