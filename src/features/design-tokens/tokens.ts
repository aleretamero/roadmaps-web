/** Nomes dos tokens de src/styles/tokens.css, agrupados para a página de referência. */
export const colorGroups = [
  {
    title: 'Tinta',
    tokens: [
      'ink',
      'ink-strong',
      'ink-muted',
      'ink-soft',
      'ink-subtle',
      'ink-faint',
    ],
  },
  {
    title: 'Superfícies',
    tokens: ['canvas', 'surface', 'surface-raised', 'surface-sunken'],
  },
  {
    title: 'Linhas',
    tokens: ['line', 'line-soft', 'line-strong', 'line-control'],
  },
  {
    title: 'Ações e estados',
    tokens: ['link', 'danger', 'danger-soft', 'success', 'warning'],
  },
  {
    title: 'Gráficos',
    tokens: [
      'chart-completed',
      'chart-practicing',
      'chart-studying',
      'chart-planned',
    ],
  },
  {
    title: 'Mapa de calor',
    tokens: ['heat-0', 'heat-1', 'heat-2', 'heat-3', 'heat-4'],
  },
] as const

export const stages = [
  { key: 'planned', label: 'Planejado' },
  { key: 'studying', label: 'Estudando' },
  { key: 'practicing', label: 'Praticando' },
  { key: 'completed', label: 'Concluído' },
] as const

export const radii = ['xs', 'sm', 'md', 'lg', 'xl', '2xl'] as const
export const shadows = ['menu', 'dialog'] as const
