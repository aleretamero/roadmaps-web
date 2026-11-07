import { cn } from '@/lib/utils'

/** Marca do produto: três pontos ligados (o caminho de um roadmap). */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 26 26"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      aria-hidden="true"
      className={cn('size-[26px]', className)}
    >
      <circle cx="5" cy="6" r="2.6" />
      <circle cx="13" cy="13" r="2.6" />
      <circle cx="21" cy="20" r="2.6" />
      <path d="M7.2 7.6l3.6 3.6M15.2 14.6l3.6 3.6" />
    </svg>
  )
}
