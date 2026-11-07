import { TooltipProvider } from '@/components/ui/tooltip'

/** Provedores globais do app (também usados nos testes e no Storybook). */
export function AppProviders({ children }: { children: React.ReactNode }) {
  return <TooltipProvider delayDuration={300}>{children}</TooltipProvider>
}
