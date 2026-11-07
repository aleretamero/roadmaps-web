import { useNavigate } from '@tanstack/react-router'
import { Bell, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { onMockNotification } from '@/lib/push'
import type { MockNotification } from '@/lib/push'

/** Cartão de notificação (o mesmo da prévia nas Configurações). */
export function NotificationCard({
  title,
  body,
  when,
  onLog,
  onLater,
  onClose,
}: {
  title: string
  body: string
  when: string
  onLog?: () => void
  onLater?: () => void
  onClose?: () => void
}) {
  return (
    <div className="flex w-full max-w-[360px] flex-col gap-1.5 rounded-2xl border border-line bg-surface p-3.5 shadow-menu">
      <div className="flex items-center gap-2 text-[11px] font-semibold tracking-[0.06em] text-ink-muted uppercase">
        <Bell className="size-3.5" aria-hidden="true" />
        Roadmaps
        <span className="ml-auto font-normal tracking-normal normal-case">
          {when}
        </span>
        {onClose && (
          <button
            type="button"
            aria-label="Fechar notificação"
            onClick={onClose}
            className="grid size-6 place-items-center rounded-md hover:bg-surface-sunken"
          >
            <X className="size-3.5" aria-hidden="true" />
          </button>
        )}
      </div>
      <strong className="text-[15px]">{title}</strong>
      <span className="text-sm text-ink-strong">{body}</span>
      <div className="mt-1 flex gap-2">
        {onLog ? (
          <Button size="sm" onClick={onLog}>
            Registrar
          </Button>
        ) : (
          <span className="rounded-md bg-surface-sunken px-2.5 py-1 text-xs font-medium">
            Registrar
          </span>
        )}
        {onLater ? (
          <Button size="sm" variant="outline" onClick={onLater}>
            Amanhã
          </Button>
        ) : (
          <span className="rounded-md bg-surface-sunken px-2.5 py-1 text-xs font-medium">
            Amanhã
          </span>
        )}
      </div>
    </div>
  )
}

/** Com a API mockada, as notificações de teste aparecem aqui (canto da tela), com as mesmas ações. */
export function MockNotifications() {
  const [current, setCurrent] = useState<MockNotification | null>(null)
  const navigate = useNavigate()
  useEffect(() => onMockNotification(setCurrent), [])
  if (!current) return null
  return (
    <div
      role="alert"
      aria-label="Notificação (simulada)"
      className="fixed right-4 bottom-4 z-[60] w-[calc(100%-2rem)] max-w-[360px]"
    >
      <NotificationCard
        title={current.title}
        body={current.body}
        when="agora"
        onClose={() => setCurrent(null)}
        onLater={() => {
          setCurrent(null)
          toast.success('Tudo bem, amanhã eu lembro de novo.')
        }}
        onLog={() => {
          setCurrent(null)
          if (current.topicId)
            void navigate({
              to: '/topics/$topicId',
              params: { topicId: String(current.topicId) },
              search: { log: 1 },
            })
          else void navigate({ to: '/dashboard' })
        }}
      />
    </div>
  )
}
