/**
 * Modelo do criador de roadmap: o que o editor guarda, a validação (Zod),
 * a conversão para o contrato (`ImportModule`) e a leitura do JSON importado.
 */
import { z } from 'zod'
import type { Schemas } from '@/lib/api/client'

export type BuilderTopic = {
  key: string
  title: string
  isOptional: boolean
  date: string
}

/** Âncora do módulo: um módulo do editor (`key:`) ou um que já existe no roadmap (`title:`). */
export type Anchor = `key:${string}` | `title:${string}`

export type BuilderModule = {
  key: string
  title: string
  kind: 'required' | 'optional' | 'alternative'
  /** Só quando adiciona a um roadmap existente: entra logo depois deste. */
  after: Anchor | null
  /** Com `kind: 'alternative'`: caminho alternativo a este. */
  alternativeTo: Anchor | null
  topics: Array<BuilderTopic>
}

export type BuilderValues = {
  name: string
  goal: string
  modules: Array<BuilderModule>
}

let seq = 0
export const newKey = () => `k${Date.now().toString(36)}${(++seq).toString(36)}`

export const emptyTopic = (): BuilderTopic => ({
  key: newKey(),
  title: '',
  isOptional: false,
  date: '',
})

export const emptyModule = (): BuilderModule => ({
  key: newKey(),
  title: '',
  kind: 'required',
  after: null,
  alternativeTo: null,
  topics: [emptyTopic()],
})

const norm = (t: string) => t.trim().toLocaleLowerCase('pt-BR')

/** Validação do editor. `isNew` exige o nome do roadmap. */
export const builderSchema = (isNew: boolean) =>
  z
    .object({
      name: isNew
        ? z.string().trim().min(1, 'Dê um nome ao roadmap').max(120)
        : z.string(),
      goal: z.string().max(500),
      modules: z.array(
        z.object({
          key: z.string(),
          title: z.string().trim().min(1, 'Dê um nome ao módulo').max(120),
          kind: z.enum(['required', 'optional', 'alternative']),
          after: z.string().nullable(),
          alternativeTo: z.string().nullable(),
          topics: z.array(
            z.object({
              key: z.string(),
              title: z.string().max(160),
              isOptional: z.boolean(),
              date: z.string(),
            }),
          ),
        }),
      ),
    })
    .superRefine((v, ctx) => {
      const seen = new Map<string, number>()
      v.modules.forEach((m, i) => {
        const t = norm(m.title)
        if (t && seen.has(t))
          ctx.addIssue({
            code: 'custom',
            path: ['modules', i, 'title'],
            message: 'Já existe um módulo com esse nome',
          })
        seen.set(t, i)
        if (m.kind === 'alternative' && !alternativeTarget(v.modules, i, null))
          ctx.addIssue({
            code: 'custom',
            path: ['modules', i, 'alternativeTo'],
            message: 'Escolha de qual módulo este é alternativa',
          })
        const topics = new Set<string>()
        m.topics.forEach((tp, j) => {
          const tt = norm(tp.title)
          if (!tt) return
          if (topics.has(tt))
            ctx.addIssue({
              code: 'custom',
              path: ['modules', i, 'topics', j, 'title'],
              message: 'Tópico repetido neste módulo',
            })
          topics.add(tt)
        })
      })
    })

/** Erros do Zod por caminho do campo (`modules[0].title`), como o TanStack Form usa. */
export function fieldErrors(
  values: BuilderValues,
  isNew: boolean,
): Record<string, string> {
  const r = builderSchema(isNew).safeParse(values)
  if (r.success) return {}
  const out: Record<string, string> = {}
  for (const issue of r.error.issues) {
    const path = issue.path
      .map((p, i) =>
        typeof p === 'number' ? `[${p}]` : i ? `.${String(p)}` : String(p),
      )
      .join('')
    out[path] ??= issue.message
  }
  return out
}

export function anchorTitle(
  anchor: string | null,
  modules: ReadonlyArray<Pick<BuilderModule, 'key' | 'title'>>,
): string | null {
  if (!anchor) return null
  if (anchor.startsWith('title:')) return anchor.slice(6)
  return modules.find((m) => `key:${m.key}` === anchor)?.title.trim() || null
}

/**
 * De qual módulo o i-ésimo é alternativa: o escolhido no menu ou, sem escolha,
 * o módulo anterior que não é opcional (ou o último do roadmap existente).
 */
export function alternativeTarget(
  modules: ReadonlyArray<{
    key: string
    title: string
    kind: string
    alternativeTo: string | null
  }>,
  i: number,
  lastExisting: string | null,
): string | null {
  const m = modules[i]
  if (!m) return null
  if (m.alternativeTo) return anchorTitle(m.alternativeTo, modules)
  for (let k = i - 1; k >= 0; k--)
    if (modules[k]!.kind !== 'optional') return modules[k]!.title.trim() || null
  return lastExisting
}

/** Editor → contrato. Tópicos sem título são ignorados. */
export function toImportModules(
  modules: ReadonlyArray<BuilderModule>,
  lastExisting: string | null = null,
): Array<Schemas['ImportModule']> {
  return modules.map((m, i) => {
    const after = anchorTitle(m.after, modules)
    const alt =
      m.kind === 'alternative'
        ? alternativeTarget(modules, i, lastExisting)
        : null
    return {
      title: m.title.trim(),
      ...(m.kind === 'optional' ? { kind: 'optional' as const } : {}),
      ...(after ? { after: [after] } : {}),
      ...(alt ? { alternativeTo: alt } : {}),
      topics: m.topics
        .filter((t) => t.title.trim())
        .map((t) => ({
          title: t.title.trim(),
          ...(t.isOptional ? { isOptional: true } : {}),
          ...(t.date ? { date: t.date } : {}),
        })),
    }
  })
}

/** Contrato → editor (depois de importar um JSON). */
export function fromImportModules(
  modules: ReadonlyArray<Schemas['ImportModule']>,
  existingTitles: ReadonlyArray<string>,
): Array<BuilderModule> {
  const withKeys = modules.map((m) => ({ m, key: newKey() }))
  const anchor = (title: string | undefined): Anchor | null => {
    if (!title) return null
    const inFile = withKeys.find((x) => norm(x.m.title) === norm(title))
    if (inFile) return `key:${inFile.key}`
    const ex = existingTitles.find((t) => norm(t) === norm(title))
    return ex ? `title:${ex}` : `title:${title}`
  }
  return withKeys.map(({ m, key }) => ({
    key,
    title: m.title,
    kind: m.alternativeTo
      ? 'alternative'
      : m.kind === 'optional'
        ? 'optional'
        : 'required',
    after: anchor(m.after?.[0]),
    alternativeTo: anchor(m.alternativeTo),
    topics: (m.topics ?? []).map((t) => ({
      key: newKey(),
      title: t.title,
      isOptional: !!t.isOptional,
      date: t.date ?? '',
    })),
  }))
}

/* ---------- JSON importado ---------- */

export type ParsedImport = {
  name?: string
  goal?: string
  modules: Array<Schemas['ImportModule']>
}

export type ImportProblem = { text: string; line?: number }

const KEYS: Record<string, string> = {
  nome: 'name',
  objetivo: 'goal',
  modulos: 'modules',
  módulos: 'modules',
  titulo: 'title',
  título: 'title',
  descricao: 'description',
  descrição: 'description',
  tipo: 'kind',
  depoisDe: 'after',
  alternativaA: 'alternativeTo',
  topicos: 'topics',
  tópicos: 'topics',
  opcional: 'isOptional',
  dataPrevista: 'date',
}
const KINDS: Record<string, string> = {
  obrigatorio: 'required',
  obrigatório: 'required',
  opcional: 'optional',
  alternativo: 'alternative',
}

function renameKeys(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(renameKeys)
  if (value && typeof value === 'object')
    return Object.fromEntries(
      Object.entries(value).map(([k, v]) => [KEYS[k] ?? k, renameKeys(v)]),
    )
  return value
}

const importSchema = z.object({
  name: z.string().optional(),
  goal: z.string().optional(),
  modules: z
    .array(
      z.object({
        title: z.string({ error: 'Falta o título do módulo' }),
        description: z.string().optional(),
        kind: z
          .string()
          .transform((k) => KINDS[k] ?? k)
          .pipe(z.enum(['required', 'optional', 'alternative']))
          .optional(),
        after: z
          .union([z.string(), z.array(z.string())])
          .transform((a) => (Array.isArray(a) ? a : [a]))
          .optional(),
        alternativeTo: z.string().optional(),
        topics: z
          .array(
            z.union([
              z.string().transform((title) => ({ title })),
              z.object({
                title: z.string({ error: 'Falta o título do tópico' }),
                isOptional: z.boolean().optional(),
                date: z
                  .string()
                  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Data no formato aaaa-mm-dd')
                  .optional(),
              }),
            ]),
          )
          .optional(),
      }),
      { error: 'Falta a lista de módulos ("modulos")' },
    )
    .min(1, 'O arquivo não tem nenhum módulo'),
})

/** Linha (1…) em que aparece o n-ésimo módulo, para apontar o erro. */
export function lineOfModule(text: string, index: number): number | undefined {
  const lines = text.split('\n')
  const start = lines.findIndex((l) =>
    /"(modules|modulos|módulos)"\s*:/.test(l),
  )
  if (start < 0) return undefined
  let found = -1
  let depth = 0
  for (let i = start; i < lines.length; i++) {
    const line = lines[i]!
    for (const ch of line) {
      if (ch === '{') {
        depth += 1
        if (depth === 1 && ++found === index) return i + 1
      } else if (ch === '}') depth -= 1
    }
  }
  return undefined
}

function lineOfOffset(text: string, offset: number) {
  return text.slice(0, offset).split('\n').length
}

/** Lê o JSON (chaves em português ou inglês) e diz os problemas com a linha. */
export function parseImportJson(
  text: string,
):
  | { ok: true; value: ParsedImport }
  | { ok: false; problems: Array<ImportProblem> } {
  if (!text.trim())
    return {
      ok: false,
      problems: [{ text: 'Cole o conteúdo de um arquivo JSON.' }],
    }
  let raw: unknown
  try {
    raw = JSON.parse(text)
  } catch (e) {
    const m = /position (\d+)/.exec(String(e))
    return {
      ok: false,
      problems: [
        {
          text: 'O conteúdo não é um JSON válido.',
          ...(m ? { line: lineOfOffset(text, Number(m[1])) } : {}),
        },
      ],
    }
  }
  const r = importSchema.safeParse(renameKeys(raw))
  if (r.success) return { ok: true, value: r.data }
  return {
    ok: false,
    problems: r.error.issues.map((issue) => {
      const mi =
        issue.path[0] === 'modules' && typeof issue.path[1] === 'number'
          ? issue.path[1]
          : null
      return {
        text: issue.message,
        ...(mi !== null ? { line: lineOfModule(text, mi) } : {}),
      }
    }),
  }
}

/** Erros da API (`modules[2].after[0]`) → mensagens com a linha do módulo no texto. */
export function apiProblems(
  errors: Record<string, Array<string>>,
  text: string,
  modules: ReadonlyArray<Schemas['ImportModule']>,
): Array<ImportProblem> {
  return Object.entries(errors).flatMap(([path, msgs]) => {
    const mi = /^modules\[(\d+)\]/.exec(path)
    const i = mi ? Number(mi[1]) : null
    const title = i !== null ? modules[i]?.title : undefined
    return msgs.map((m) => ({
      text: title ? `${title}: ${m}` : m,
      ...(i !== null ? { line: lineOfModule(text, i) } : {}),
    }))
  })
}
