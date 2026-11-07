import { useSyncExternalStore } from 'react'
import { colorGroups, radii, shadows, stages } from './tokens'

const noop = () => () => {}

function useCssVar(name: string) {
  return useSyncExternalStore(
    noop,
    () =>
      getComputedStyle(document.documentElement).getPropertyValue(name).trim(),
    () => '',
  )
}

function Swatch({ token }: { token: string }) {
  const value = useCssVar(`--color-${token}`)
  return (
    <li className="flex items-center gap-3">
      <span
        className="size-10 shrink-0 rounded-md border border-line"
        style={{ background: `var(--color-${token})` }}
      />
      <span className="flex flex-col">
        <code className="font-mono text-sm">{token}</code>
        <span className="font-mono text-xs text-ink-soft">{value}</span>
      </span>
    </li>
  )
}

export function TokensPage() {
  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-10 p-8">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Tokens de design</h1>
        <p className="text-ink-muted">
          Fonte única das cores, tipografia, raios e sombras
          (src/styles/tokens.css). Página só de desenvolvimento.
        </p>
      </header>

      {colorGroups.map((group) => (
        <section key={group.title} className="flex flex-col gap-4">
          <h2 className="text-lg font-semibold">{group.title}</h2>
          <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {group.tokens.map((t) => (
              <Swatch key={t} token={t} />
            ))}
          </ul>
        </section>
      ))}

      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold">Etapas</h2>
        <div className="flex flex-wrap gap-2">
          {stages.map((s) => (
            <span
              key={s.key}
              className="inline-flex h-7 items-center rounded-full px-3 text-xs font-medium"
              style={{
                background: `var(--color-stage-${s.key})`,
                color: `var(--color-stage-${s.key}-fg)`,
              }}
            >
              {s.label}
            </span>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold">Tipografia</h2>
        <p className="font-sans text-4xl font-bold tracking-tight">
          Geist — Transforme o que você quer aprender
        </p>
        <p className="font-sans text-base text-ink-muted">
          Texto corrido em Geist, 16 px, cor ink-muted.
        </p>
        <p className="font-mono text-sm">Geist Mono — 62% · 1/3 · 2026-11-07</p>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold">Raios e sombras</h2>
        <div className="flex flex-wrap gap-4">
          {radii.map((r) => (
            <div
              key={r}
              className="grid size-20 place-items-center border border-line-strong bg-surface font-mono text-xs"
              style={{ borderRadius: `var(--radius-${r})` }}
            >
              {r}
            </div>
          ))}
          {shadows.map((s) => (
            <div
              key={s}
              className="grid h-20 w-32 place-items-center rounded-xl bg-surface font-mono text-xs"
              style={{ boxShadow: `var(--shadow-${s})` }}
            >
              shadow-{s}
            </div>
          ))}
        </div>
      </section>
    </main>
  )
}
