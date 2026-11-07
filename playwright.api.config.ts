import { defineConfig, devices } from '@playwright/test'

const PORT = Number(process.env.E2E_PORT ?? 3200)

/**
 * E2E contra a API real (FU24): o app em dev com `VITE_API_MOCK=false` e o
 * proxy de `/api` apontando para o backend (`API_PROXY_TARGET`).
 * No CI roda num job separado, com o Docker Compose do roadmaps-api.
 */
export default defineConfig({
  testDir: 'e2e-api',
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI
    ? [
        ['github'],
        ['html', { open: 'never', outputFolder: 'playwright-report-api' }],
      ]
    : [['list']],
  use: {
    baseURL: process.env.E2E_BASE_URL ?? `http://localhost:${PORT}`,
    locale: 'pt-BR',
    timezoneId: 'America/Sao_Paulo',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'desktop',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1440, height: 900 },
      },
    },
  ],
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : {
        command: `pnpm exec vite dev --port ${PORT} --strictPort`,
        url: `http://localhost:${PORT}`,
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
        env: {
          VITE_API_MOCK: 'false',
          API_PROXY_TARGET:
            process.env.API_PROXY_TARGET ?? 'http://localhost:8080',
        },
      },
})
