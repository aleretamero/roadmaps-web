import type { StorybookConfig } from '@storybook/react-vite'

const config: StorybookConfig = {
  stories: ['../src/**/*.mdx', '../src/**/*.stories.@(ts|tsx)'],
  addons: [
    '@storybook/addon-docs',
    '@storybook/addon-a11y',
    '@storybook/addon-vitest',
    // MCP em http://localhost:6006/mcp para os agentes listarem e lerem as stories
    '@storybook/addon-mcp',
    'msw-storybook-addon',
  ],
  framework: {
    name: '@storybook/react-vite',
    options: {
      builder: { viteConfigPath: '.storybook/vite.config.ts' },
    },
  },
  // public/ tem o mockServiceWorker.js do MSW.
  staticDirs: ['../public'],
  core: { disableTelemetry: true },
}

export default config
