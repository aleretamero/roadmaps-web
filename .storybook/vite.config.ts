// Vite só para o Storybook: React + Tailwind, sem o plugin do TanStack Start (que exige o servidor do app).
import { defineConfig } from 'vite'
import viteReact from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  resolve: { tsconfigPaths: true },
  plugins: [tailwindcss(), viteReact()],
})
