import { Link } from '@tanstack/react-router'
import {
  ArrowRight,
  Check,
  Download,
  FileText,
  Folder,
  Plus,
  Search,
} from 'lucide-react'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { LogoMark } from '@/components/Logo'
import { cn } from '@/lib/utils'
import { EXTRAS, FAQ, FEATURES, STEPS, SUBJECTS } from './content'
import {
  AppPreview,
  MapPreview,
  SessionPreview,
  StepArt,
  WeekPreview,
} from './previews'

const container = 'mx-auto w-full max-w-[1224px] px-4 sm:px-8'
const eyebrow =
  'text-[13px] font-semibold tracking-[0.06em] text-link uppercase'
const HEADER_H = 68

/** Rola até a seção sem pular (respeita "reduzir movimento") e mantém o #hash. */
function scrollToSection(e: React.MouseEvent<HTMLAnchorElement>, id: string) {
  const el = document.getElementById(id)
  if (!el) return
  e.preventDefault()
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const top = el.getBoundingClientRect().top + window.scrollY - HEADER_H
  window.scrollTo({ top, behavior: reduce ? 'auto' : 'smooth' })
  history.replaceState(null, '', `#${id}`)
  el.focus({ preventScroll: true })
}

function EnterLink({
  inverse = false,
  className,
}: {
  inverse?: boolean
  className?: string
}) {
  return (
    <Link
      to="/login"
      className={cn(
        'inline-flex h-[52px] items-center gap-2.5 rounded-xl px-[22px] text-base font-semibold transition-opacity hover:opacity-90',
        inverse ? 'bg-surface text-ink' : 'bg-ink text-surface shadow-cta',
        className,
      )}
    >
      Entrar
      <ArrowRight className="size-4" aria-hidden="true" />
    </Link>
  )
}

function LandingHeader() {
  const anchors = [
    { id: 'como', label: 'Como funciona' },
    { id: 'recursos', label: 'Recursos' },
    { id: 'perguntas', label: 'Perguntas' },
  ]
  return (
    <header className="sticky top-0 z-30 bg-canvas/85 backdrop-blur-md backdrop-saturate-150">
      <div
        className={cn(
          container,
          'flex h-[68px] items-center justify-between gap-4',
        )}
      >
        <span className="flex items-center gap-2.5 text-[17px] font-semibold">
          <LogoMark />
          Roadmaps
        </span>
        <nav aria-label="Página inicial" className="flex items-center gap-1">
          {anchors.map((a) => (
            <a
              key={a.id}
              href={`#${a.id}`}
              onClick={(e) => scrollToSection(e, a.id)}
              className="hidden h-10 items-center rounded-lg px-3 font-medium text-ink-strong hover:bg-surface-hover md:inline-flex"
            >
              {a.label}
            </a>
          ))}
          <Link
            to="/login"
            className="ml-2 inline-flex h-10 items-center rounded-[10px] bg-ink px-4 font-semibold text-surface hover:opacity-90"
          >
            Entrar
          </Link>
        </nav>
      </div>
    </header>
  )
}

function Hero() {
  return (
    <section
      className={cn(
        container,
        'flex flex-col items-center gap-[22px] pt-12 pb-10 text-center sm:pt-[72px]',
      )}
    >
      <span className="inline-flex h-[30px] items-center gap-2 rounded-full border border-line bg-surface px-3.5 text-[13px] font-medium text-ink-strong">
        <span
          aria-hidden="true"
          className="size-2 rounded-full bg-chart-completed"
        />
        Para quem estuda por conta própria
      </span>
      <h1 className="max-w-[980px] text-[clamp(38px,5.4vw,62px)] leading-[1.02] font-bold tracking-[-0.04em] text-balance">
        Transforme o que você quer aprender em um plano.{' '}
        <span className="block text-ink-soft">E siga um tópico por dia.</span>
      </h1>
      <p className="max-w-[640px] text-lg leading-[1.55] text-pretty text-ink-muted sm:text-[19px]">
        Divida o assunto em módulos e tópicos, deixe o app distribuir os tópicos
        nos seus dias de estudo e registre o que fez. Você sempre sabe o que
        estudar hoje e quanto já andou.
      </p>
      <EnterLink />
      <div className="flex flex-wrap items-center justify-center gap-2">
        <span className="mr-0.5 text-[13px] text-ink-soft">
          Funciona para qualquer assunto:
        </span>
        <ul className="contents">
          {SUBJECTS.map((s) => (
            <li
              key={s}
              className="inline-flex h-[30px] items-center rounded-full border border-line bg-surface px-3 text-[13px] text-ink-strong"
            >
              {s}
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

function HowItWorks() {
  return (
    <section
      id="como"
      tabIndex={-1}
      aria-labelledby="como-titulo"
      className={cn(
        container,
        'flex scroll-mt-[68px] flex-col gap-7 pb-[88px] outline-none',
      )}
    >
      <div className="flex flex-col items-center gap-2.5 text-center">
        <span className={eyebrow}>Como funciona</span>
        <h2
          id="como-titulo"
          className="text-[32px] leading-tight font-bold tracking-[-0.03em] text-balance sm:text-[40px]"
        >
          Do “quero aprender” ao “aprendi” em quatro passos
        </h2>
      </div>
      <ol className="grid grid-cols-[repeat(auto-fit,minmax(min(240px,100%),1fr))] gap-4">
        {STEPS.map((s, i) => (
          <li
            key={s.title}
            className="flex flex-col gap-3.5 rounded-[18px] border border-line bg-surface p-[22px]"
          >
            <div aria-hidden="true">
              <StepArt step={i} />
            </div>
            <div className="flex flex-col gap-1.5">
              <span className="font-mono text-xs text-ink-soft">
                {String(i + 1).padStart(2, '0')}
              </span>
              <h3 className="text-lg font-semibold">{s.title}</h3>
              <p className="text-[15px] leading-[1.55] text-ink-muted">
                {s.text}
              </p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  )
}

const FEATURE_ART = [
  <MapPreview key="map" shadow />,
  <SessionPreview key="session" />,
  <WeekPreview key="week" shadow />,
]

const EXTRA_ICON = {
  notes: FileText,
  folder: Folder,
  search: Search,
  import: Download,
} as const

function Features() {
  return (
    <section
      id="recursos"
      tabIndex={-1}
      aria-labelledby="recursos-titulo"
      className="scroll-mt-[68px] border-y border-line bg-surface outline-none"
    >
      <div
        className={cn(
          container,
          'flex flex-col gap-16 py-16 sm:gap-[88px] sm:py-[88px]',
        )}
      >
        <div className="flex flex-col items-center gap-2.5 text-center">
          <h2
            id="recursos-titulo"
            className="text-[32px] leading-tight font-bold tracking-[-0.03em] text-balance sm:text-[40px]"
          >
            Do plano ao que você fez de verdade
          </h2>
          <p className="max-w-[620px] text-lg text-ink-muted">
            Sem planilha, sem caderno perdido, sem abas de favoritos esquecidas.
          </p>
        </div>
        {FEATURES.map((f, i) => {
          const artFirst = i % 2 === 1
          return (
            <div
              key={f.title}
              className="flex flex-wrap items-center gap-x-16 gap-y-10"
            >
              <div
                className={cn(
                  'flex min-w-0 flex-[1_1_400px] flex-col gap-3.5',
                  artFirst ? 'order-2' : 'order-1',
                )}
              >
                <span className={eyebrow}>{f.eyebrow}</span>
                <h3 className="text-[26px] leading-[1.15] font-bold tracking-[-0.02em] text-balance sm:text-[30px]">
                  {f.title}
                </h3>
                <p className="text-[17px] leading-[1.6] text-ink-muted">
                  {f.text}
                </p>
                <ul className="mt-1 flex flex-col gap-2.5 text-ink-strong">
                  {f.bullets.map((b) => (
                    <li key={b} className="flex items-start gap-2.5">
                      <span
                        aria-hidden="true"
                        className="mt-px grid size-[22px] flex-none place-items-center rounded-full bg-stage-completed text-stage-completed-fg"
                      >
                        <Check className="size-3.5" strokeWidth={2.6} />
                      </span>
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div
                aria-hidden="true"
                className={cn(
                  'min-w-0 flex-[1_1_460px] max-sm:basis-full',
                  artFirst ? 'order-1' : 'order-2',
                )}
              >
                {FEATURE_ART[i]}
              </div>
            </div>
          )
        })}
        <ul className="grid grid-cols-[repeat(auto-fit,minmax(min(240px,100%),1fr))] gap-x-8 gap-y-6 rounded-[20px] bg-canvas p-6 sm:p-8">
          {EXTRAS.map((x) => {
            const Icon = EXTRA_ICON[x.icon]
            return (
              <li key={x.title} className="flex items-start gap-3.5">
                <span
                  aria-hidden="true"
                  className="grid size-10 flex-none place-items-center rounded-xl border border-line bg-surface"
                >
                  <Icon className="size-5" strokeWidth={1.6} />
                </span>
                <span className="flex flex-col gap-1">
                  <strong className="font-semibold">{x.title}</strong>
                  <span className="text-sm leading-[1.55] text-ink-muted">
                    {x.text}
                  </span>
                </span>
              </li>
            )
          })}
        </ul>
      </div>
    </section>
  )
}

function Faq() {
  return (
    <section
      id="perguntas"
      tabIndex={-1}
      aria-labelledby="perguntas-titulo"
      className={cn(
        container,
        'flex scroll-mt-[68px] flex-wrap gap-x-16 gap-y-8 pt-[72px] pb-[88px] outline-none',
      )}
    >
      <div className="flex flex-[1_1_280px] flex-col gap-3 self-start">
        <span className={eyebrow}>Perguntas</span>
        <h2
          id="perguntas-titulo"
          className="text-[32px] leading-[1.1] font-bold tracking-[-0.03em] text-balance sm:text-[40px]"
        >
          Perguntas frequentes
        </h2>
        <p className="text-[17px] leading-[1.6] text-ink-muted">
          O essencial antes de começar. Ficou alguma dúvida? Entre e monte um
          roadmap de teste: dá para apagar depois.
        </p>
      </div>
      <Accordion
        type="single"
        collapsible
        className="flex min-w-0 flex-[2_1_520px] flex-col gap-2.5"
      >
        {FAQ.map((f, i) => (
          <AccordionItem
            key={f.q}
            value={`faq-${i}`}
            className="rounded-2xl border border-line bg-surface transition-shadow last:border-b data-[state=open]:border-line-strong data-[state=open]:shadow-card-open"
          >
            <AccordionTrigger className="group min-h-16 items-center rounded-2xl py-0 pr-4 pl-[22px] text-[17px] font-semibold text-ink hover:no-underline [&>svg:last-child]:hidden">
              {f.q}
              <span
                aria-hidden="true"
                className="grid size-8 flex-none place-items-center rounded-full bg-surface-sunken text-ink transition-transform group-data-[state=open]:rotate-45 group-data-[state=open]:bg-ink group-data-[state=open]:text-surface"
              >
                <Plus className="size-3.5" strokeWidth={2} />
              </span>
            </AccordionTrigger>
            <AccordionContent className="pr-16 pb-5 pl-[22px] text-base leading-[1.6] text-ink-muted">
              {f.a}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  )
}

function FinalCta() {
  return (
    <section
      aria-labelledby="cta-titulo"
      className={cn(container, 'pb-[72px]')}
    >
      <div className="relative flex flex-wrap items-center justify-between gap-6 overflow-hidden rounded-[28px] bg-ink px-6 py-10 text-surface sm:px-12 sm:py-14">
        <div aria-hidden="true" className="absolute inset-0 bg-dots-inverse" />
        <div className="relative flex max-w-[560px] flex-col gap-2">
          <h2
            id="cta-titulo"
            className="text-[28px] font-bold tracking-[-0.02em] text-balance sm:text-[34px]"
          >
            Seu próximo tópico está esperando
          </h2>
          <p className="text-[17px] text-line-control">
            Entre e monte o primeiro roadmap hoje.
          </p>
        </div>
        <EnterLink inverse className="relative" />
      </div>
    </section>
  )
}

/** Página pública: explica o app e leva para entrar. */
export function LandingPage() {
  return (
    <div className="min-h-dvh overflow-x-clip bg-canvas text-ink">
      <LandingHeader />
      <main>
        <Hero />
        <section aria-label="Prévia do app" className={cn(container, 'pb-20')}>
          <div aria-hidden="true">
            <AppPreview />
          </div>
        </section>
        <HowItWorks />
        <Features />
        <Faq />
        <FinalCta />
      </main>
      <footer
        className={cn(
          container,
          'flex flex-wrap justify-between gap-3 pb-10 text-[13px] text-ink-soft',
        )}
      >
        <span className="flex items-center gap-2">
          <LogoMark className="size-[18px]" />
          Roadmaps
        </span>
        <span>Feito para estudar com constância</span>
      </footer>
    </div>
  )
}
