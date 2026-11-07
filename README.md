# roadmaps-web

Frontend do **Gestor pessoal de roadmaps e conhecimento**: organiza o que você quer aprender em roadmaps, módulos e tópicos, agenda um tópico por dia e registra cada sessão de estudo.

Stack: TanStack Start (React, SSR) + TanStack Router, TypeScript estrito, Tailwind CSS, Vitest. Desenvolvido com agentes de IA, a partir do protótipo e com a API mockada até o backend ([roadmaps-api](https://github.com/aleretamero/roadmaps-api)) ficar pronto.

## Requisitos

- Node 22 (veja `.nvmrc`)
- pnpm 10 (`corepack enable` instala a versão do `packageManager`)

## Comandos

| Comando          | O que faz                                                |
| ---------------- | -------------------------------------------------------- |
| `pnpm install`   | Instala as dependências                                  |
| `pnpm dev`       | Servidor de desenvolvimento em http://localhost:3000     |
| `pnpm build`     | Build de produção                                        |
| `pnpm preview`   | Serve o build de produção                                |
| `pnpm test`      | Testes unitários (Vitest)                                |
| `pnpm lint`      | ESLint (TypeScript, React Hooks, acessibilidade)         |
| `pnpm typecheck` | Verificação de tipos                                     |
| `pnpm format`    | Formata o código (Prettier + correções do ESLint)        |
| `pnpm check`     | Formatação, lint, tipos e testes — tem que passar sempre |

## Estrutura

```
src/
  routes/          Rotas por arquivo (TanStack Router). routeTree.gen.ts é gerado.
  features/<nome>/ Código de cada funcionalidade: componentes, hooks, queries, schemas
  components/ui/   Componentes base (shadcn/ui)
  components/      Componentes compartilhados do produto
  lib/             Utilitários, cliente da API
  mocks/           API mockada (MSW)
  test/            Configuração dos testes
```

Regra de ouro: uma tela importa de `features/`, `components/` e `lib/`; uma feature não importa de outra feature, só do que é compartilhado.

## Issues

O trabalho está organizado na issue pai [#1](https://github.com/aleretamero/roadmaps-web/issues/1), com as issues de preparação (`FS..`) antes das telas (`FU..`).
