import { Link } from '@tanstack/react-router'
import { Loader2 } from 'lucide-react'
import { LogoMark } from '@/components/Logo'
import type { AuthProvider, ProviderOption } from '@/lib/auth'

const GitHubMark = () => (
  <svg
    viewBox="0 0 16 16"
    fill="currentColor"
    aria-hidden="true"
    className="size-[18px]"
  >
    <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
  </svg>
)

const ICONS: Partial<Record<AuthProvider, () => React.ReactElement>> = {
  github: GitHubMark,
}

export type LoginCardProps = {
  providers: ReadonlyArray<ProviderOption>
  /** Provedor com o login em andamento (desabilita os botões). */
  busy?: AuthProvider | null
  error?: string | null
  onLogin: (provider: AuthProvider) => void
}

/** Card de login: um botão por provedor, erro e volta para a landing. */
export function LoginCard({
  providers,
  busy = null,
  error,
  onLogin,
}: LoginCardProps) {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-canvas bg-dots-login px-4 py-8">
      <div className="flex w-full max-w-[420px] flex-col gap-[22px] rounded-[20px] border border-line bg-surface px-6 pt-9 pb-7 shadow-preview sm:px-8">
        <span className="flex items-center gap-2.5 text-[17px] font-semibold">
          <LogoMark />
          Roadmaps
        </span>
        <div className="flex flex-col gap-1.5">
          <h1 className="text-[26px] font-bold tracking-[-0.02em]">
            Entre na sua conta
          </h1>
          <p className="text-ink-muted">
            Use sua conta do GitHub. Se for a primeira vez, a conta é criada na
            hora.
          </p>
        </div>
        {error && (
          <p
            role="alert"
            className="rounded-xl bg-danger-soft px-3.5 py-3 text-sm text-danger"
          >
            {error}
          </p>
        )}
        <div className="flex flex-col gap-2.5">
          {providers.map((p) => {
            const Icon = ICONS[p.id]
            const isBusy = busy === p.id
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => onLogin(p.id)}
                disabled={busy !== null}
                aria-busy={isBusy || undefined}
                className="flex h-[52px] items-center justify-center gap-2.5 rounded-xl bg-ink text-base font-semibold text-surface transition-opacity hover:opacity-90 disabled:cursor-progress disabled:opacity-80"
              >
                {isBusy ? (
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                ) : (
                  Icon && <Icon />
                )}
                {isBusy ? p.busyLabel : p.label}
              </button>
            )
          })}
        </div>
        <p className="text-[13px] leading-normal text-ink-soft">
          Pedimos só nome, e-mail e foto do seu perfil. Nada dos seus
          repositórios.
        </p>
        <Link to="/" className="self-start text-sm text-link hover:underline">
          ← Voltar para a página inicial
        </Link>
      </div>
    </main>
  )
}
