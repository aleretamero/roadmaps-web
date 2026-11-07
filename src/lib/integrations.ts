import { API_BASE_URL, api } from '@/lib/api/client'

export function driveConnectUrl(returnTo?: string) {
  const qs = returnTo ? `?returnTo=${encodeURIComponent(returnTo)}` : ''
  return `${API_BASE_URL}/integrations/google-drive/connect${qs}`
}

/**
 * Começa a conexão com o Google Drive. Com a API de verdade, o navegador vai
 * para o OAuth do Google e volta para `returnTo`. Com a API mockada (o MSW não
 * intercepta navegação), chamamos a rota pelo cliente e devolvemos `true` para
 * quem chamou navegar para `returnTo`.
 */
export async function startDriveConnect(returnTo?: string): Promise<boolean> {
  if (import.meta.env.VITE_API_MOCK === 'true') {
    const { response } = await api.GET('/integrations/google-drive/connect', {
      params: { query: { returnTo } },
      redirect: 'manual',
      parseAs: 'stream',
    })
    if (
      response.type !== 'opaqueredirect' &&
      !response.ok &&
      response.status !== 302
    )
      throw new Error(`conexão com o Drive falhou (${response.status})`)
    return true
  }
  window.location.assign(driveConnectUrl(returnTo))
  return false
}

/** Fusos que o navegador conhece (com o atual garantido na lista). */
export function timeZones(current: string): Array<string> {
  const all: Array<string> =
    typeof Intl.supportedValuesOf === 'function'
      ? Intl.supportedValuesOf('timeZone')
      : []
  return all.includes(current) ? all : [current, ...all]
}

/** "America/Sao_Paulo" → "America/São Paulo (UTC−3)" */
export function timeZoneLabel(tz: string, at = new Date()) {
  let offset = ''
  try {
    offset =
      new Intl.DateTimeFormat('en-US', {
        timeZone: tz,
        timeZoneName: 'shortOffset',
      })
        .formatToParts(at)
        .find((p) => p.type === 'timeZoneName')
        ?.value.replace('GMT', 'UTC')
        .replace('-', '−') ?? ''
  } catch {
    /* fuso desconhecido: sem deslocamento */
  }
  const name = tz.replace(/_/g, ' ').replace('Sao Paulo', 'São Paulo')
  return offset && offset !== 'UTC'
    ? `${name} (${offset})`
    : offset
      ? `${name} (UTC)`
      : name
}
