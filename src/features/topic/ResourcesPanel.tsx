import { useForm } from '@tanstack/react-form'
import { useQuery } from '@tanstack/react-query'
import {
  BookMarked,
  BookOpen,
  ExternalLink,
  FileText,
  FolderGit2,
  GraduationCap,
  Link2,
  Pencil,
  PlayCircle,
  Trash2,
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { z } from 'zod'
import { IconButton } from '@/components/IconButton'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import type { Schemas } from '@/lib/api/client'
import { errorMessage } from '@/lib/api/errors'
import {
  resourcesQuery,
  useCreateResource,
  useDeleteResource,
  useUpdateResource,
} from '@/lib/api/queries'
import { cn } from '@/lib/utils'
import {
  KIND_LABEL,
  LOOK_LABEL,
  autoTitle,
  guessKind,
  hostOf,
  isHttpUrl,
  lookOf,
  withProtocol,
} from './resourceInfo'
import type { ResourceKind, ResourceLook } from './resourceInfo'

type Resource = Schemas['Resource']

const LOOK: Record<ResourceLook, { icon: typeof Link2; tone: string }> = {
  video: { icon: PlayCircle, tone: 'bg-danger-soft text-danger' },
  course: {
    icon: GraduationCap,
    tone: 'bg-stage-completed text-stage-completed-fg',
  },
  book: { icon: BookOpen, tone: 'bg-stage-completed text-stage-completed-fg' },
  docs: { icon: BookMarked, tone: 'bg-stage-studying text-stage-studying-fg' },
  repo: { icon: FolderGit2, tone: 'bg-surface-sunken text-ink-strong' },
  article: {
    icon: FileText,
    tone: 'bg-stage-practicing text-stage-practicing-fg',
  },
  link: { icon: Link2, tone: 'bg-surface-sunken text-ink-strong' },
}

const urlField = z
  .string()
  .trim()
  .min(1, 'Cole um link.')
  .transform(withProtocol)
  .refine(
    isHttpUrl,
    'Cole um link completo, por exemplo https://learn.microsoft.com/…',
  )

function AddForm({
  topicId,
  existing,
}: {
  topicId: number
  existing: ReadonlyArray<Resource>
}) {
  const create = useCreateResource(topicId)
  const [defaults] = useState({ url: '' })
  const form = useForm({
    defaultValues: defaults,
    validators: {
      onSubmit: z.object({
        url: urlField.refine(
          (u) => !existing.some((r) => r.url === u || r.url === `${u}/`),
          'Esse link já está nas referências.',
        ),
      }),
    },
    onSubmit: ({ value, formApi }) => {
      const url = withProtocol(value.url)
      create.mutate(
        { url, title: autoTitle(url), kind: guessKind(url) },
        {
          onSuccess: (r) => {
            toast.success(`Referência adicionada: ${r.title}`)
            formApi.reset()
          },
        },
      )
    },
  })
  return (
    <form
      noValidate
      className="flex flex-col gap-2"
      onSubmit={(e) => {
        e.preventDefault()
        void form.handleSubmit()
      }}
    >
      <form.Field name="url">
        {(field) => {
          const err =
            field.state.meta.errors[0]?.message ??
            (create.error ? errorMessage(create.error) : null)
          return (
            <>
              <div className="flex flex-wrap gap-2">
                <label htmlFor="ref-url" className="sr-only">
                  Link da referência
                </label>
                <div className="relative min-w-0 flex-[1_1_240px]">
                  <Link2
                    className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-ink-muted"
                    aria-hidden="true"
                  />
                  <Input
                    id="ref-url"
                    type="url"
                    inputMode="url"
                    autoComplete="off"
                    value={field.state.value}
                    onChange={(e) => {
                      field.handleChange(e.target.value)
                      create.reset()
                    }}
                    placeholder="Cole um link: documentação, vídeo, artigo, repositório…"
                    className="h-11 pl-10"
                    aria-invalid={err ? true : undefined}
                    aria-describedby={err ? 'ref-url-err' : undefined}
                  />
                </div>
                <Button
                  type="submit"
                  size="lg"
                  className="h-11"
                  disabled={!field.state.value.trim() || create.isPending}
                >
                  {create.isPending ? 'Adicionando…' : 'Adicionar'}
                </Button>
              </div>
              {err && (
                <p
                  id="ref-url-err"
                  role="alert"
                  className="text-sm text-danger"
                >
                  {err}
                </p>
              )}
            </>
          )
        }}
      </form.Field>
    </form>
  )
}

const editSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, 'Dê um título.')
    .max(200, 'No máximo 200 caracteres'),
  url: urlField,
  kind: z.enum(['article', 'video', 'book', 'course', 'other']),
})

function EditForm({
  resource,
  topicId,
  onDone,
}: {
  resource: Resource
  topicId: number
  onDone: () => void
}) {
  const update = useUpdateResource(topicId)
  const [defaults] = useState({
    title: resource.title,
    url: resource.url,
    kind: resource.kind,
  })
  const form = useForm({
    defaultValues: defaults,
    validators: { onSubmit: editSchema },
    onSubmit: ({ value }) =>
      update.mutate(
        {
          resourceId: resource.id,
          body: {
            title: value.title.trim(),
            url: withProtocol(value.url),
            kind: value.kind,
          },
        },
        {
          onSuccess: () => {
            toast.success('Referência atualizada')
            onDone()
          },
        },
      ),
  })
  const titleRef = useRef<HTMLInputElement>(null)
  useEffect(() => titleRef.current?.focus(), [])
  const id = `ref-${resource.id}`
  return (
    <form
      noValidate
      className="flex min-w-0 flex-1 flex-col gap-2"
      onSubmit={(e) => {
        e.preventDefault()
        void form.handleSubmit()
      }}
    >
      {(
        [
          ['title', 'Título', 'text'],
          ['url', 'Link', 'url'],
        ] as const
      ).map(([name, label, type]) => (
        <form.Field key={name} name={name}>
          {(field) => {
            const err = field.state.meta.errors[0]?.message
            return (
              <div className="flex flex-col gap-1">
                <label
                  htmlFor={`${id}-${name}`}
                  className="text-xs font-medium text-ink-muted"
                >
                  {label}
                </label>
                <Input
                  id={`${id}-${name}`}
                  type={type}
                  value={field.state.value}
                  maxLength={name === 'title' ? 200 : undefined}
                  ref={name === 'title' ? titleRef : undefined}
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') {
                      e.preventDefault()
                      onDone()
                    }
                  }}
                  onChange={(e) => field.handleChange(e.target.value)}
                  aria-invalid={err ? true : undefined}
                  aria-describedby={err ? `${id}-${name}-err` : undefined}
                />
                {err && (
                  <span
                    id={`${id}-${name}-err`}
                    className="text-sm text-danger"
                  >
                    {err}
                  </span>
                )}
              </div>
            )
          }}
        </form.Field>
      ))}
      <form.Field name="kind">
        {(field) => (
          <div className="flex flex-col gap-1">
            <label
              htmlFor={`${id}-kind`}
              className="text-xs font-medium text-ink-muted"
            >
              Tipo
            </label>
            <select
              id={`${id}-kind`}
              value={field.state.value}
              onChange={(e) =>
                field.handleChange(e.target.value as ResourceKind)
              }
              className="h-9 max-w-[220px] rounded-md border border-line-control bg-surface px-2 text-sm"
            >
              {(Object.keys(KIND_LABEL) as Array<ResourceKind>).map((k) => (
                <option key={k} value={k}>
                  {KIND_LABEL[k]}
                </option>
              ))}
            </select>
          </div>
        )}
      </form.Field>
      {update.error && (
        <p role="alert" className="text-sm text-danger">
          {errorMessage(update.error)}
        </p>
      )}
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={update.isPending}>
          {update.isPending ? 'Salvando…' : 'Salvar'}
        </Button>
        <Button type="button" size="sm" variant="outline" onClick={onDone}>
          Cancelar
        </Button>
      </div>
    </form>
  )
}

function ResourceItem({
  resource: r,
  topicId,
}: {
  resource: Resource
  topicId: number
}) {
  const remove = useDeleteResource(topicId)
  const [editing, setEditing] = useState(false)
  const [confirm, setConfirm] = useState(false)
  const look = lookOf(r)
  const Icon = LOOK[look].icon
  return (
    <li
      className={cn(
        'flex items-start gap-3 rounded-xl border border-line p-3',
        editing && 'border-ink',
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          'grid size-9 flex-none place-items-center rounded-lg',
          LOOK[look].tone,
        )}
      >
        <Icon className="size-4" />
      </span>
      {editing ? (
        <EditForm
          resource={r}
          topicId={topicId}
          onDone={() => setEditing(false)}
        />
      ) : (
        <>
          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
            <a
              href={r.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex max-w-full items-center gap-1.5 font-medium text-ink hover:underline"
            >
              <span className="truncate">{r.title}</span>
              <ExternalLink
                className="size-3.5 flex-none text-ink-muted"
                aria-hidden="true"
              />
              <span className="sr-only">(abre em nova aba)</span>
            </a>
            <span className="truncate text-[13px] text-ink-muted">
              {LOOK_LABEL[look]} · {hostOf(r.url)}
            </span>
          </div>
          <div className="flex flex-none items-center gap-1">
            <IconButton
              label={`Editar ${r.title}`}
              size="sm"
              onClick={() => setEditing(true)}
            >
              <Pencil />
            </IconButton>
            {confirm ? (
              <Button
                size="sm"
                variant="destructive"
                aria-label={`Confirmar remoção de ${r.title}`}
                disabled={remove.isPending}
                onBlur={() => setConfirm(false)}
                onClick={() =>
                  remove.mutate(r.id, {
                    onSuccess: () =>
                      toast.success(`Referência removida: ${r.title}`),
                    onError: (e) => {
                      toast.error(errorMessage(e))
                      setConfirm(false)
                    },
                  })
                }
              >
                <Trash2 aria-hidden="true" />
                Remover?
              </Button>
            ) : (
              <IconButton
                label={`Remover ${r.title}`}
                size="sm"
                onClick={() => setConfirm(true)}
              >
                <Trash2 />
              </IconButton>
            )}
          </div>
        </>
      )}
    </li>
  )
}

/** Aba Referências do tópico: colar um link, ver por tipo, editar e remover. */
export function ResourcesPanel({ topicId }: { topicId: number }) {
  const q = useQuery(resourcesQuery(topicId))
  const list = q.data ?? []
  return (
    <section
      aria-labelledby="refs-title"
      className="flex flex-col gap-4 rounded-2xl border border-line bg-surface p-4 sm:p-5"
    >
      <div className="flex items-baseline justify-between gap-3">
        <h2 id="refs-title" className="text-lg font-semibold">
          Referências
        </h2>
        {q.data && (
          <span className="text-[13px] text-ink-muted">
            {list.length} {list.length === 1 ? 'link' : 'links'}
          </span>
        )}
      </div>
      <AddForm topicId={topicId} existing={list} />
      {q.isPending ? (
        <div role="status" aria-label="Carregando referências">
          <Skeleton className="h-16 w-full" />
        </div>
      ) : q.error ? (
        <div
          role="alert"
          className="flex flex-wrap items-center gap-3 rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger"
        >
          Não foi possível carregar as referências. {errorMessage(q.error)}
          <Button size="sm" variant="outline" onClick={() => void q.refetch()}>
            Tentar de novo
          </Button>
        </div>
      ) : list.length === 0 ? (
        <p className="rounded-xl border border-dashed border-line-control px-4 py-5 text-center text-ink-muted">
          Nenhuma referência ainda. Cole acima o link de uma documentação, vídeo
          ou artigo sobre o assunto.
        </p>
      ) : (
        <ul aria-label="Links de estudo" className="flex flex-col gap-2">
          {list.map((r) => (
            <ResourceItem key={r.id} resource={r} topicId={topicId} />
          ))}
        </ul>
      )}
    </section>
  )
}
