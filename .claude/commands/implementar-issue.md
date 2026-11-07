---
description: Implementa uma issue do roadmaps-web do começo ao merge, sem parar para perguntar
argument-hint: <número da issue>
---

Implemente a issue #$ARGUMENTS deste repositório seguindo o `CLAUDE.md`, sem parar para perguntar.

1. `gh issue view $ARGUMENTS` e leia também as issues de "Dependências". Se alguma dependência ainda estiver aberta, implemente o mínimo dela que esta issue precisa e registre no PR.
2. Ache a tela em `docs/screens.md` e compare com `docs/prototype/screens/` (e com o protótipo pelo Playwright MCP).
3. `git checkout -b feat/<chave>-<assunto>` a partir da `main` atualizada.
4. Implemente o escopo da issue, com stories e testes.
5. Rode `pnpm check` (e `pnpm test:stories`/`pnpm e2e` quando fizer sentido) até tudo ficar verde. Corrija; não desligue regra nem pule teste.
6. Commit, push e PR com "Closes #$ARGUMENTS", resumo, validação e "Decisões tomadas".
7. Quando o CI do PR passar, faça o merge (squash) e apague a branch.
8. Atualize a issue: marque `[x]` no que foi entregue e comente o resumo.
