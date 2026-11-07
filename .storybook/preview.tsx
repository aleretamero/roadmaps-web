import type { Preview } from '@storybook/react-vite'
import { setupWorker } from 'msw/browser'
import { mswLoader } from 'msw-storybook-addon/csf3'
import { QueryClientProvider } from '@tanstack/react-query'
import { handlers, setScenario, SCENARIOS } from '../src/mocks'
import type { Scenario } from '../src/mocks'
import { createQueryClient } from '../src/lib/api/query-client'
import { AppProviders } from '../src/components/AppProviders'
import '../src/styles/app.css'

const preview: Preview = {
  // API mockada nas stories: mesmos handlers do dev e dos testes.
  loaders: [
    mswLoader(async () => {
      const worker = setupWorker(...handlers)
      await worker.start({ onUnhandledFrame: 'bypass', quiet: true })
      return worker
    }),
  ],
  globalTypes: {
    scenario: {
      description: 'Cenário da API mockada',
      toolbar: {
        title: 'Cenário',
        icon: 'database',
        items: [...SCENARIOS],
        dynamicTitle: true,
      },
    },
  },
  parameters: {
    layout: 'padded',
    backgrounds: {
      options: {
        canvas: { name: 'Fundo do app', value: 'var(--color-canvas)' },
        surface: { name: 'Card', value: 'var(--color-surface)' },
      },
    },
    viewport: {
      options: {
        mobile: {
          name: 'Celular (390)',
          styles: { width: '390px', height: '844px' },
        },
        desktop: {
          name: 'Desktop (1440)',
          styles: { width: '1440px', height: '900px' },
        },
      },
    },
    controls: {
      matchers: { color: /(background|color)$/i, date: /Date$/i },
    },
    // 'error' faz o teste da story falhar quando o axe encontra violação.
    a11y: { test: 'error' },
  },
  initialGlobals: { backgrounds: { value: 'canvas' }, scenario: 'padrao' },
  decorators: [
    (Story, { globals, parameters }) => {
      // Cada story começa com o banco do mock limpo, no cenário escolhido.
      setScenario(
        (parameters.scenario ?? globals.scenario ?? 'padrao') as Scenario,
      )
      return (
        <QueryClientProvider client={createQueryClient()}>
          <AppProviders>
            <Story />
          </AppProviders>
        </QueryClientProvider>
      )
    },
  ],
}

export default preview
