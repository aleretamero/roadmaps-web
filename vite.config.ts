import { defineConfig } from 'vite'
import { devtools } from '@tanstack/devtools-vite'

import { tanstackStart } from '@tanstack/react-start/plugin/vite'

import viteReact from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

/**
 * Com a API real (`VITE_API_MOCK=false`), o dev server repassa `/api` para o
 * backend (`API_PROXY_TARGET`, padrão http://localhost:8080). Assim o app e a
 * API ficam na mesma origem e o cookie de sessão funciona sem CORS.
 */
const apiTarget = process.env.API_PROXY_TARGET ?? 'http://localhost:8080'

const config = defineConfig({
  resolve: { tsconfigPaths: true },
  plugins: [devtools(), tailwindcss(), tanstackStart(), viteReact()],
  server: {
    proxy: {
      '/api': {
        target: apiTarget,
        changeOrigin: true,
        // O cookie volta com o domínio do app, não o do backend.
        cookieDomainRewrite: '',
        // O OAuth redireciona para o backend; a volta precisa cair no app.
        autoRewrite: true,
      },
    },
  },
})

export default config
