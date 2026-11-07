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
