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
- **Importação JSON**: o front aceita chaves em português (`nome`, `modulos`, `titulo`, `topicos`, `opcional`, `dataPrevista`, `depoisDe`, `alternativaA`) ou as do contrato, e converte para o contrato (`ImportModule`) antes de chamar a API. A validação final é sempre o `?dryRun=true`.

## API real

O mock continua sendo o padrão (`.env` tem `VITE_API_MOCK=true`), e o Storybook e os testes de componente sempre usam o MSW. Para usar o backend de verdade:

1. Suba o [roadmaps-api](https://github.com/aleretamero/roadmaps-api): `cp .env.example .env && docker compose --profile full up -d`. A API fica em `http://localhost:8080`.
2. Rode o front com `pnpm dev:api`. Ele usa `VITE_API_MOCK=false`, e o dev server repassa `/api` para `API_PROXY_TARGET` (padrão `http://localhost:8080`).
   - App e API ficam na **mesma origem**, então o cookie de sessão funciona sem CORS.
   - O proxy reescreve o domínio do cookie e os redirecionamentos do OAuth.

### Contrato publicado pelo backend

`pnpm api:diff --from http://localhost:8080/openapi/v1.json` compara `contracts/openapi.yaml` com o OpenAPI que o backend publica (em Development, pelo `MapOpenApi`). Ele lista:

- operações que só existem de um lado;
- schemas com propriedades diferentes (o `!` marca as obrigatórias).

Use `--write contracts/openapi.published.json` para guardar uma cópia e `--strict` para falhar quando houver diferença.

**Quando houver diferença**: abra uma issue no repositório que precisa mudar e cite-a na outra. Enquanto o backend não implementa tudo, a fonte da verdade do front continua sendo `contracts/openapi.yaml`.

### E2E contra a API real

`pnpm e2e:api` (`playwright.api.config.ts`, pasta `e2e-api/`) roda o fluxo completo: entrar, criar roadmap, registrar sessão e ver no painel.

- **Login**: o OAuth do GitHub não dá para automatizar, então o teste usa uma rota de login de desenvolvimento do backend (`E2E_LOGIN_PATH`, padrão `/api/v1/auth/dev-login?redirect=…`). Ela deve existir **só em Development**.
- **No CI**: o job "E2E contra a API real" sobe o backend com Docker Compose e roda esse fluxo. É opcional e não bloqueia o merge: roda pelo "Run workflow" (`workflow_dispatch`) ou com a variável de repositório `API_E2E=true`. As diferenças de contrato vão para o resumo do job.
- **Conferir o roteiro contra o mock**: `E2E_BASE_URL=http://localhost:3000 E2E_LOGIN_PATH=none pnpm e2e:api`, com `pnpm dev` de pé.
