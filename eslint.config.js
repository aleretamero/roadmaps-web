//  @ts-check

import { tanstackConfig } from '@tanstack/eslint-config'
import reactHooks from 'eslint-plugin-react-hooks'
import jsxA11y from 'eslint-plugin-jsx-a11y'
import storybook from 'eslint-plugin-storybook'

export default [
  {
    ignores: [
      'dist',
      '.output',
      '.tanstack',
      'coverage',
      'src/routeTree.gen.ts',
      'eslint.config.js',
      'prettier.config.js',
      'storybook-static',
      '!.storybook',
    ],
  },
  ...tanstackConfig,
  reactHooks.configs.flat.recommended,
  jsxA11y.flatConfigs.recommended,
  ...storybook.configs['flat/recommended'],
  {
    rules: {
      'import/no-cycle': 'off',
      'import/order': 'off',
      'sort-imports': 'off',
      '@typescript-eslint/array-type': 'off',
      '@typescript-eslint/require-await': 'off',
      'pnpm/json-enforce-catalog': 'off',
    },
  },
  {
    // Código copiado do shadcn/ui: mantido como vem do registro.
    files: ['src/components/ui/**'],
    rules: { 'no-shadow': 'off' },
  },
]
