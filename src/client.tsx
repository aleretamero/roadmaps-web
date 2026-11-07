import { StrictMode, startTransition } from 'react'
import { hydrateRoot } from 'react-dom/client'
import { StartClient } from '@tanstack/react-start/client'

async function enableMocking() {
  if (import.meta.env.VITE_API_MOCK !== 'true') return
  const { startMockWorker } = await import('./mocks/browser')
  await startMockWorker()
}

// O mock precisa estar de pé antes da hidratação, senão as primeiras consultas vão para a rede.
void enableMocking().then(() => {
  startTransition(() => {
    hydrateRoot(
      document,
      <StrictMode>
        <StartClient />
      </StrictMode>,
    )
  })
})
