import { HttpResponse } from 'msw'
import type { Schemas } from '@/lib/api/client'
import { getDb } from '../state'
import { fileTree, matcher, now, snippet, topicRef } from '../domain'
import {
  etag,
  findModule,
  findRoadmap,
  findTopic,
  http,
  noContent,
  notFound,
  num,
  paginate,
  preconditionFailed,
  problem,
  problemResponse,
} from './http'

const MAX_FILE = 20 * 1024 * 1024

const driveConnected = () => getDb().drive.connected
const driveMissing = () =>
  problem(409, 'drive_not_connected', 'Google Drive não conectado')

function safePath(path: string | null | undefined) {
  const p = (path ?? '').trim().replace(/^\/+|\/+$/g, '')
  if (!p || p.split('/').some((part) => part === '..' || part === '.' || !part))
    return null
  return p
}

function noteRequest(body: Schemas['NoteRequest']) {
  if (!body.content.trim())
    return problemResponse(400, 'validation_error', 'Anotação vazia', {
      content: ['Escreva alguma coisa'],
    })
  if (body.content.length > 100_000)
    return problemResponse(400, 'validation_error', 'Anotação grande demais', {
      content: ['Máximo de 100 mil caracteres'],
    })
  return null
}

function parseUrl(raw: string): URL | Response {
  try {
    const url = new URL(raw)
    if (url.protocol === 'http:' || url.protocol === 'https:') return url
  } catch {
    /* cai no erro abaixo */
  }
  return problemResponse(400, 'validation_error', 'Link inválido', {
    url: ['Use um link que comece com http:// ou https://'],
  })
}

export const contentHandlers = [
  http.get('/topics/{id}/notes', ({ params, response }) => {
    const db = getDb()
    if (!findTopic(num(params.id))) return notFound()
    return response(200).json(
      db.notes
        .filter((n) => n.topicId === num(params.id))
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    )
  }),
  http.post('/topics/{id}/notes', async ({ params, request, response }) => {
    const db = getDb()
    const topic = findTopic(num(params.id))
    if (!topic) return notFound()
    const body = await request.json()
    const invalid = noteRequest(body)
    if (invalid) return invalid as never
    const note = {
      id: ++db.seq,
      topicId: topic.id,
      moduleId: null,
      content: body.content,
      createdAt: now(),
      editedAt: null,
      version: 1,
    }
    db.notes.push(note)
    return response(201).json(note)
  }),
  http.get('/modules/{id}/notes', ({ params, response }) => {
    const db = getDb()
    if (!findModule(num(params.id))) return notFound()
    return response(200).json(
      db.notes
        .filter((n) => n.moduleId === num(params.id))
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    )
  }),
  http.post('/modules/{id}/notes', async ({ params, request, response }) => {
    const db = getDb()
    const mod = findModule(num(params.id))
    if (!mod) return notFound()
    const body = await request.json()
    const invalid = noteRequest(body)
    if (invalid) return invalid as never
    const note = {
      id: ++db.seq,
      topicId: null,
      moduleId: mod.id,
      content: body.content,
      createdAt: now(),
      editedAt: null,
      version: 1,
    }
    db.notes.push(note)
    return response(201).json(note)
  }),
  http.patch('/notes/{id}', async ({ params, request, response }) => {
    const db = getDb()
    const note = db.notes.find((n) => n.id === num(params.id))
    if (!note) return notFound()
    const stale = preconditionFailed(request, note.version)
    if (stale) return stale as never
    const body = await request.json()
    const invalid = noteRequest(body)
    if (invalid) return invalid as never
    note.content = body.content
    note.editedAt = now()
    note.version += 1
    return response(200).json(note, { headers: { ETag: etag(note.version) } })
  }),
  http.delete('/notes/{id}', ({ params }) => {
    const db = getDb()
    db.notes = db.notes.filter((n) => n.id !== num(params.id))
    return noContent()
  }),

  http.get('/topics/{id}/resources', ({ params, response }) => {
    const db = getDb()
    if (!findTopic(num(params.id))) return notFound()
    return response(200).json(
      db.resources.filter((r) => r.topicId === num(params.id)),
    )
  }),
  http.post('/topics/{id}/resources', async ({ params, request, response }) => {
    const db = getDb()
    const topic = findTopic(num(params.id))
    if (!topic) return notFound()
    const body = await request.json()
    const url = parseUrl(body.url)
    if (url instanceof Response) return url
    const resource = {
      id: ++db.seq,
      topicId: topic.id,
      title: body.title?.trim() || url.hostname.replace(/^www\./, ''),
      url: url.toString(),
      kind: body.kind ?? 'other',
      createdAt: now(),
    }
    db.resources.push(resource)
    return response(201).json(resource)
  }),
  http.patch('/resources/{id}', async ({ params, request, response }) => {
    const db = getDb()
    const resource = db.resources.find((r) => r.id === num(params.id))
    if (!resource) return notFound()
    const body = await request.json()
    const url = parseUrl(body.url)
    if (url instanceof Response) return url
    Object.assign(resource, {
      title: body.title?.trim() || resource.title,
      url: url.toString(),
      kind: body.kind ?? resource.kind,
    })
    return response(200).json(resource)
  }),
  http.delete('/resources/{id}', ({ params }) => {
    const db = getDb()
    db.resources = db.resources.filter((r) => r.id !== num(params.id))
    return noContent()
  }),

  http.get('/search', ({ query, response }) => {
    const db = getDb()
    const q = query.get('q')
    const type = query.get('type')
    const includeArchived = query.get('includeArchived') === 'true'
    const match = matcher(q)
    // Tópicos de roadmaps arquivados só entram quando pedido.
    const visible = (topicId: number) => {
      const t = findTopic(topicId)
      const m = t && findModule(t.moduleId)
      const r = m && findRoadmap(m.roadmapId)
      return !!r && (includeArchived || !r.archivedAt)
    }
    const items: Array<Schemas['SearchResult']> = []
    if (q.trim().length >= 2) {
      if (!type || type === 'topics')
        for (const t of db.topics)
          if (match(`${t.title} ${t.description ?? ''}`))
            items.push({
              type: 'topic',
              id: t.id,
              title: t.title,
              snippet: snippet(t.description ?? t.title, q),
              topic: topicRef(db, t),
              stage: t.stage,
            })
      if (!type || type === 'notes')
        for (const n of db.notes) {
          const t = n.topicId ? findTopic(n.topicId) : undefined
          if (t && match(n.content))
            items.push({
              type: 'note',
              id: n.id,
              title: `Anotação em ${t.title}`,
              snippet: snippet(n.content, q),
              topic: topicRef(db, t),
              stage: t.stage,
            })
        }
      if (!type || type === 'files')
        for (const f of db.files) {
          const t = findTopic(f.topicId)
          if (t && match(f.path))
            items.push({
              type: 'file',
              id: f.id,
              title: f.path.split('/').at(-1) ?? f.path,
              snippet: snippet(f.path, q),
              topic: topicRef(db, t),
              stage: t.stage,
            })
        }
    }
    const shown = items.filter((i) => visible(i.topic.id))
    return response(200).json({
      ...paginate(shown, query),
      total: shown.length,
    })
  }),

  http.get('/topics/{id}/files', ({ params, response }) => {
    if (!driveConnected()) return driveMissing()
    if (!findTopic(num(params.id))) return notFound()
    return response(200).json(fileTree(getDb(), num(params.id)))
  }),
  http.post('/topics/{id}/files', async ({ params, request, response }) => {
    if (!driveConnected()) return driveMissing()
    const db = getDb()
    const topic = findTopic(num(params.id))
    if (!topic) return notFound()
    const form = await request.formData()
    const file = form.get('file')
    if (!(file instanceof File))
      return problem(400, 'validation_error', 'Arquivo ausente', {
        file: ['Envie um arquivo'],
      })
    if (file.size > MAX_FILE)
      return problem(413, 'validation_error', 'Arquivo maior que 20 MB', {
        file: ['Máximo de 20 MB'],
      })
    const dir =
      typeof form.get('path') === 'string' ? (form.get('path') as string) : ''
    const path = safePath(dir ? `${dir}/${file.name}` : file.name)
    if (!path)
      return problem(400, 'validation_error', 'Caminho inválido', {
        path: ['Caminho inválido'],
      })
    // Texto fica como texto; imagem fica em base64 (para a pré-visualização).
    const content = file.type.startsWith('image/')
      ? btoa(
          Array.from(new Uint8Array(await file.arrayBuffer()), (b) =>
            String.fromCharCode(b),
          ).join(''),
        )
      : file.type.startsWith('text/') ||
          /\.(md|txt|sql|cs|ts|js|json|ya?ml|sh|py)$/i.test(file.name)
        ? await file.text()
        : ''
    db.files = db.files.filter(
      (f) => !(f.topicId === topic.id && f.path === path),
    )
    const created = {
      id: ++db.seq,
      topicId: topic.id,
      path,
      mimeType: file.type || 'application/octet-stream',
      sizeBytes: file.size,
      content,
      updatedAt: now(),
    }
    db.files.push(created)
    return response(201).json({
      path,
      name: file.name,
      type: 'file',
      id: created.id,
      mimeType: created.mimeType,
      sizeBytes: created.sizeBytes,
      updatedAt: created.updatedAt,
      children: [],
    })
  }),
  http.post('/topics/{id}/folders', async ({ params, request, response }) => {
    if (!driveConnected()) return driveMissing()
    const db = getDb()
    const topicId = num(params.id)
    if (!findTopic(topicId)) return notFound()
    const path = safePath((await request.json()).path)
    if (!path)
      return problem(400, 'validation_error', 'Caminho inválido', {
        path: ['Caminho inválido'],
      })
    if (!db.folders.some((f) => f.topicId === topicId && f.path === path))
      db.folders.push({ topicId, path })
    return response(201).json({
      path,
      name: path.split('/').at(-1) ?? path,
      type: 'folder',
      id: null,
      mimeType: null,
      sizeBytes: null,
      updatedAt: null,
      children: [],
    })
  }),
  http.post('/topics/{id}/files/move', async ({ params, request }) => {
    if (!driveConnected()) return driveMissing()
    const db = getDb()
    const topicId = num(params.id)
    const body = await request.json()
    const from = safePath(body.from)
    const to = safePath(body.to)
    if (!from || !to)
      return problem(400, 'validation_error', 'Caminho inválido', {
        to: ['Caminho inválido'],
      })
    const prefix = `${from}/`
    for (const f of db.files.filter((x) => x.topicId === topicId)) {
      if (f.path === from) f.path = to
      else if (f.path.startsWith(prefix))
        f.path = to + f.path.slice(from.length)
    }
    for (const f of db.folders.filter((x) => x.topicId === topicId)) {
      if (f.path === from) f.path = to
      else if (f.path.startsWith(prefix))
        f.path = to + f.path.slice(from.length)
    }
    return noContent()
  }),
  http.delete('/topics/{id}/files', ({ params, query }) => {
    if (!driveConnected()) return driveMissing()
    const db = getDb()
    const topicId = num(params.id)
    const path = safePath(query.get('path'))
    if (!path)
      return problem(400, 'validation_error', 'Caminho inválido', {
        path: ['Caminho inválido'],
      })
    const inside = (p: string) => p === path || p.startsWith(`${path}/`)
    db.files = db.files.filter(
      (f) => !(f.topicId === topicId && inside(f.path)),
    )
    db.folders = db.folders.filter(
      (f) => !(f.topicId === topicId && inside(f.path)),
    )
    return noContent()
  }),
  http.get('/files/{id}/content', ({ params }) => {
    if (!driveConnected()) return driveMissing()
    const f = getDb().files.find((x) => x.id === num(params.id))
    if (!f) return notFound()
    const body = f.mimeType.startsWith('image/')
      ? Uint8Array.from(atob(f.content), (c) => c.charCodeAt(0))
      : f.content
    return new HttpResponse(body, {
      headers: { 'Content-Type': f.mimeType },
    }) as never
  }),
]
