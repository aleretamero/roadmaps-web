import { BellRing, Send } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { NotificationCard } from '@/components/MockNotifications'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { errorMessage } from '@/lib/api/errors'
import { reminderText } from '@/lib/push'
import type { EnableResult } from '@/lib/push'

export type ReminderRowProps = {
  enabled: boolean
  time: string
  /** Título do tópico do dia, para a prévia ("O tópico do dia é …"). */
  topicTitle: string | null
  permission: NotificationPermission | 'unsupported'
  busy?: boolean
  /** Pede permissão, assina e salva `reminderEnabled: true`. */
  onEnable: () => Promise<EnableResult>
  onDisable: () => Promise<void>
  onTimeChange: (time: string) => void
  onTest: () => Promise<void>
}

/** Lembrete diário: interruptor (com explicação antes de pedir permissão), horário, prévia e teste. */
export function ReminderRow({
  enabled,
  time,
  topicTitle,
  permission,
  busy = false,
  onEnable,
  onDisable,
  onTimeChange,
  onTest,
}: ReminderRowProps) {
  const [explain, setExplain] = useState(false)
  const [denied, setDenied] = useState(permission === 'denied')
  const [testing, setTesting] = useState(false)
  const [draft, setDraft] = useState(time)
  const preview = reminderText(topicTitle)
  const unsupported = permission === 'unsupported'
  return (
    <div className="flex flex-col gap-3 border-t border-line-soft py-4">
      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
        <div className="flex min-w-0 flex-[1_1_260px] flex-col gap-0.5">
          <label htmlFor="set-reminder" className="font-medium">
            Lembrete diário
          </label>
          <span className="text-[13px] text-ink-muted">
            Uma notificação no horário escolhido, só nos dias de estudo em que
            nada foi registrado.
          </span>
        </div>
        <Switch
          id="set-reminder"
          checked={enabled}
          disabled={busy || unsupported}
          onCheckedChange={(on) => {
            if (on) setExplain(true)
            else
              void onDisable()
                .then(() => toast.success('Lembrete desligado'))
                .catch((e: unknown) => toast.error(errorMessage(e)))
          }}
        />
      </div>
      {unsupported && (
        <p className="rounded-lg bg-surface-sunken px-3 py-2 text-sm text-ink-strong">
          Este navegador não recebe notificações. Abra o app num navegador atual
          para ligar o lembrete.
        </p>
      )}
      {denied && !enabled && (
        <p
          role="alert"
          className="rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger"
        >
          As notificações estão bloqueadas para este site. Libere nas
          configurações do navegador (ícone ao lado do endereço) e tente de
          novo.
        </p>
      )}
      {enabled && (
        <div className="flex flex-wrap items-start gap-5">
          <div className="flex flex-[1_1_240px] flex-col gap-3">
            <label
              htmlFor="set-reminder-time"
              className="flex items-center gap-3 text-sm font-medium"
            >
              Horário
              <Input
                id="set-reminder-time"
                type="time"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onBlur={() => draft && draft !== time && onTimeChange(draft)}
                className="h-9 w-[120px]"
              />
            </label>
            <span className="text-[13px] text-ink-muted">
              As notificações chegam mesmo com a aba fechada. Para parar,
              desligue aqui.
            </span>
            <Button
              variant="outline"
              size="sm"
              className="self-start"
              disabled={testing}
              onClick={() => {
                setTesting(true)
                onTest()
                  .then(() => toast.success('Notificação de teste enviada'))
                  .catch((e: unknown) => toast.error(errorMessage(e)))
                  .finally(() => setTesting(false))
              }}
            >
              <Send aria-hidden="true" />
              {testing ? 'Enviando…' : 'Enviar notificação de teste'}
            </Button>
          </div>
          <figure className="flex flex-[1_1_280px] flex-col gap-1.5">
            <figcaption className="text-xs text-ink-muted">Prévia</figcaption>
            <NotificationCard
              title={preview.title}
              body={preview.body}
              when={time}
            />
          </figure>
        </div>
      )}
      <AlertDialog open={explain} onOpenChange={setExplain}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <BellRing className="size-5" aria-hidden="true" />
              Permitir notificações?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Para lembrar você no horário escolhido, o navegador vai pedir
              permissão para mostrar notificações. Elas só chegam nos dias de
              estudo em que nada foi registrado, e você pode desligar quando
              quiser.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Agora não</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setExplain(false)
                onEnable()
                  .then((r) => {
                    setDenied(r === 'denied')
                    if (r === 'enabled') toast.success('Lembrete ligado')
                  })
                  .catch((e: unknown) => toast.error(errorMessage(e)))
              }}
            >
              Continuar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
