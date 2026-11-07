# API

O front conversa só com a API REST do [roadmaps-api](https://github.com/aleretamero/roadmaps-api), sob `/api/v1`. Enquanto o backend não fica pronto, a API é mockada com MSW (FS07) seguindo o mesmo contrato.

- **Planejamento do banco e das rotas** (fonte da verdade): https://claude.ai/artifact/NyCNWDSjbLTa2Ea6B3MJTy
- **Contrato OpenAPI**: `contracts/openapi.yaml` (FS06). Os tipos do front são gerados dele (`pnpm api:types`).
- **Cliente**: `src/lib/api/` (FS06). Nunca use `fetch` direto em componente.

## Convenções que o front assume

- JSON em camelCase; datas de calendário como `"2026-11-07"`; momentos em ISO 8601 UTC.
- Erros no formato Problem Details com `code` estável: `validation_error`, `not_found`, `edit_conflict` (412), `dependency_cycle`, `invalid_stage`, `drive_not_connected` (409).
- 401 = sem sessão → o app manda para `/login?redirect=`.
- Edição com concorrência: o `GET` traz `ETag`, o `PATCH` manda `If-Match`.
- Listas longas paginadas por cursor: `?limit=&cursor=`.
- Etapas do tópico: `planned`, `studying`, `practicing`, `completed` (veja `src/lib/stage.ts`).

## Quando o contrato não tem o que a tela precisa

1. Ajuste `contracts/openapi.yaml` primeiro (e o handler do mock).
2. Explique a mudança no PR.
3. Abra uma issue no `roadmaps-api` com a diferença, para o backend acompanhar.

## API mockada (MSW)

Em desenvolvimento (`.env.development` tem `VITE_API_MOCK=true`), no Storybook e nos testes, quem responde é o MSW com os handlers de `src/mocks/handlers/`, tipados pelo contrato.

- **Banco em memória** (`src/mocks/db.ts`): os dados de exemplo do protótipo (Marina Costa; roadmaps Backend com .NET, Frontend, Algoritmos e System Design arquivado), com datas relativas a hoje e meses de sessões para o mapa de calor.
- **Regras do backend** (`src/mocks/domain.ts`): etapa só avança por sessão, tópico novo no fim, progresso sem opcionais e sem alternativas não escolhidas, data prevista e atraso, sequência, agendamento automático (1 tópico por dia de estudo), `drive_not_connected` sem Drive, ciclo de dependência recusado, `If-Match` → 412.
- **Cenários**: `padrao`, `vazio` (usuário novo), `deslogado` (401), `sem-drive`, `com-drive`, `erro-500`, `lento` (1,5 s por resposta), `sem-agenda-hoje` (nada agendado para hoje), `em-dia` (sem datas perdidas nem tópicos parados).
  - No app: `?mock=<cenário>` na URL (fica na aba até trocar).
  - No Storybook: barra de ferramentas › Cenário, ou `parameters: { scenario: 'vazio' }` na story.
  - Nos testes: `setScenario('vazio')` de `src/mocks`.
- **Persistência**: `?mock-persist=1` guarda o banco no `localStorage` (para testar recarregando); `?mock-persist=0` desliga.
- **Listas grandes**: `addRandomRoadmaps(db, n)` em `src/mocks/factories.ts` (faker com semente fixa).
- **Rota nova no contrato** = handler novo: o teste `src/mocks/mocks.test.ts` falha se alguma rota do `openapi.yaml` não tiver handler.
