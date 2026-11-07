import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import type { DragEndEvent, DragOverEvent } from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { useForm, useStore } from '@tanstack/react-form'
import { Link } from '@tanstack/react-router'
import { FileJson, Plus } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Breadcrumbs } from '@/components/Breadcrumbs'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { ImportDialog } from './ImportDialog'
import { ModuleCard } from './ModuleCard'
import {
  alternativeTarget,
  emptyModule,
  emptyTopic,
  fieldErrors,
} from './model'
import type { BuilderModule, BuilderValues, ImportProblem } from './model'
import {
  counts,
  findTopic,
  insertTopic,
  moveModule,
  moveTopic,
  removeTopic,
  updateModule,
  updateTopic,
} from './ops'

export type BuilderDestination =
  | { kind: 'new' }
  | {
      kind: 'existing'
      id: number
      name: string
      moduleTitles: ReadonlyArray<string>
    }

export type BuilderPageProps = {
  destination: BuilderDestination
  initial?: Partial<BuilderValues>
  submitting?: boolean
  /** Erro da API ao salvar (mensagem pronta). */
  submitError?: string | null
  onSubmit: (values: BuilderValues) => void | Promise<void>
  onCancel: () => void
  /** Valida o JSON (local + dry run) e devolve os módulos para o editor, ou os problemas. */
  onImport: (
    text: string,
  ) => Promise<
    | { ok: true; modules: Array<BuilderModule>; name?: string; goal?: string }
    | { ok: false; problems: Array<ImportProblem> }
  >
  /** Avisa o pai se há alterações não salvas (para o aviso ao sair). */
  onDirtyChange?: (dirty: boolean) => void
}

// Constante: um `{}` novo a cada leitura faria o useStore renderizar sem parar.
const NO_ERRORS: Record<string, string> = {}

const plural = (n: number, one: string, many: string) =>
  `${n} ${n === 1 ? one : many}`

/** Criador de roadmap: módulos e tópicos de uma vez, com arrastar, atalhos e importação. */
export function BuilderPage({
  destination,
  initial,
  submitting = false,
  submitError,
  onSubmit,
  onCancel,
  onImport,
  onDirtyChange,
}: BuilderPageProps) {
  const isNew = destination.kind === 'new'
  const lastExisting =
    destination.kind === 'existing'
      ? (destination.moduleTitles.at(-1) ?? null)
      : null
  // Os valores iniciais são criados uma vez só: um módulo novo (com chave nova)
  // a cada render faria o formulário se reiniciar sem parar.
  const [defaultValues] = useState<BuilderValues>(() => ({
    name: initial?.name ?? '',
    goal: initial?.goal ?? '',
    modules: initial?.modules ?? [emptyModule()],
  }))
  const form = useForm({
    defaultValues,
    validators: {
      onSubmit: ({ value }) => {
        const errors = fieldErrors(value, isNew)
        return Object.keys(errors).length ? errors : undefined
      },
    },
    onSubmit: ({ value }) => onSubmit(value),
  })
  const modules = useStore(form.store, (s) => s.values.modules)
  const isDirty = useStore(form.store, (s) => s.isDirty)
  const errors = useStore(form.store, (s) => s.errorMap.onSubmit ?? NO_ERRORS)
  const attempted = useStore(form.store, (s) => s.submissionAttempts > 0)
  const [importOpen, setImportOpen] = useState(false)
  const [importMsg, setImportMsg] = useState<string | null>(null)

  useEffect(() => onDirtyChange?.(isDirty), [isDirty, onDirtyChange])

  /** Foca o campo de um módulo/tópico depois que o React desenhar a mudança. */
  const setFocusKey = (key: string) =>
    requestAnimationFrame(() =>
      document.querySelector<HTMLInputElement>(`[data-bk="${key}"]`)?.focus(),
    )

  const set = (next: Array<BuilderModule>) => {
    form.setFieldValue('modules', next)
    // Depois da primeira tentativa, revalida enquanto edita.
    if (attempted) void form.validate('submit')
  }

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

  const onDragOver = ({ active, over }: DragOverEvent) => {
    const a = String(active.id)
    if (!a.startsWith('t:') || !over) return
    const from = findTopic(modules, a.slice(2))
    const o = String(over.id)
    const to = o.startsWith('t:')
      ? findTopic(modules, o.slice(2))
      : o.startsWith('drop:') || o.startsWith('m:')
        ? ([
            modules.findIndex((m) => m.key === o.slice(o.indexOf(':') + 1)),
            -1,
          ] as [number, number])
        : null
    if (!from || !to || to[0] < 0 || from[0] === to[0]) return
    set(
      moveTopic(
        modules,
        from[0],
        from[1],
        to[0],
        to[1] < 0 ? modules[to[0]]!.topics.length : to[1],
      ),
    )
  }

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over) return
    const a = String(active.id)
    const o = String(over.id)
    if (a.startsWith('m:') && o.startsWith('m:')) {
      const from = modules.findIndex((m) => `m:${m.key}` === a)
      const to = modules.findIndex((m) => `m:${m.key}` === o)
      if (from !== to) set(moveModule(modules, from, to))
    } else if (a.startsWith('t:') && o.startsWith('t:')) {
      const from = findTopic(modules, a.slice(2))
      const to = findTopic(modules, o.slice(2))
      if (from && to && from[0] === to[0] && from[1] !== to[1])
        set(moveTopic(modules, from[0], from[1], to[0], to[1]))
    }
  }

  const c = counts(modules)
  const anchorOptions =
    destination.kind === 'existing' ? destination.moduleTitles : null
  const title = isNew ? 'Novo roadmap' : 'Adicionar módulos e tópicos'
  const submitLabel = isNew
    ? 'Criar roadmap'
    : `Adicionar a ${destination.name}`
  const errorCount = Object.keys(errors).length

  return (
    <form
      noValidate
      onSubmit={(e) => {
        e.preventDefault()
        void form.handleSubmit()
      }}
      className="mx-auto flex w-full max-w-[1264px] flex-col gap-5 px-4 pt-7 pb-16 sm:px-8"
    >
      <Breadcrumbs
        items={[
          { label: 'Meus roadmaps', link: { to: '/roadmaps' } },
          ...(destination.kind === 'existing'
            ? [
                {
                  label: destination.name,
                  link: {
                    to: '/roadmaps/$roadmapId' as const,
                    params: { roadmapId: String(destination.id) },
                  },
                },
              ]
            : []),
          { label: title },
        ]}
      />
      <div className="flex flex-wrap items-start gap-6">
        <div className="flex min-w-0 flex-[1_1_600px] flex-col gap-4">
          <section
            aria-label="Roadmap"
            className="flex flex-col gap-1.5 rounded-2xl border border-line bg-surface px-5 py-6 sm:px-[30px]"
          >
            {isNew ? (
              <>
                <h1 className="sr-only">Novo roadmap</h1>
                <form.Field name="name">
                  {(field) => {
                    const e = errors.name
                    return (
                      <>
                        <label htmlFor="b-name" className="sr-only">
                          Nome do roadmap (obrigatório)
                        </label>
                        <input
                          id="b-name"
                          value={field.state.value}
                          onChange={(ev) => {
                            field.handleChange(ev.target.value)
                            if (attempted) void form.validate('submit')
                          }}
                          onBlur={field.handleBlur}
                          maxLength={120}
                          placeholder="Nome do roadmap"
                          aria-invalid={e ? true : undefined}
                          aria-describedby={e ? 'b-name-err' : undefined}
                          className={cn(
                            'h-[52px] w-full border-b-2 border-transparent bg-transparent px-0.5 text-[26px] font-semibold tracking-[-0.02em] text-ink outline-none placeholder:text-ink-faint focus-visible:border-ink sm:text-[30px]',
                            e && 'border-danger',
                          )}
                        />
                        {e && (
                          <span id="b-name-err" className="text-sm text-danger">
                            {e}
                          </span>
                        )}
                      </>
                    )
                  }}
                </form.Field>
                <form.Field name="goal">
                  {(field) => (
                    <>
                      <label htmlFor="b-desc" className="sr-only">
                        Objetivo (opcional)
                      </label>
                      <input
                        id="b-desc"
                        value={field.state.value}
                        onChange={(ev) => field.handleChange(ev.target.value)}
                        maxLength={300}
                        placeholder="Qual é o objetivo? (opcional)"
                        className="h-[34px] w-full bg-transparent px-0.5 text-base text-ink-muted outline-none placeholder:text-ink-faint focus-visible:text-ink"
                      />
                    </>
                  )}
                </form.Field>
              </>
            ) : (
              <>
                <span className="text-xs font-semibold tracking-[0.04em] text-ink-soft uppercase">
                  Adicionando a
                </span>
                <h1 className="text-[30px] font-semibold tracking-[-0.02em]">
                  {destination.name}
                </h1>
                <p className="text-ink-muted">
                  Os módulos novos entram no final. Para colocar um no meio do
                  caminho ou como alternativa a outro, use o menu ⋯ do módulo.
                </p>
              </>
            )}
          </section>

          <section aria-labelledby="b-struct" className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 px-1">
              <h2 id="b-struct" className="text-lg font-semibold">
                Módulos e tópicos
              </h2>
              <button
                type="button"
                onClick={() => setImportOpen(true)}
                className="inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-sm font-medium text-link hover:bg-surface-hover"
              >
                <FileJson className="size-4" aria-hidden="true" />
                Importar JSON
              </button>
            </div>
            {importMsg && (
              <p
                role="status"
                className="rounded-[10px] bg-stage-completed px-3.5 py-2.5 text-sm font-medium text-stage-completed-fg"
              >
                {importMsg}
              </p>
            )}
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragOver={onDragOver}
              onDragEnd={onDragEnd}
              accessibility={{
                screenReaderInstructions: {
                  draggable:
                    'Para mover, aperte espaço ou Enter, use as setas e aperte espaço de novo para soltar. Esc cancela.',
                },
                announcements: {
                  onDragStart: () => 'Pegou o item.',
                  onDragOver: () => 'Movendo.',
                  onDragEnd: () => 'Soltou o item.',
                  onDragCancel: () => 'Movimento cancelado.',
                },
              }}
            >
              <SortableContext
                items={modules.map((m) => `m:${m.key}`)}
                strategy={verticalListSortingStrategy}
              >
                {modules.map((m, i) => (
                  <ModuleCard
                    key={m.key}
                    module={m}
                    index={i}
                    total={modules.length}
                    alternativeOf={
                      m.kind === 'alternative' && !m.alternativeTo
                        ? alternativeTarget(modules, i, lastExisting)
                        : null
                    }
                    canBeAlternative={!isNew || i > 0}
                    anchorOptions={anchorOptions}
                    errors={errors}
                    onChange={(patch) => set(updateModule(modules, i, patch))}
                    onMove={(d) => {
                      set(moveModule(modules, i, i + d))
                      setFocusKey(m.key)
                    }}
                    onRemove={() => set(modules.filter((_x, k) => k !== i))}
                    onTopicChange={(j, patch) =>
                      set(updateTopic(modules, i, j, patch))
                    }
                    onTopicInsert={(at) => {
                      const t = emptyTopic()
                      set(insertTopic(modules, i, at, t))
                      setFocusKey(t.key)
                    }}
                    onTopicRemove={(j, focusPrev) => {
                      if (focusPrev)
                        setFocusKey(j > 0 ? m.topics[j - 1]!.key : m.key)
                      set(removeTopic(modules, i, j))
                    }}
                    onTopicMove={(j, d) => {
                      const key = m.topics[j]!.key
                      if (j + d >= 0 && j + d < m.topics.length)
                        set(moveTopic(modules, i, j, i, j + d))
                      else if (d < 0 && i > 0)
                        set(
                          moveTopic(
                            modules,
                            i,
                            j,
                            i - 1,
                            modules[i - 1]!.topics.length,
                          ),
                        )
                      else if (d > 0 && i < modules.length - 1)
                        set(moveTopic(modules, i, j, i + 1, 0))
                      setFocusKey(key)
                    }}
                  />
                ))}
              </SortableContext>
            </DndContext>
            <button
              type="button"
              onClick={() => {
                const nm = emptyModule()
                set([...modules, nm])
                setFocusKey(nm.key)
              }}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-[14px] border-[1.5px] border-dashed border-line-control font-medium text-ink-muted hover:border-ink-faint hover:bg-surface hover:text-ink"
            >
              <Plus className="size-4" aria-hidden="true" />
              Adicionar módulo
            </button>
            <p className="px-1 text-[13px] leading-normal text-ink-soft">
              Arraste pela alça ⋮⋮ para reordenar módulos e tópicos (ou Alt +
              ↑/↓). Enter cria o próximo tópico; Backspace num tópico vazio
              apaga. Opcional e caminho alternativo ficam no menu ⋯ do módulo.
            </p>
          </section>
        </div>

        <aside className="flex min-w-0 flex-[1_1_300px] flex-col gap-4 lg:sticky lg:top-24">
          <section
            aria-labelledby="b-sum"
            className="flex flex-col gap-4 rounded-2xl border border-line bg-surface p-[22px]"
          >
            <h2 id="b-sum" className="text-lg font-semibold">
              Resumo
            </h2>
            <dl className="grid grid-cols-3 gap-3">
              {[
                { n: c.modules, label: c.modules === 1 ? 'módulo' : 'módulos' },
                {
                  n: c.topics,
                  label: `${c.topics === 1 ? 'tópico' : 'tópicos'}${c.optional ? ` · ${c.optional} opc.` : ''}`,
                },
                { n: c.dated, label: 'com data' },
              ].map((s) => (
                <div key={s.label} className="flex flex-col">
                  <dt className="order-2 text-xs text-ink-soft">{s.label}</dt>
                  <dd className="font-mono text-[26px] leading-tight font-medium">
                    {s.n}
                  </dd>
                </div>
              ))}
            </dl>
            {(submitError || (attempted && errorCount > 0)) && (
              <p
                role="alert"
                className="rounded-[10px] bg-danger-soft px-3 py-2.5 text-sm text-danger"
              >
                {submitError ??
                  `Revise ${plural(errorCount, 'campo destacado', 'campos destacados')} antes de salvar.`}
              </p>
            )}
            <div className="flex flex-col gap-2">
              <Button
                type="submit"
                size="lg"
                disabled={submitting}
                className="h-12 text-base"
              >
                {submitting ? 'Salvando…' : submitLabel}
              </Button>
              <Button type="button" variant="ghost" onClick={onCancel}>
                Cancelar
              </Button>
            </div>
          </section>
          {isNew && (
            <p className="px-1 text-[13px] text-ink-soft">
              Quer começar de um roadmap pronto?{' '}
              <button
                type="button"
                onClick={() => setImportOpen(true)}
                className="font-medium text-link underline underline-offset-2"
              >
                Importe um JSON
              </button>
              . Para adicionar módulos a um roadmap que já existe, abra o
              roadmap e use{' '}
              <Link
                to="/roadmaps"
                className="font-medium text-link underline underline-offset-2"
              >
                Meus roadmaps
              </Link>
              .
            </p>
          )}
        </aside>
      </div>

      <ImportDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        onImport={async (text, source) => {
          const r = await onImport(text)
          if (!r.ok) return r.problems
          set(r.modules)
          if (isNew && r.name && !form.getFieldValue('name').trim())
            form.setFieldValue('name', r.name)
          if (isNew && r.goal && !form.getFieldValue('goal').trim())
            form.setFieldValue('goal', r.goal)
          const cc = counts(r.modules)
          setImportMsg(
            `Importei ${plural(cc.modules, 'módulo', 'módulos')} e ${plural(cc.topics, 'tópico', 'tópicos')} de ${source}. Revise e salve.`,
          )
          return null
        }}
      />
    </form>
  )
}
