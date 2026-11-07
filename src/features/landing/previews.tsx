/*
 * Ilustrações da landing: pedaços do app desenhados com HTML e tokens.
 * São decorativas (aria-hidden) — o texto ao lado é que explica.
 */
import { cn } from '@/lib/utils'

const HEAT = [
  'bg-heat-0',
  'bg-heat-1',
  'bg-heat-2',
  'bg-heat-3',
  'bg-heat-4',
] as const

/** Gerador pseudoaleatório com semente: o desenho é sempre o mesmo. */
function mulberry32(seed: number) {
  let a = seed
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Níveis 0–4 por semana (colunas) × dia (7 linhas), mais cheio no fim. */
export function heatPattern(columns: number, seed = 7): Array<Array<number>> {
  const rand = mulberry32(seed)
  return Array.from({ length: columns }, (_, c) => {
    const density = 0.25 + (c / columns) * 0.55
    return Array.from({ length: 7 }, () => {
      if (rand() > density) return 0
      return 1 + Math.floor(rand() * 4)
    })
  })
}

export function HeatPreview({
  columns = 18,
  className,
}: {
  columns?: number
  className?: string
}) {
  const weeks = heatPattern(columns)
  return (
    <div
      className={cn('grid gap-[3px]', className)}
      style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
    >
      {weeks.map((days, c) => (
        <div key={c} className="grid gap-[3px]">
          {days.map((level, r) => (
            <span
              key={r}
              className={cn('aspect-square rounded-[3px]', HEAT[level])}
            />
          ))}
        </div>
      ))}
    </div>
  )
}

type Dot = 'studying' | 'practicing' | 'completed' | 'planned'
const DAYS: ReadonlyArray<{
  label: string
  n: number
  dots: ReadonlyArray<Dot>
  state?: 'done' | 'today'
}> = [
  { label: 'DOM', n: 1, dots: ['studying', 'practicing'], state: 'done' },
  { label: 'SEG', n: 2, dots: ['completed'], state: 'done' },
  { label: 'TER', n: 3, dots: ['planned'], state: 'today' },
  { label: 'QUA', n: 4, dots: [] },
  { label: 'QUI', n: 5, dots: ['planned'] },
  { label: 'SEX', n: 6, dots: [] },
  { label: 'SÁB', n: 7, dots: [] },
]
const DOT: Record<Dot, string> = {
  studying: 'bg-chart-studying',
  practicing: 'bg-chart-practicing',
  completed: 'bg-chart-completed',
  planned: 'border-[1.5px] border-dashed border-ink-faint',
}

/** "Sua semana" com a sequência e o mapa de calor. */
export function WeekPreview({
  shadow = false,
  className,
}: {
  shadow?: boolean
  className?: string
}) {
  return (
    <div
      className={cn(
        'flex flex-col gap-4 rounded-[20px] border border-line bg-surface p-4 sm:p-[22px]',
        shadow && 'shadow-preview',
        className,
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <strong className="font-semibold">Sua semana</strong>
        <span className="inline-flex h-6 items-center rounded-full bg-stage-practicing px-2.5 text-xs font-semibold whitespace-nowrap text-stage-practicing-fg">
          9 dias seguidos
        </span>
      </div>
      <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
        {DAYS.map((d) => (
          <div
            key={d.label}
            className={cn(
              'rounded-[10px] py-2 text-center',
              d.state === 'done' && 'bg-day-active',
              d.state === 'today' &&
                'shadow-[inset_0_0_0_2px_var(--color-ink)]',
              !d.state && 'shadow-ring-inset',
            )}
          >
            <div className="text-[10px] font-semibold text-ink-soft">
              {d.label}
            </div>
            <div className="font-semibold">{d.n}</div>
            <div className="mt-[3px] flex h-2 justify-center gap-0.5">
              {d.dots.map((dot, i) => (
                <span
                  key={i}
                  className={cn('size-1.5 rounded-full', DOT[dot])}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
      <HeatPreview />
    </div>
  )
}

const NODE = {
  root: 'rounded-full border-2 border-ink bg-surface py-2 text-center text-sm font-semibold',
  module:
    'rounded-[10px] bg-ink py-3 text-center text-[13px] font-semibold text-surface sm:text-sm',
  alt: 'rounded-[10px] bg-module-alt py-3 text-center text-[13px] font-semibold text-surface sm:text-sm',
  choice:
    'rounded-full border border-ink bg-surface px-2 py-1.5 text-center text-xs font-semibold',
  optional:
    'rounded-[10px] border-2 border-dashed border-ink bg-surface py-3 text-center font-semibold',
  topic: 'rounded-[10px] px-2 py-2 text-xs font-medium sm:px-3 sm:text-[13px]',
} as const

/** Mapa de um roadmap de Inglês, com caminho escolhido e opcional. */
export function MapPreview({
  shadow = false,
  className,
}: {
  shadow?: boolean
  className?: string
}) {
  return (
    <div
      className={cn(
        'grid grid-cols-[1fr_1.1fr_1fr] items-center gap-x-2 gap-y-3 rounded-[20px] border border-line bg-surface bg-dots p-3 text-sm sm:gap-x-3.5 sm:p-6 [&>*]:min-w-0 [&>*]:break-words',
        shadow && 'shadow-preview',
        className,
      )}
    >
      <span />
      <div className={NODE.root}>Inglês</div>
      <span />
      <div
        className={cn(
          NODE.topic,
          'border-[1.5px] border-success bg-stage-completed',
        )}
      >
        Pronúncia ✓
      </div>
      <div className={NODE.module}>Fundamentos</div>
      <div
        className={cn(
          NODE.topic,
          'border-[1.5px] border-link bg-stage-studying',
        )}
      >
        Vocabulário
      </div>
      <span />
      <div className={NODE.choice}>Escolha um caminho</div>
      <span />
      <div className={NODE.module}>Conversação</div>
      <div className={NODE.alt}>Escrita</div>
      <div className={NODE.alt}>Leitura</div>
      <div
        className={cn(
          NODE.topic,
          'border-[1.5px] border-chart-practicing bg-stage-practicing',
        )}
      >
        Diálogos
      </div>
      <div
        className={cn(
          NODE.topic,
          'border border-line bg-surface text-module-alt',
        )}
      >
        E-mails
      </div>
      <div
        className={cn(
          NODE.topic,
          'border border-line bg-surface text-module-alt',
        )}
      >
        Contos curtos
      </div>
      <span />
      <div className={NODE.optional}>Certificado · opcional</div>
      <span />
    </div>
  )
}

const BookIcon = () => (
  <svg
    viewBox="0 0 16 16"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="size-4"
  >
    <path d="M8 4.2C6.8 3.3 5 3 2.5 3v9.5c2.5 0 4.3.3 5.5 1.2 1.2-.9 3-1.2 5.5-1.2V3C11 3 9.2 3.3 8 4.2zM8 4.2v9.5" />
  </svg>
)
const CodeIcon = () => (
  <svg
    viewBox="0 0 16 16"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="size-4"
  >
    <path d="M5.5 4.5L2 8l3.5 3.5M10.5 4.5L14 8l-3.5 3.5" />
  </svg>
)
const CheckIcon = () => (
  <svg
    viewBox="0 0 16 16"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="size-4"
  >
    <path d="M3 8.5l3.2 3.2L13 4.8" />
  </svg>
)

/** O diálogo "Registrar sessão" já preenchido. */
export function SessionPreview({ className }: { className?: string }) {
  const acts = [
    {
      label: 'Estudei',
      hint: 'Li, assisti, anotei',
      on: true,
      tone: 'bg-stage-studying text-stage-studying-fg',
      icon: <BookIcon />,
    },
    {
      label: 'Pratiquei',
      hint: 'Exercícios, prática',
      on: true,
      tone: 'bg-stage-practicing text-stage-practicing-fg',
      icon: <CodeIcon />,
    },
    {
      label: 'Concluí',
      hint: 'Já domino',
      on: false,
      tone: 'bg-stage-completed text-stage-completed-fg',
      icon: <CheckIcon />,
    },
  ]
  return (
    <div
      className={cn(
        'flex flex-col gap-4 rounded-[20px] border border-line bg-surface p-4 shadow-preview sm:p-[22px]',
        className,
      )}
    >
      <div className="flex flex-col gap-0.5">
        <span className="text-[11px] font-semibold tracking-[.06em] text-ink-soft uppercase">
          Registrar sessão
        </span>
        <strong className="text-lg font-semibold">Verbos no passado</strong>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {acts.map((a) => (
          <div
            key={a.label}
            className={cn(
              'flex min-w-0 flex-col gap-1.5 rounded-xl p-3 sm:p-3.5',
              a.on
                ? 'border-2 border-ink bg-surface-raised'
                : 'border border-line-strong bg-surface',
            )}
          >
            <span
              className={cn(
                'grid size-[30px] place-items-center rounded-full',
                a.tone,
              )}
            >
              {a.icon}
            </span>
            <strong className="font-semibold">{a.label}</strong>
            <span className="text-xs text-ink-muted">{a.hint}</span>
          </div>
        ))}
      </div>
      <div className="rounded-[10px] border border-line-strong px-3 py-2.5 text-sm text-ink-strong">
        Escrevi um diário curto só com verbos no passado.
      </div>
      <div className="rounded-[10px] bg-stage-practicing px-3 py-2.5 text-[13px] text-stage-practicing-fg">
        O tópico passa de Estudando para Praticando.
      </div>
    </div>
  )
}

/** Moldura de navegador com o painel do app, usada na abertura. */
export function AppPreview() {
  return (
    <div className="overflow-hidden rounded-[22px] border border-line bg-surface shadow-hero">
      <div className="flex h-10 items-center gap-[7px] border-b border-surface-sunken bg-surface-raised px-4">
        <span className="size-[11px] rounded-full bg-line" />
        <span className="size-[11px] rounded-full bg-line" />
        <span className="size-[11px] rounded-full bg-line" />
        <span className="ml-3.5 inline-flex h-[22px] items-center rounded-md bg-surface-sunken px-3 text-[11px] text-ink-soft">
          roadmaps.app/painel
        </span>
      </div>
      <div className="flex flex-wrap gap-5 bg-canvas p-3 sm:p-6">
        <MapPreview className="min-w-0 flex-[3_1_420px]" />
        <WeekPreview className="min-w-0 flex-[2_1_300px] self-start" />
      </div>
    </div>
  )
}

/** Desenhos pequenos dos quatro passos de "Como funciona". */
export function StepArt({ step }: { step: number }) {
  const chip =
    'inline-flex h-[26px] items-center rounded-lg px-2.5 text-xs font-semibold'
  const box =
    'flex h-[92px] items-center justify-center gap-1.5 rounded-xl bg-canvas px-3'
  if (step === 0)
    return (
      <div className={box}>
        <div className="flex flex-col items-center gap-1.5">
          <span className={cn(chip, 'rounded-full bg-ink text-surface')}>
            Inglês
          </span>
          <div className="flex gap-1.5">
            <span className={cn(chip, 'border border-line-strong bg-surface')}>
              Gramática
            </span>
            <span className={cn(chip, 'border border-line-strong bg-surface')}>
              Vocabulário
            </span>
          </div>
        </div>
      </div>
    )
  if (step === 1) {
    const days = ['S', 'T', 'Q', 'Q', 'S', 'S', 'D']
    const on = [true, false, true, false, true, false, false]
    return (
      <div className={box}>
        {days.map((d, i) => (
          <span
            key={i}
            className={cn(
              'flex h-10 w-[30px] flex-col items-center justify-center gap-1 rounded-lg text-[10px] font-semibold',
              on[i]
                ? 'border border-line-strong bg-surface text-ink'
                : 'text-ink-faint',
            )}
          >
            {d}
            <span
              className={cn(
                'size-1.5 rounded-full',
                on[i] && 'bg-chart-studying',
              )}
            />
          </span>
        ))}
      </div>
    )
  }
  if (step === 2)
    return (
      <div className={box}>
        <span className={cn(chip, 'border border-line-strong bg-surface')}>
          Estudei
        </span>
        <span
          className={cn(
            chip,
            'border-[1.5px] border-chart-practicing bg-stage-practicing text-stage-practicing-fg',
          )}
        >
          Pratiquei
        </span>
        <span className={cn(chip, 'border border-line-strong bg-surface')}>
          Concluí
        </span>
      </div>
    )
  return (
    <div className={box}>
      <div className="flex w-full max-w-[180px] flex-col gap-2">
        <div className="flex items-baseline justify-between">
          <span className="text-xs text-ink-soft">Inglês</span>
          <span className="font-mono text-xl font-semibold">62%</span>
        </div>
        <div className="h-2 overflow-hidden rounded-[4px] bg-line">
          <div className="h-full w-[62%] bg-chart-completed" />
        </div>
      </div>
    </div>
  )
}
