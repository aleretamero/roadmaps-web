/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** `true` liga a API mockada (MSW) no navegador. */
  readonly VITE_API_MOCK?: string
  /** Base da API; padrão `/api/v1`. */
  readonly VITE_API_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
