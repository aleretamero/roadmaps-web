import type { Editor } from '@tiptap/core'
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight'
import { Placeholder } from '@tiptap/extensions'
import { Markdown } from '@tiptap/markdown'
import { EditorContent, useEditor, useEditorState } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { common, createLowlight } from 'lowlight'
import { useEffect, useRef, useState } from 'react'
import { InfoTooltip } from '@/components/InfoTooltip'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

const lowlight = createLowlight(common)

export const CODE_LANGUAGES = [
  ['sql', 'SQL'],
  ['csharp', 'C#'],
  ['javascript', 'JavaScript'],
  ['typescript', 'TypeScript'],
  ['bash', 'Bash'],
  ['python', 'Python'],
  ['json', 'JSON'],
  ['yaml', 'YAML'],
  ['plaintext', 'Texto'],
] as const

/** Extensões do editor e da leitura: o mesmo esquema nos dois, então o que sai é o que entrou. */
export function noteExtensions(opts: { placeholder?: string } = {}) {
  return [
    StarterKit.configure({
      codeBlock: false,
      link: { openOnClick: false, autolink: true, defaultProtocol: 'https' },
    }),
    CodeBlockLowlight.configure({ lowlight, defaultLanguage: 'plaintext' }),
    Markdown,
    ...(opts.placeholder
      ? [Placeholder.configure({ placeholder: opts.placeholder })]
      : []),
  ]
}

/** Link só com http(s) ou e-mail; o resto é recusado. */
export function safeLink(raw: string): string | null {
  const v = raw.trim()
  if (!v) return null
  const withProto = /^[a-z][a-z0-9+.-]*:/i.test(v) ? v : `https://${v}`
  try {
    const u = new URL(withProto)
    return u.protocol === 'http:' ||
      u.protocol === 'https:' ||
      u.protocol === 'mailto:'
      ? u.href
      : null
  } catch {
    return null
  }
}

const SHORTCUTS = [
  ['# , ## , ###', 'Títulos'],
  ['- ou *', 'Lista'],
  ['1.', 'Lista numerada'],
  ['>', 'Citação'],
  ['```sql', 'Bloco de código'],
  ['Ctrl+B / Ctrl+I', 'Negrito / itálico'],
  ['`código`', 'Código no texto'],
  ['Ctrl+Enter', 'Publicar'],
] as const

function ToolButton({
  label,
  active,
  onClick,
  children,
  className,
}: {
  label: string
  active?: boolean
  onClick: () => void
  children: React.ReactNode
  className?: string
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      aria-pressed={active}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className={cn(
        'inline-flex h-[30px] min-w-[30px] items-center justify-center rounded-md px-2 text-[13px] text-ink-strong hover:bg-surface-sunken',
        active && 'bg-surface-sunken text-ink',
        className,
      )}
    >
      {children}
    </button>
  )
}

/** Barra de formatação: negrito, itálico, código, link, H1–H3, listas, citação e bloco de código com linguagem. */
export function EditorToolbar({
  editor,
  idPrefix,
}: {
  editor: Editor
  idPrefix: string
}) {
  const s = useEditorState({
    editor,
    selector: ({ editor: e }) => ({
      bold: e.isActive('bold'),
      italic: e.isActive('italic'),
      code: e.isActive('code'),
      link: e.isActive('link'),
      h1: e.isActive('heading', { level: 1 }),
      h2: e.isActive('heading', { level: 2 }),
      h3: e.isActive('heading', { level: 3 }),
      bullet: e.isActive('bulletList'),
      ordered: e.isActive('orderedList'),
      quote: e.isActive('blockquote'),
      codeBlock: e.isActive('codeBlock'),
      language:
        (e.getAttributes('codeBlock').language as string | undefined) ?? null,
    }),
  })
  const [lang, setLang] = useState<string>('sql')
  const [linkOpen, setLinkOpen] = useState(false)
  const [url, setUrl] = useState('')
  const [linkErr, setLinkErr] = useState<string | null>(null)
  const chain = () => editor.chain().focus()
  const currentLang = s.codeBlock && s.language ? s.language : lang
  const applyLink = () => {
    if (!url.trim()) {
      chain().extendMarkRange('link').unsetLink().run()
      setLinkOpen(false)
      return
    }
    const href = safeLink(url)
    if (!href) {
      setLinkErr('Use um link que comece com http:// ou https://')
      return
    }
    chain().extendMarkRange('link').setLink({ href }).run()
    setLinkOpen(false)
  }
  return (
    <div className="border-b border-line">
      <div
        role="toolbar"
        aria-label="Formatação do texto"
        className="flex flex-wrap items-center gap-0.5 px-2 py-1.5"
      >
        <ToolButton
          label="Negrito (B)"
          active={s.bold}
          onClick={() => chain().toggleBold().run()}
        >
          <strong>B</strong>
        </ToolButton>
        <ToolButton
          label="Itálico (I)"
          active={s.italic}
          onClick={() => chain().toggleItalic().run()}
        >
          <em className="font-serif">I</em>
        </ToolButton>
        <ToolButton
          label="Código (</>)"
          active={s.code}
          onClick={() => chain().toggleCode().run()}
        >
          <span className="font-mono text-xs">&lt;/&gt;</span>
        </ToolButton>
        <ToolButton
          label="Link"
          active={s.link}
          onClick={() => {
            setUrl(
              (editor.getAttributes('link').href as string | undefined) ?? '',
            )
            setLinkErr(null)
            setLinkOpen((o) => !o)
          }}
        >
          <span className="text-link underline">Link</span>
        </ToolButton>
        <span aria-hidden="true" className="mx-1 h-5 w-px bg-line" />
        {([1, 2, 3] as const).map((level) => (
          <ToolButton
            key={level}
            label={`Título H${level}`}
            active={s[`h${level}`]}
            onClick={() => chain().toggleHeading({ level }).run()}
          >
            <strong>H{level}</strong>
          </ToolButton>
        ))}
        <span aria-hidden="true" className="mx-1 h-5 w-px bg-line" />
        <ToolButton
          label="Lista"
          active={s.bullet}
          onClick={() => chain().toggleBulletList().run()}
        >
          • Lista
        </ToolButton>
        <ToolButton
          label="1. Lista numerada"
          active={s.ordered}
          onClick={() => chain().toggleOrderedList().run()}
        >
          1. Lista
        </ToolButton>
        <ToolButton
          label="Citação"
          active={s.quote}
          onClick={() => chain().toggleBlockquote().run()}
        >
          “ Citação
        </ToolButton>
        <ToolButton
          label="Bloco de código"
          active={s.codeBlock}
          onClick={() =>
            chain().toggleCodeBlock({ language: currentLang }).run()
          }
        >
          <span className="font-mono text-xs">{'{ }'} Bloco de código</span>
        </ToolButton>
        <label htmlFor={`${idPrefix}-lang`} className="sr-only">
          Linguagem do bloco de código
        </label>
        <select
          id={`${idPrefix}-lang`}
          value={currentLang}
          title="Linguagem do bloco de código"
          onChange={(e) => {
            setLang(e.target.value)
            if (s.codeBlock)
              chain()
                .updateAttributes('codeBlock', { language: e.target.value })
                .run()
          }}
          className="ml-0.5 h-[30px] rounded-md border border-line-control bg-surface px-1.5 text-[13px]"
        >
          {CODE_LANGUAGES.map(([v, l]) => (
            <option key={v} value={v}>
              {l}
            </option>
          ))}
        </select>
        <InfoTooltip label="Atalhos do editor" className="ml-auto">
          <span className="mb-1.5 block font-semibold">
            Atalhos de Markdown
          </span>
          <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-[13px]">
            {SHORTCUTS.map(([k, v]) => (
              <div key={k} className="contents">
                <dt className="font-mono text-xs">{k}</dt>
                <dd>{v}</dd>
              </div>
            ))}
          </dl>
        </InfoTooltip>
      </div>
      {linkOpen && (
        <div className="flex flex-wrap items-center gap-2 border-t border-line-soft px-3 py-2">
          <label
            htmlFor={`${idPrefix}-link`}
            className="text-[13px] font-medium"
          >
            Link
          </label>
          <Input
            id={`${idPrefix}-link`}
            type="url"
            value={url}
            placeholder="https://..."
            onChange={(e) => {
              setUrl(e.target.value)
              setLinkErr(null)
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                applyLink()
              } else if (e.key === 'Escape') setLinkOpen(false)
            }}
            className="h-8 max-w-[320px] flex-1"
            aria-invalid={linkErr ? true : undefined}
            aria-describedby={linkErr ? `${idPrefix}-link-err` : undefined}
          />
          <Button size="sm" onClick={applyLink}>
            Aplicar
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setLinkOpen(false)}
          >
            Cancelar
          </Button>
          {linkErr && (
            <span
              id={`${idPrefix}-link-err`}
              role="alert"
              className="text-[13px] text-danger"
            >
              {linkErr}
            </span>
          )}
        </div>
      )}
    </div>
  )
}

export type MarkdownEditorProps = {
  /** Markdown inicial. */
  initial?: string
  label: string
  placeholder?: string
  idPrefix: string
  onChange?: (markdown: string, empty: boolean) => void
  onSubmit?: () => void
  /** Recebe o editor pronto (para limpar depois de publicar, por exemplo). */
  onReady?: (editor: Editor) => void
  autofocus?: boolean
}

/** Editor de anotação: rico na tela, Markdown na API. */
export function MarkdownEditor({
  initial = '',
  label,
  placeholder = 'Escreva uma anotação…',
  idPrefix,
  onChange,
  onSubmit,
  onReady,
  autofocus = false,
}: MarkdownEditorProps) {
  // O atalho lê a versão atual do `onSubmit` sem recriar o editor.
  const submitRef = useRef(onSubmit)
  useEffect(() => {
    submitRef.current = onSubmit
  }, [onSubmit])
  const editor = useEditor({
    extensions: noteExtensions({ placeholder }),
    content: initial,
    contentType: 'markdown',
    immediatelyRender: false,
    editorProps: {
      // Ctrl/⌘+Enter publica, antes dos atalhos do editor (inclusive no bloco de código).
      handleKeyDown: (_view, e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
          e.preventDefault()
          submitRef.current?.()
          return true
        }
        return false
      },
      attributes: {
        role: 'textbox',
        'aria-multiline': 'true',
        'aria-label': label,
        class: 'note-content min-h-[120px] px-4 py-3.5 outline-none',
      },
    },
    onUpdate: ({ editor: e }) => onChange?.(e.getMarkdown(), e.isEmpty),
    onCreate: ({ editor: e }) => {
      // Foco no fim sem o `focus` adiado do Tiptap (no celular ele roda depois
      // de a pessoa já ter começado a digitar).
      if (autofocus) {
        e.commands.setTextSelection(e.state.doc.content.size)
        e.view.dom.focus()
      }
      onReady?.(e)
    },
  })
  if (!editor) return <div className="min-h-[164px]" aria-busy="true" />
  return (
    <>
      <EditorToolbar editor={editor} idPrefix={idPrefix} />
      <EditorContent editor={editor} />
    </>
  )
}

/** Anotação publicada: o mesmo esquema do editor, só leitura (sem HTML solto, links só http/https). */
export function MarkdownView({
  content,
  label,
  className,
}: {
  content: string
  /** Nome acessível do conteúdo (ex.: "Anotação 2"). */
  label: string
  className?: string
}) {
  const editor = useEditor({
    extensions: noteExtensions(),
    content,
    contentType: 'markdown',
    editable: false,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        role: 'article',
        'aria-label': label,
        class: cn('note-content outline-none', className),
      },
    },
  })
  useEffect(() => {
    if (editor && editor.getMarkdown() !== content)
      editor.commands.setContent(content, { contentType: 'markdown' })
  }, [editor, content])
  return <EditorContent editor={editor} />
}
