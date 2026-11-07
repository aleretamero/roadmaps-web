import { render } from '@testing-library/react'
import type { RenderOptions } from '@testing-library/react'
import { AppProviders } from '@/components/AppProviders'

/** `render` do Testing Library com os provedores globais do app. */
export function renderWithProviders(
  ui: React.ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>,
) {
  return render(ui, { wrapper: AppProviders, ...options })
}
