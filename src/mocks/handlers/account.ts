import { HttpResponse } from 'msw'
import { getDb } from '../state'
import { activity, dashboard, now } from '../domain'
import { http, noContent, num, problem } from './http'

export const accountHandlers = [
  // No mock o "OAuth" só liga a sessão e volta para o app.
  http.get('/auth/login/{provider}', ({ query }) => {
    getDb().loggedIn = true
    return HttpResponse.redirect(query.get('redirect') ?? '/dashboard', 302)
  }),
  http.get('/auth/callback/{provider}', () => {
    getDb().loggedIn = true
    return HttpResponse.redirect('/dashboard', 302)
  }),
  http.post('/auth/logout', () => {
    getDb().loggedIn = false
    return noContent()
  }),

  http.get('/me', ({ response }) => response(200).json(getDb().user)),
  http.patch('/me', async ({ request, response }) => {
    const body = await request.json()
    const db = getDb()
    if (body.name !== undefined && !body.name.trim())
      return problem(400, 'validation_error', 'Campos inválidos', {
        name: ['Obrigatório'],
      })
    if (body.timeZone !== undefined) {
      try {
        new Intl.DateTimeFormat('pt-BR', { timeZone: body.timeZone })
      } catch {
        return problem(400, 'validation_error', 'Campos inválidos', {
          timeZone: ['Fuso horário inválido'],
        })
      }
    }
    Object.assign(db.user, body)
    return response(200).json(db.user)
  }),
  http.get('/me/preferences', ({ response }) =>
    response(200).json(getDb().preferences),
  ),
  http.put('/me/preferences', async ({ request, response }) => {
    const body = await request.json()
    if (!body.studyDays.length)
      return problem(400, 'validation_error', 'Campos inválidos', {
        studyDays: ['Escolha pelo menos um dia de estudo'],
      })
    getDb().preferences = body
    return response(200).json(body)
  }),

  http.get('/dashboard', ({ response }) =>
    response(200).json(dashboard(getDb())),
  ),
  http.get('/dashboard/activity', ({ query, response }) =>
    response(200).json(
      activity(getDb(), num(query.get('weeks') ?? '24') || 24),
    ),
  ),

  http.get('/integrations', ({ response }) => {
    const { drive } = getDb()
    return response(200).json([
      {
        provider: 'googleDrive',
        available: true,
        connected: drive.connected,
        accountEmail: drive.accountEmail,
        rootFolderName: drive.rootFolderName,
        connectedAt: drive.connectedAt,
      },
      {
        provider: 'googleCalendar',
        available: false,
        connected: false,
        accountEmail: null,
        rootFolderName: null,
        connectedAt: null,
      },
    ])
  }),
  // No mock a conexão é imediata e volta para `returnTo`.
  http.get('/integrations/google-drive/connect', ({ query }) => {
    const db = getDb()
    db.drive = {
      connected: true,
      accountEmail: db.user.email,
      rootFolderName: 'Roadmaps',
      connectedAt: now(),
    }
    return HttpResponse.redirect(
      query.get('returnTo') ?? '/settings/integrations',
      302,
    )
  }),
  http.get(
    '/integrations/google-drive/callback',
    () => HttpResponse.redirect('/settings/integrations', 302) as never,
  ),
  http.patch('/integrations/google-drive', async ({ request, response }) => {
    const db = getDb()
    if (!db.drive.connected)
      return problem(409, 'drive_not_connected', 'Google Drive não conectado')
    const body = await request.json()
    db.drive.rootFolderName = body.rootFolderName
    return response(200).json({
      provider: 'googleDrive',
      available: true,
      ...db.drive,
    })
  }),
  http.delete('/integrations/google-drive', () => {
    getDb().drive = {
      connected: false,
      accountEmail: null,
      rootFolderName: null,
      connectedAt: null,
    }
    return noContent()
  }),

  http.get('/notifications/public-key', ({ response }) =>
    response(200).json({
      publicKey:
        'BMockVapidPublicKeyRoadmaps0000000000000000000000000000000000000',
    }),
  ),
  http.post('/notifications/subscriptions', async ({ request, response }) => {
    const body = await request.json()
    const db = getDb()
    const sub = { id: ++db.seq, endpoint: body.endpoint, createdAt: now() }
    db.pushSubscriptions = [
      ...db.pushSubscriptions.filter((s) => s.endpoint !== body.endpoint),
      sub,
    ]
    return response(201).json(sub)
  }),
  http.delete('/notifications/subscriptions/{id}', ({ params }) => {
    const db = getDb()
    db.pushSubscriptions = db.pushSubscriptions.filter(
      (s) => s.id !== num(params.id),
    )
    return noContent()
  }),
  http.post('/notifications/test', () => noContent()),
]
