import { describe, expect, it } from 'vitest'
import {
  allFolders,
  findNode,
  formatBytes,
  joinPath,
  nameProblem,
  parentOf,
  visibleRows,
} from './fileTree'
import type { FileNode } from './fileTree'

const n = (
  path: string,
  type: 'file' | 'folder',
  children: Array<FileNode> = [],
): FileNode => ({
  path,
  name: path.split('/').at(-1) ?? '',
  type,
  id: type === 'file' ? 1 : null,
  mimeType: null,
  sizeBytes: type === 'file' ? 10 : null,
  updatedAt: null,
  children,
})
const root = n('', 'folder', [
  n('z.txt', 'file'),
  n('scripts', 'folder', [
    n('scripts/a.sql', 'file'),
    n('scripts/sub', 'folder'),
  ]),
])

describe('árvore de arquivos', () => {
  it('linhas visíveis: pastas primeiro, só abre as expandidas', () => {
    expect(visibleRows(root, new Set()).map((r) => r.node.path)).toEqual([
      'scripts',
      'z.txt',
    ])
    expect(
      visibleRows(root, new Set(['scripts'])).map((r) => [
        r.node.path,
        r.level,
      ]),
    ).toEqual([
      ['scripts', 1],
      ['scripts/sub', 2],
      ['scripts/a.sql', 2],
      ['z.txt', 1],
    ])
  })
  it('caminhos', () => {
    expect(parentOf('scripts/a.sql')).toBe('scripts')
    expect(parentOf('z.txt')).toBe('')
    expect(joinPath('', 'a')).toBe('a')
    expect(joinPath('x', '')).toBe('x')
    expect(joinPath('x', 'a')).toBe('x/a')
    expect(findNode(root, 'scripts/a.sql')?.name).toBe('a.sql')
    expect(allFolders(root)).toEqual(['', 'scripts', 'scripts/sub'])
  })
  it('nomes e tamanhos', () => {
    expect(nameProblem('a/b', [])).toBe('O nome não pode ter barras.')
    expect(nameProblem('a', ['a'])).toBe(
      'Já existe um item com esse nome aqui.',
    )
    expect(nameProblem(' ', [])).toBe('Dê um nome.')
    expect(nameProblem('ok', ['a'])).toBeNull()
    expect(formatBytes(512)).toBe('512 B')
    expect(formatBytes(2048)).toBe('2 KB')
    expect(formatBytes(1.5 * 1024 * 1024)).toBe('1,5 MB')
  })
})
