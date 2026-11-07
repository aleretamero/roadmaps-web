# Mapa de telas

Cada tela do protótipo, a rota no app, os endpoints da API que ela usa e as capturas de referência em `docs/prototype/screens/{desktop,mobile}/`. A issue de cada tela está no [#1](https://github.com/aleretamero/roadmaps-web/issues/1).

| Tela                            | Rota do app                                                    | Endpoints (`/api/v1`)                                                                             | Captura                                                        | Issue      |
| ------------------------------- | -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- | ---------- |
| Landing                         | `/`                                                            | `GET /me` (só para redirecionar)                                                                  | `01-landing`                                                   | FU01       |
| Login                           | `/login?redirect=`                                             | `GET /auth/login/{provider}`, `POST /auth/logout`, `GET /me`                                      | `02-login`                                                     | FU02       |
| Painel                          | `/dashboard`                                                   | `GET /dashboard`, `GET /dashboard/activity?weeks=24`                                              | `03-painel`                                                    | FU03, FU04 |
| Meus roadmaps                   | `/roadmaps?archived=`                                          | `GET /roadmaps`, `POST /roadmaps/{id}/archive`, `/unarchive`, `DELETE /roadmaps/{id}`             | `04-meus-roadmaps`                                             | FU05       |
| Criador de roadmap / importação | `/roadmaps/new`                                                | `POST /roadmaps`, `POST /roadmaps/import`, `POST /roadmaps/{id}/import?dryRun=`                   | —                                                              | FU06       |
| Roadmap · Mapa                  | `/roadmaps/$roadmapId?view=map`                                | `GET /roadmaps/{id}`, `PUT /roadmaps/{id}/path-choices/{branchModuleId}`                          | `05-roadmap-mapa`                                              | FU07       |
| Roadmap · Lista                 | `/roadmaps/$roadmapId?view=list`                               | `PUT /modules/{id}/topics/order`, `POST /topics/{id}/move`, `PUT /roadmaps/{id}/modules/order`    | `07-roadmap-lista`                                             | FU08       |
| Roadmap · Progresso             | `/roadmaps/$roadmapId?tab=progress`                            | `GET /roadmaps/{id}/progress`                                                                     | `08-roadmap-progresso`                                         | FU09       |
| Agendar automaticamente (modal) | modal no roadmap                                               | `POST /roadmaps/{id}/schedule/preview`, `POST /roadmaps/{id}/schedule`                            | `06-roadmap-agendar-automaticamente`                           | FU15       |
| Módulo                          | `/modules/$moduleId?tab=topics\|timeline\|notes`               | `GET /modules/{id}`, `PATCH /modules/{id}`, `GET /modules/{id}/timeline`, `/modules/{id}/notes`   | `09-modulo`, `11-modulo-linha-do-tempo`, `12-modulo-anotacoes` | FU10, FU16 |
| Adicionar tópicos (modal)       | modal no módulo                                                | `POST /modules/{id}/topics`                                                                       | `10-modulo-adicionar-topicos`                                  | FU11       |
| Tópico                          | `/topics/$topicId?tab=timeline\|notes\|resources\|files&log=1` | `GET /topics/{id}`, `PATCH /topics/{id}`, `POST /topics/{id}/reopen`, `GET /topics/{id}/timeline` | `13-topico`                                                    | FU12, FU16 |
| Tópico · Anotações              | `?tab=notes`                                                   | `GET/POST /topics/{id}/notes`, `PATCH/DELETE /notes/{id}`                                         | `14-topico-anotacoes`                                          | FU17       |
| Tópico · Referências            | `?tab=resources`                                               | `GET/POST /topics/{id}/resources`, `PATCH/DELETE /resources/{id}`                                 | `15-topico-referencias`                                        | FU18       |
| Tópico · Arquivos               | `?tab=files`                                                   | `/topics/{id}/files`, `/folders`, `/files/move`, `GET /files/{id}/content`                        | `16-topico-arquivos` (sem Drive)                               | FU20       |
| Registrar sessão (modal)        | modal global, `?log=1` no tópico                               | `POST /topics/{id}/sessions`                                                                      | `17-registrar-sessao`                                          | FU13       |
| Agenda                          | `/schedule?from=&to=`                                          | `GET /schedule`, `POST /topics/{id}/schedule-entries`, `PATCH/DELETE /schedule-entries/{id}`      | `18-agenda`                                                    | FU14       |
| Busca (modal)                   | modal global (Ctrl+K)                                          | `GET /search?q=&type=`                                                                            | `19-busca`                                                     | FU19       |
| Configurações · Conta           | `/settings/account`                                            | `GET/PATCH /me`                                                                                   | `20-configuracoes-conta`                                       | FU21       |
| Configurações · Estudo e agenda | `/settings/study`                                              | `GET/PUT /me/preferences`, `/notifications/*`                                                     | `21-configuracoes-estudo`                                      | FU21, FU22 |
| Configurações · Integrações     | `/settings/integrations?returnTo=`                             | `GET /integrations`, `/integrations/google-drive/*`                                               | `22-configuracoes-integracoes`                                 | FU21       |

## Componentes que se repetem

- **StageChip** (`src/components/StageChip.tsx`): selo de etapa em listas, cards e cabeçalhos.
- **IconButton** (`src/components/IconButton.tsx`): ⋯ das linhas, play, fechar. Sempre com `label`.
- **InfoTooltip** (`src/components/InfoTooltip.tsx`): o "i" do editor e da busca.
- **Menu ⋯ da linha**: `DropdownMenu` + `IconButton`; na linha do tópico tem só "Registrar sessão" e "Editar tópico" (clicar na linha abre o tópico).
- **Abas**: `Tabs` (estilo sublinhado padrão); a aba atual vai em search param.
- **Modal de registrar sessão**: um só, aberto por hook de qualquer tela.

## Regenerar as capturas

```bash
pnpm prototype            # terminal 1: serve o protótipo em http://localhost:4100
pnpm prototype:capture    # terminal 2: regrava docs/prototype/screens
```
