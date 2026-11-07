import { setupWorker } from 'msw/browser'
import { handlers } from './handlers'
import { initFromBrowser, persist } from './state'

export const worker = setupWorker(...handlers)

/** Liga o mock no navegador (dev com VITE_API_MOCK=true). */
export async function startMockWorker() {
  initFromBrowser()
  worker.events.on('response:mocked', ({ request }) => {
    if (request.method !== 'GET') persist()
  })
  await worker.start({
    onUnhandledFrame: 'bypass',
    quiet: true,
    serviceWorker: { url: '/mockServiceWorker.js' },
  })
}
