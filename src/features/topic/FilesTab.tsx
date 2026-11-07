import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { HardDrive } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { integrationsQuery } from '@/lib/api/queries'

/** Aviso da aba Arquivos quando o Google Drive não está conectado. */
export function DriveNotice({ topicId }: { topicId: number }) {
  return (
    <section
      aria-labelledby="drive-notice"
      className="flex flex-col items-center gap-3 rounded-2xl border border-line bg-surface px-6 py-10 text-center"
    >
      <span
        aria-hidden="true"
        className="grid size-12 place-items-center rounded-xl bg-stage-studying text-stage-studying-fg"
      >
        <HardDrive className="size-5" />
      </span>
      <h2 id="drive-notice" className="text-xl font-semibold">
        Conecte o Google Drive para guardar arquivos
      </h2>
      <p className="max-w-[560px] text-ink-muted">
        Os arquivos dos tópicos ficam numa pasta sua no Google Drive,
        organizados por roadmap, módulo e tópico. Enquanto o Drive não estiver
        conectado, não dá para enviar arquivos nem criar pastas.
      </p>
      <Link
        to="/settings/$section"
        params={{ section: 'integrations' }}
        search={{ returnTo: `/topics/${topicId}?tab=files` }}
        className="inline-flex h-11 items-center gap-2 rounded-[10px] bg-ink px-4 font-medium text-surface hover:opacity-90"
      >
        <HardDrive className="size-4" aria-hidden="true" />
        Conectar Google Drive
      </Link>
      <p className="text-xs text-ink-muted">
        Abre Configurações › Integrações. Depois você volta para este tópico.
      </p>
    </section>
  )
}

/** Aba Arquivos: sem Drive, o aviso; com Drive, o gerenciador de arquivos (FU20). */
export function FilesTab({
  topicId,
  children,
}: {
  topicId: number
  children?: React.ReactNode
}) {
  const q = useQuery(integrationsQuery())
  if (q.isPending)
    return (
      <div role="status" aria-label="Carregando arquivos">
        <Skeleton className="h-40 w-full" />
      </div>
    )
  const drive = q.data?.find((i) => i.provider === 'googleDrive')
  if (!drive?.connected) return <DriveNotice topicId={topicId} />
  return <>{children}</>
}
