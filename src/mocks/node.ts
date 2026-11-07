import { setupServer } from 'msw/node'
import { handlers } from './handlers'

/** Servidor MSW para testes em Node (Vitest). */
export const server = setupServer(...handlers)
