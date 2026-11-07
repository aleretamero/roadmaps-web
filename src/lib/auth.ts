import { API_BASE_URL, api } from '@/lib/api/client'

export type AuthProvider = 'github' | 'google'

export type ProviderOption = {
  id: AuthProvider
  label: string
  busyLabel: string
}

/**
 * Provedores oferecidos no login. Hoje só o GitHub; Google e e-mail/senha
 * entram aqui sem mudar a tela.
 */
export const AUTH_PROVIDERS: ReadonlyArray<ProviderOption> = [
  {
    id: 'github',
    label: 'Continuar com GitHub',
    busyLabel: 'Conectando ao GitHub…',
  },
]

const WELCOME_KEY = 'roadmaps-welcome'

/** Marca que a pessoa acabou de entrar (o app mostra "Olá, …!" uma vez). */
export function markWelcome() {
  try {
    sessionStorage.setItem(WELCOME_KEY, '1')
  } catch {
    /* sem storage: sem toast */
  }
}

/** Lê e apaga a marca de boas-vindas. */
export function takeWelcome(): boolean {
  try {
    const on = sessionStorage.getItem(WELCOME_KEY) === '1'
    sessionStorage.removeItem(WELCOME_KEY)
    return on
  } catch {
    return false
  }
}

export function loginUrl(provider: AuthProvider, redirect?: string) {
  const qs = redirect ? `?redirect=${encodeURIComponent(redirect)}` : ''
  return `${API_BASE_URL}/auth/login/${provider}${qs}`
}

/**
 * Começa o login. Com a API de verdade, o navegador vai para o OAuth do
 * provedor e volta para `redirect`. Com a API mockada (o MSW não intercepta
 * navegação), chamamos a rota pelo cliente e o app navega sozinho — devolve
 * `true` para quem chamou fazer a navegação.
 */
export async function startLogin(
  provider: AuthProvider,
  redirect?: string,
): Promise<boolean> {
  markWelcome()
  if (import.meta.env.VITE_API_MOCK === 'true') {
    const { response } = await api.GET('/auth/login/{provider}', {
      params: { path: { provider }, query: { redirect } },
      redirect: 'manual',
      parseAs: 'stream',
    })
    // `manual` devolve um redirecionamento opaco (status 0) quando deu certo.
    if (
      response.type !== 'opaqueredirect' &&
      !response.ok &&
      response.status !== 302
    )
      throw new Error(`login falhou (${response.status})`)
    return true
  }
  window.location.assign(loginUrl(provider, redirect))
  return false
}
