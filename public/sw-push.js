/* Service worker das notificações do lembrete diário (Web Push).
 * A API envia { title, body, topicId }. As ações abrem o tópico com o modal
 * Registrar sessão (`?log=1`) ou deixam para amanhã. */

self.addEventListener('push', (event) => {
  let data = {}
  try {
    data = event.data ? event.data.json() : {}
  } catch {
    data = { body: event.data ? event.data.text() : '' }
  }
  const title = data.title || 'Hora de estudar'
  const topicId = data.topicId ?? null
  event.waitUntil(
    self.registration.showNotification(title, {
      body: data.body || 'Você ainda não registrou nada hoje.',
      tag: 'roadmaps-lembrete',
      renotify: true,
      data: { topicId },
      actions: [
        { action: 'log', title: 'Registrar' },
        { action: 'later', title: 'Amanhã' },
      ],
    }),
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  if (event.action === 'later') return
  const topicId = event.notification.data && event.notification.data.topicId
  const url = topicId ? `/topics/${topicId}?log=1` : '/dashboard'
  event.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((list) => {
        for (const client of list) {
          if ('focus' in client) {
            client.navigate(url)
            return client.focus()
          }
        }
        return self.clients.openWindow(url)
      }),
  )
})
