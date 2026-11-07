---
description: Compara uma tela do app com o protótipo e lista as diferenças
argument-hint: <rota do app> <nome da captura, ex. 09-modulo>
---

Compare a rota `$1` do app com a captura `docs/prototype/screens/desktop/$2.png` (e a versão `mobile`).

1. Garanta `pnpm dev` (porta 3000) e `pnpm prototype` (porta 4100) rodando.
2. Pelo Playwright MCP, abra a rota do app em 1440×900 e em 390×844 e tire capturas.
3. Liste as diferenças que importam: layout, hierarquia, textos, cores (sempre dos tokens), espaçamento, estados e comportamento.
4. Corrija o que for do escopo da issue atual; o resto vira item no PR.
