import type { Schemas } from '@/lib/api/client'

export type FileNode = Schemas['FileNode']
export type Row = { node: FileNode; level: number; parent: string | null }

/** Pasta que contém o caminho ("" é a raiz). */
export const parentOf = (path: string) =>
  path.includes('/') ? path.slice(0, path.lastIndexOf('/')) : ''

/** Junta pasta e nome (nome vazio devolve a própria pasta). */
export const joinPath = (dir: string, name: string) =>
  !name ? dir : dir ? `${dir}/${name}` : name

/** Pastas primeiro, depois arquivos, cada grupo em ordem alfabética. */
export function sortNodes(nodes: ReadonlyArray<FileNode>) {
  return [...nodes].sort((a, b) =>
    a.type === b.type
      ? a.name.localeCompare(b.name, 'pt-BR')
      : a.type === 'folder'
        ? -1
        : 1,
  )
}

/** Linhas visíveis da árvore (só desce nas pastas abertas). */
export function visibleRows(
  root: FileNode,
  expanded: ReadonlySet<string>,
): Array<Row> {
  const out: Array<Row> = []
  const walk = (
    nodes: ReadonlyArray<FileNode>,
    level: number,
    parent: string | null,
  ) => {
    for (const n of sortNodes(nodes)) {
      out.push({ node: n, level, parent })
      if (n.type === 'folder' && expanded.has(n.path))
        walk(n.children ?? [], level + 1, n.path)
    }
  }
  walk(root.children ?? [], 1, null)
  return out
}

/** Acha um nó pelo caminho. */
export function findNode(root: FileNode, path: string): FileNode | null {
  if (!path) return root
  for (const c of root.children ?? []) {
    if (c.path === path) return c
    if (c.type === 'folder' && path.startsWith(`${c.path}/`))
      return findNode(c, path)
  }
  return null
}

/** Todas as pastas (para "Mover para…"), com a raiz como "". */
export function allFolders(root: FileNode): Array<string> {
  const out = ['']
  const walk = (n: FileNode) => {
    for (const c of sortNodes(n.children ?? []))
      if (c.type === 'folder') {
        out.push(c.path)
        walk(c)
      }
  }
  walk(root)
  return out
}

/** Nome válido para arquivo ou pasta (sem barras, sem "." ou ".."). */
export function nameProblem(
  name: string,
  siblings: ReadonlyArray<string>,
): string | null {
  const n = name.trim()
  if (!n) return 'Dê um nome.'
  if (n.includes('/') || n.includes('\\')) return 'O nome não pode ter barras.'
  if (n === '.' || n === '..') return 'Nome inválido.'
  if (siblings.includes(n)) return 'Já existe um item com esse nome aqui.'
  return null
}

/** "1,2 MB", "830 KB", "120 B" */
export function formatBytes(n: number | null | undefined) {
  if (n === null || n === undefined) return ''
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${Math.round(n / 1024)} KB`
  return `${(n / 1024 / 1024).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} MB`
}

export const extOf = (name: string) =>
  name.includes('.') ? name.split('.').at(-1)!.toLowerCase() : ''

export const isImage = (n: FileNode) => (n.mimeType ?? '').startsWith('image/')
export const isText = (n: FileNode) =>
  (n.mimeType ?? '').startsWith('text/') ||
  /^(md|txt|sql|cs|ts|tsx|js|jsx|json|ya?ml|sh|py|css|html|xml|csv)$/.test(
    extOf(n.name),
  )
