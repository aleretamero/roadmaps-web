import type { Page } from '@playwright/test'

export class LoginPage {
  constructor(private readonly page: Page) {}
  readonly heading = () =>
    this.page.getByRole('heading', { name: 'Entre na sua conta' })
  readonly github = () =>
    this.page.getByRole('button', { name: 'Continuar com GitHub' })
  readonly error = () => this.page.getByRole('alert')
}
