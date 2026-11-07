import { api, unwrap } from '@/lib/api/client'

const SUB_KEY = 'roadmaps-push-subscription'
const isMock = () => import.meta.env.VITE_API_MOCK === 'true'

/** O navegador sabe notificar? (No mock, basta a API de Notification.) */
export function pushSupported(): boolean {
  if (typeof window === 'undefined' || !('Notification' in window)) return false
  return isMock() || ('serviceWorker' in navigator && 'PushManager' in window)
}

export function notificationPermission():
  NotificationPermission | 'unsupported' {
  return pushSupported() ? Notification.permission : 'unsupported'
}

/** Chave VAPID (base64url) no formato que o `pushManager.subscribe` aceita. */
export function urlBase64ToUint8Array(base64: string): Uint8Array<ArrayBuffer> {
  const padded = (base64 + '='.repeat((4 - (base64.length % 4)) % 4))
    .replace(/-/g, '+')
    .replace(/_/g, '/')
  const raw = atob(padded)
  const out = new Uint8Array(new ArrayBuffer(raw.length))
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i)
  return out
}

function savedId(): number | null {
  try {
    const v = localStorage.getItem(SUB_KEY)
    return v ? Number(v) : null
  } catch {
    return null
  }
}

function saveId(id: number | null) {
  try {
    if (id === null) localStorage.removeItem(SUB_KEY)
    else localStorage.setItem(SUB_KEY, String(id))
  } catch {
    /* sem storage: a assinatura continua na API */
  }
}

/** Assinatura do navegador. No mock, uma assinatura de mentira (o MSW ocupa o service worker). */
async function browserSubscription(): Promise<PushSubscriptionJSON> {
  if (isMock())
    return {
      endpoint: `https://push.example.com/mock/${crypto.randomUUID()}`,
      keys: { p256dh: 'mock-p256dh', auth: 'mock-auth' },
    }
  const { publicKey } = await unwrap(api.GET('/notifications/public-key'))
  const reg = await navigator.serviceWorker.register('/sw-push.js')
  await navigator.serviceWorker.ready
  const existing = await reg.pushManager.getSubscription()
  const sub =
    existing ??
    (await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey),
    }))
  return sub.toJSON()
}

export type EnableResult = 'enabled' | 'denied' | 'unsupported'

/** Pede permissão (só depois da explicação na tela) e assina as notificações. */
export async function enablePush(): Promise<EnableResult> {
  if (!pushSupported()) return 'unsupported'
  const permission =
    Notification.permission === 'granted'
      ? 'granted'
      : await Notification.requestPermission()
  if (permission !== 'granted') return 'denied'
  const json = await browserSubscription()
  const created = await unwrap(
    api.POST('/notifications/subscriptions', {
      body: {
        endpoint: json.endpoint ?? '',
        keys: { p256dh: json.keys?.p256dh ?? '', auth: json.keys?.auth ?? '' },
        userAgent: navigator.userAgent,
      },
    }),
  )
  saveId(created.id)
  return 'enabled'
}

/** Cancela a assinatura no navegador e na API. */
export async function disablePush(): Promise<void> {
  const id = savedId()
  if (!isMock() && 'serviceWorker' in navigator) {
    const reg = await navigator.serviceWorker.getRegistration('/sw-push.js')
    await (await reg?.pushManager.getSubscription())?.unsubscribe()
  }
  if (id !== null)
    await unwrap(
      api.DELETE('/notifications/subscriptions/{id}', {
        params: { path: { id } },
      }),
    )
  saveId(null)
}

export type MockNotification = {
  title: string
  body: string
  topicId: number | null
}
type Listener = (n: MockNotification) => void
const listeners = new Set<Listener>()

/** No mock não há push de verdade: a notificação aparece na própria tela. */
export function showMockNotification(n: MockNotification) {
  listeners.forEach((l) => l(n))
}

export function onMockNotification(l: Listener) {
  listeners.add(l)
  return () => {
    listeners.delete(l)
  }
}

/** Pede à API a notificação de teste. No mock, mostra a simulação na tela. */
export async function sendTestNotification(preview: MockNotification) {
  await unwrap(api.POST('/notifications/test'))
  if (isMock()) showMockNotification(preview)
}

/** Texto da notificação do dia (o mesmo da prévia nas Configurações). */
export function reminderText(topicTitle: string | null) {
  return {
    title: 'Hora de estudar',
    body: topicTitle
      ? `Você ainda não registrou nada hoje. O tópico do dia é “${topicTitle}”.`
      : 'Você ainda não registrou nada hoje. Que tal dez minutos no próximo tópico?',
  }
}
