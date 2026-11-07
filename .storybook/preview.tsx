import type { Preview } from '@storybook/react-vite'
import { AppProviders } from '../src/components/AppProviders'
import '../src/styles/app.css'

const preview: Preview = {
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
  initialGlobals: { backgrounds: { value: 'canvas' } },
  decorators: [
    (Story) => (
      <AppProviders>
        <Story />
      </AppProviders>
    ),
  ],
}

export default preview
