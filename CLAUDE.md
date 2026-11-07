# roadmaps-web — instruções para agentes

Frontend do Gestor pessoal de roadmaps e conhecimento. Este repositório é desenvolvido por agentes de IA: cada issue deve poder ser entregue sem perguntar nada a ninguém.

## Como trabalhar numa issue

1. Leia a issue inteira (`gh issue view N`) e as que ela cita em "Dependências". Leia `docs/screens.md` para achar a tela, a rota e os endpoints.
2. Abra o protótipo (`pnpm prototype` → http://localhost:4100) e a captura em `docs/prototype/screens/` da tela. Use o Playwright MCP para comparar protótipo e app lado a lado.
3. Crie a branch `feat/<chave-da-issue>-<assunto>` (ex.: `feat/fu03-painel`).
4. Implemente com o que já existe: `src/components/ui` (shadcn), `src/components`, tokens de `src/styles/tokens.css`. Componente novo do shadcn entra pelo shadcn MCP ou `pnpm dlx shadcn@latest add <nome>`.
5. Entregue com story (`*.stories.tsx`), teste (unitário e/ou E2E) e `pnpm check` verde. Se a issue mexe em componente com story, rode também `pnpm test:stories`.
6. Abra o PR com "Closes #N", um resumo do que mudou, a validação feita e as decisões tomadas. Só faça o merge com o CI verde (`.github/workflows/ci.yml`: check, Storybook e E2E; a `main` exige os três).
7. Atualize a issue: marque `[x]` nos itens entregues e comente o resumo. Item que ficou para outra issue fica desmarcado, com o motivo no comentário.

**Nunca pare para perguntar.** Quando a issue deixar algo em aberto, escolha a opção mais simples que respeita o protótipo e o planejamento da API, e registre a escolha na seção "Decisões tomadas" do PR.

## Definição de pronto

- [ ] Tela/comportamento igual ao protótipo (desktop 1440 e celular 390, sem rolagem lateral).
- [ ] Dados só pelo cliente tipado de `src/lib/api` (o MSW responde em dev, Storybook e testes).
- [ ] Story no Storybook cobrindo os estados (vazio, carregando, erro, com dados).
- [ ] Teste E2E do fluxo principal quando a issue for de tela.
- [ ] Acessível: nomes acessíveis, foco visível, navegação por teclado, axe sem violações.
- [ ] `pnpm check` verde.

## Comandos

| Comando                  | Para quê                                           |
| ------------------------ | -------------------------------------------------- |
| `pnpm dev`               | App em http://localhost:3000                       |
| `pnpm check`             | Formatação, lint, cores, tipos e testes unitários  |
| `pnpm test:stories`      | Testes das stories no navegador (inclui axe)       |
| `pnpm storybook`         | Storybook em http://localhost:6006 (MCP em `/mcp`) |
| `pnpm prototype`         | Protótipo em http://localhost:4100                 |
| `pnpm prototype:capture` | Regrava as capturas de referência                  |
| `pnpm format`            | Corrige formatação e lint                          |

## Stack e estrutura

TanStack Start + Router (rotas por arquivo em `src/routes/`), TanStack Query e Form, Tailwind v4, shadcn/ui (Radix), Storybook 10, Vitest, Playwright, MSW.

```
src/routes/            rotas (routeTree.gen.ts é gerado: `pnpm routes`)
src/features/<nome>/   componentes, hooks, queries e schemas da funcionalidade
src/components/ui/     shadcn (manter igual ao registro)
src/components/        componentes do produto (StageChip, IconButton, InfoTooltip…)
src/lib/               api, datas, etapas, utils
src/mocks/             MSW (handlers e dados)
docs/                  protótipo, capturas, mapa de telas, API
```

## Regras

- **Cores só dos tokens.** Nada de hex no código (`pnpm lint:colors` falha). Use classes como `bg-canvas`, `text-ink-muted`, `bg-stage-studying`.
- **Textos da interface em português do Brasil**; código, rotas, tipos e campos da API em inglês.
- **Sem dados fixos em componente.** Dados de exemplo ficam em `src/mocks/`.
- **Uma feature não importa de outra**; o compartilhado vai para `src/components` ou `src/lib`.
- **Não edite `src/components/ui` à mão** a não ser para ajustar tema/acessibilidade; registre o motivo no PR.
- **Não mude o contrato da API sem atualizar `contracts/openapi.yaml`** e explicar no PR (veja `docs/api.md`).
- **Datas de calendário** sempre com `src/lib/date.ts` (sem `new Date('yyyy-mm-dd')`, que muda o dia pelo fuso).

## Referências

- Protótipo: `docs/prototype/Main.dc.html` (original: https://claude.ai/artifact/T83TwEkQ8HzWMYy6UhhLPR)
- Mapa de telas: `docs/screens.md`
- API: `docs/api.md`
- Issues: https://github.com/aleretamero/roadmaps-web/issues/1
