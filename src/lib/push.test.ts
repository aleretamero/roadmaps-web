import { describe, expect, it } from 'vitest'
import {
  onMockNotification,
  reminderText,
  showMockNotification,
  urlBase64ToUint8Array,
} from './push'

describe('lembrete', () => {
  it('chave VAPID base64url vira bytes', () => {
    expect([...urlBase64ToUint8Array('AQID-_8')]).toEqual([1, 2, 3, 251, 255])
  })
  it('texto com e sem tópico do dia', () => {
    expect(reminderText('Índices').body).toContain(
      'O tópico do dia é “Índices”',
    )
    expect(reminderText(null).body).toContain('dez minutos')
  })
  it('notificação simulada chega a quem está ouvindo', () => {
    const got: Array<string> = []
    const off = onMockNotification((n) => got.push(n.title))
    showMockNotification({ title: 'Hora de estudar', body: '', topicId: null })
    off()
    showMockNotification({ title: 'outra', body: '', topicId: null })
    expect(got).toEqual(['Hora de estudar'])
  })
})
