/**
 * Fábricas para listas grandes (stories de rolagem, testes de desempenho).
 * Semente fixa: o mesmo número gera sempre os mesmos dados.
 */
import { fakerPT_BR as faker } from '@faker-js/faker'
import type { Db } from './db'
import { day } from './db'
import { STAGES } from '@/lib/stage'

/** Acrescenta `count` roadmaps com módulos e tópicos aleatórios (mas determinísticos) ao banco. */
export function addRandomRoadmaps(db: Db, count: number, seed = 7) {
  faker.seed(seed)
  for (let r = 0; r < count; r++) {
    const roadmap = {
      id: ++db.seq,
      name: faker.commerce.department() + ' ' + (r + 1),
      goal: faker.lorem.sentence(),
      archivedAt: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    db.roadmaps.push(roadmap)
    const modules = faker.number.int({ min: 2, max: 5 })
    for (let m = 0; m < modules; m++) {
      const mod = {
        id: ++db.seq,
        roadmapId: roadmap.id,
        title: faker.word.words({ count: { min: 1, max: 3 } }),
        description: null,
        kind: 'required' as const,
        position: m,
        createdAt: roadmap.createdAt,
        updatedAt: roadmap.createdAt,
      }
      db.modules.push(mod)
      const topics = faker.number.int({ min: 2, max: 8 })
      for (let t = 0; t < topics; t++) {
        const stage = faker.helpers.arrayElement(STAGES)
        db.topics.push({
          id: ++db.seq,
          moduleId: mod.id,
          title: faker.word.words({ count: { min: 1, max: 4 } }),
          description: null,
          isOptional: faker.datatype.boolean(0.15),
          stage,
          position: t,
          startedOn:
            stage === 'planned'
              ? null
              : day(-faker.number.int({ min: 1, max: 60 })),
          completedOn:
            stage === 'completed'
              ? day(-faker.number.int({ min: 0, max: 5 }))
              : null,
          createdAt: roadmap.createdAt,
          updatedAt: roadmap.createdAt,
        })
      }
    }
  }
  return db
}
