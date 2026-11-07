import type { Page } from '@playwright/test'

/** Cabeçalho e navegação das telas logadas. */
export class AppShell {
  constructor(readonly page: Page) {}
  nav() {
    return this.page.getByRole('navigation', { name: 'Principal' })
  }
  navLink(name: 'Painel' | 'Meus roadmaps' | 'Agenda') {
    return this.nav().getByRole('link', { name, exact: true })
  }
  accountButton() {
    return this.page.getByRole('button', { name: /^Conta de / })
  }
  async openAccountMenu() {
    await this.accountButton().click()
    return this.page.getByRole('menu')
  }
}
