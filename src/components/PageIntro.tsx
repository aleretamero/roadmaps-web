/** Título e subtítulo do topo das páginas (Bom dia, Meus roadmaps, Agenda…). */
export function PageIntro({
  title,
  description,
  children,
}: {
  title: string
  description?: React.ReactNode
  children?: React.ReactNode
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        <h1 className="text-[32px] leading-tight font-semibold tracking-tight text-ink-strong">
          {title}
        </h1>
        {description && <p className="mt-1 text-ink-muted">{description}</p>}
      </div>
      {children}
    </div>
  )
}

/** Largura e respiro padrão do conteúdo das telas logadas. */
export function PageContainer({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-[1264px] px-4 py-8 sm:px-8 sm:py-10">
      {children}
    </div>
  )
}
