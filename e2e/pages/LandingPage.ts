import type { Page } from '@playwright/test'

/** Página pública inicial. */
export class LandingPage {
  constructor(private readonly page: Page) {}

  readonly heading = () => this.page.getByRole('heading', { level: 1 })
  readonly anchors = () =>
    this.page.getByRole('navigation', { name: 'Página inicial' })
  readonly faqQuestion = (q: string) =>
    this.page.getByRole('button', { name: q })
  readonly enterButtons = () => this.page.getByRole('link', { name: /^Entrar/ })
}
