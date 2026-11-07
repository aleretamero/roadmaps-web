import type { Page } from '@playwright/test'

/** Página pública inicial. Cresce na FU01 (landing completa). */
export class LandingPage {
  constructor(private readonly page: Page) {}

  readonly heading = () => this.page.getByRole('heading', { level: 1 })
}
