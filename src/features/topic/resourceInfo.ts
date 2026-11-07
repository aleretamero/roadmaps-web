import type { Schemas } from '@/lib/api/client'

export type ResourceKind = Schemas['Resource']['kind']
/** Como o link aparece: o tipo da API, mais Documentação e Repositório pelo domínio. */
export type ResourceLook =
  'video' | 'course' | 'book' | 'docs' | 'repo' | 'article' | 'link'

export const LOOK_LABEL: Record<ResourceLook, string> = {
  video: 'Vídeo',
  course: 'Curso',
  book: 'Livro',
  docs: 'Documentação',
  repo: 'Repositório',
  article: 'Artigo',
  link: 'Link',
}

export const KIND_LABEL: Record<ResourceKind, string> = {
  article: 'Artigo',
  video: 'Vídeo',
  book: 'Livro',
  course: 'Curso',
  other: 'Outro',
}

/** Domínio sem "www." (vazio se a URL for inválida). */
export function hostOf(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return ''
  }
}

const isVideo = (h: string) =>
  /(^|\.)(youtube\.com|youtu\.be|vimeo\.com)$/.test(h)
const isCourse = (h: string) =>
  /(udemy|coursera|alura|pluralsight|edx)\./.test(h)
const isRepo = (h: string) =>
  /(^|\.)(github\.com|gitlab\.com|bitbucket\.org)$/.test(h)
const isDocs = (h: string) =>
  /^(learn|docs|developer)\.|readthedocs|mozilla\.org$|microsoft\.com$/.test(h)

/** Tipo sugerido pelo domínio, para mandar à API ao adicionar. */
export function guessKind(url: string): ResourceKind {
  const h = hostOf(url)
  if (isVideo(h)) return 'video'
  if (isCourse(h)) return 'course'
  if (isRepo(h) || isDocs(h)) return 'other'
  return 'article'
}

export function lookOf(
  r: Pick<Schemas['Resource'], 'kind' | 'url'>,
): ResourceLook {
  const h = hostOf(r.url)
  if (r.kind === 'video' || r.kind === 'course' || r.kind === 'book')
    return r.kind
  if (isRepo(h)) return 'repo'
  if (isDocs(h)) return 'docs'
  return r.kind === 'article' ? 'article' : 'link'
}

/** Título a partir do último pedaço do caminho ("ef-core-indexes" → "Ef core indexes"); senão o domínio. */
export function autoTitle(url: string) {
  const host = hostOf(url)
  try {
    const seg = new URL(url).pathname.split('/').filter(Boolean).pop() ?? ''
    const t = decodeURIComponent(seg)
      .replace(/\.[a-z]{2,5}$/i, '')
      .replace(/[-_+]+/g, ' ')
      .trim()
    return t && !/^\d+$/.test(t)
      ? t[0]!.toUpperCase() + t.slice(1)
      : host || url
  } catch {
    return host || url
  }
}

/** Completa "exemplo.com/x" com https:// (o resto da validação fica no Zod). */
export const withProtocol = (raw: string) => {
  const v = raw.trim()
  return !v || /^[a-z][a-z0-9+.-]*:\/\//i.test(v) ? v : `https://${v}`
}

/** URL http/https completa, com domínio. */
export function isHttpUrl(v: string) {
  try {
    const u = new URL(v)
    return (
      (u.protocol === 'http:' || u.protocol === 'https:') &&
      u.hostname.includes('.')
    )
  } catch {
    return false
  }
}
