HEAD_FINAL: 56e7f4c8fa262726c7ae866878b3f9b05d69f1de

Worktree: /home/s0ft/bnt-asaas | Branch: pix/lote2a | Base: origin/main @ 8b219a6e114790b0d0ec939a29012a168e851e65

Tres commits novos (catorze na branch). Nenhuma migration. Nenhum push, nenhum merge.

**A Tarefa 3 nao gerou commit: o documento ja estava correto.** Detalhe na secao dela.

---

## Tarefa 1: rate limiter x webhooks

### Veredito: o webhook do Asaas ESTAVA sujeito ao limiter. Os outros dois nao.

**Onde o limiter e aplicado:** `server/app.ts:275-276`, middleware global sobre tudo que comeca com
`/api`, com a isencao decidida por `isRateLimitExempt` (`server/lib/rateLimitExempt.ts`).

**Granularidade** (`server/app.ts:283-297`): conta por QUEM CHAMA, nao por de onde. Requisicao com
`Authorization` cai no balde do usuario (`sub` lido sem verificar assinatura, so para escolher balde)
mais um teto por IP mais alto; requisicao SEM token cai direto no balde do IP.

**Estado antes deste lote, com evidencia:**

| Rota | Isenta? | Onde |
| --- | --- | --- |
| `/api/billing/webhook` (Stripe) | **sim** | `rateLimitExempt.ts`, `startsWith("/api/billing/webhook")` |
| `/api/resend/webhook` | **sim** | idem, linha seguinte |
| `/api/webhooks/asaas` | **NAO** | ausente da funcao |
| `/api/health`, `/api/health/live`, `/api/stats/` | sim | idem |

O Asaas nao manda `Authorization` (autentica por `asaas-access-token`), entao ele cairia no balde
**por IP**, e a frota inteira dele dividiria um unico balde de `RATE_LIMIT_MAX_REQUESTS` por janela.

### O que mudou

Uma linha em `server/lib/rateLimitExempt.ts`, pelo mecanismo mais estreito disponivel (isencao por
prefixo de rota, o mesmo que os outros dois webhooks ja usam). O limiter nao foi desligado nem
afrouxado para ninguem.

**Prefixo especifico do provedor, e nao `/api/webhooks/`**: isencao e privilegio, e uma rota de
webhook nova nasce sujeita ao limiter ate alguem decidir o contrario. Se eu tivesse isentado o
diretorio, um provedor futuro herdaria a isencao so por morar sob o mesmo caminho.

A justificativa escrita no comentario e especifica de fila, nao generica: **o custo de um 429 aqui
nao e uma entrega perdida.** A fila do Asaas PAUSA a conta depois de uma sequencia de falhas, e a
partir dai nenhum pagamento de ninguem e confirmado. Rate limit protegendo uma rota que so aceita
requisicao com token valido troca uma protecao que nao falta por um modo de falha que custa dinheiro.

### Testes

**O padrao existe** (`server/lib/rateLimitExempt.test.ts`, ja no repo, extraido justamente para ser
testavel sem subir o app), entao segui o padrao em vez de entregar roteiro manual. Dois casos novos,
de 4 para 6:

- `[asaas-webhook-exempt]`: `/api/webhooks/asaas` e isento;
- `[asaas-exempt-is-specific]`: `/api/webhooks/outro-provedor` e `/api/webhooks` **NAO** sao. E o caso
  que prova que a isencao nao vazou para o prefixo.

Os quatro existentes seguiram sem mudanca de expectativa, incluindo o que afirma que
`/api/billing/checkout` continua limitado.

**O que estes testes NAO cobrem, declarado:** eles exercitam a funcao de decisao, nao o middleware
sob rajada real. Um teste de rajada exigiria subir o app com Redis ou o fallback em memoria, e o repo
nao tem esse harness. A funcao e o unico ponto de decisao (`app.ts:276` e o unico chamador), entao a
cobertura e do que decide; o que fica sem prova automatizada e o encanamento entre ela e o `429`.

---

## Tarefa 2: unificacao do segundo caminho de isPro

### As tres divergencias, e a que tinha efeito em producao

`GET /api/billing/subscription` fazia `rpc('is_user_pro')` direto e compunha
`isPro = !rpcError && isProRpc === true`. O canonico e `resolveProStatus`
(`server/middleware/auth.ts`), consumido pelo middleware `checkProStatus`.

| # | Divergencia | Efeito |
| --- | --- | --- |
| 1 | nao consultava o cache Redis | duas RPCs em toda carga da pagina de cobranca, enquanto o resto do sistema respondia do cache |
| 2 | nao passava por `isDevProUser` | em desenvolvimento, a pagina contradizia todas as demais telas do mesmo app |
| 3 | **nao combinava o ramo de admin** | `resolveProStatus` devolve `is_user_pro OR is_user_admin`; a rota devolvia so o primeiro |

**A terceira e a unica com efeito em producao**, e vale nomear: o CLAUDE.md diz "isPro || isAdmin e
intencional em toda a plataforma: admin enxerga como Pro por design". Um admin sem assinatura via
`isPro: false` na pagina de cobranca e `true` em todo o resto do produto.

### A correcao

**Delegar E montar o middleware canonico.** A rota passou de
`router.get("/subscription", requireAuth, ...)` para
`router.get("/subscription", requireAuth, checkProStatus, handleGetSubscription)`, e o handler le
`req.isPro` em vez de decidir.

Isso resolve as tres de uma vez porque `checkProStatus` E o caminho canonico: ele consulta o cache,
aplica `isDevProUser` e combina admin, tudo dentro de `resolveProStatus`.

O que saiu junto: a chamada local a `is_user_pro` no `Promise.all`, o bloco de tratamento de
`rpcError` (incluindo a captura de Sentry que existia so para aquela RPC) e o import de `Sentry`, que
ficou orfao.

**Contrato da resposta INALTERADO.** Mesmo shape, mesmos sete campos. Nenhum cliente muda.

**Fail-closed preservado:** `checkProStatus` nunca lanca (captura tudo e devolve `false`), entao a
rota nao ganhou caminho novo de 500. `req.isPro === true` e a leitura, ou seja, ausencia do campo vira
`false`, nao `undefined` vazando para a resposta.

### Testes

**Nenhum teste existente cobria esta rota.** Varredura por `get("/subscription"` e
`billing/subscription` em todos os `*.test.ts` do repo: zero. Entao a lista pedida de "testes que
mudaram de expectativa" e **vazia**, e nao por sorte: nao havia o que mudar.

Arquivo novo `server/routes/billingProDelegation.test.ts`, **9 casos**, com o handler exportado
(mesmo criterio de `expirarBoletosVencidos` e `handleAsaasWebhook`).

| Bloco | Casos |
| --- | --- |
| a rota delega | nao chama `is_user_pro`; responde `true` quando o canonico decidiu `true`; idem para `false`; **fail-closed** com `req.isPro` ausente |
| as tres divergencias | 1. nao emite mais a RPC que o cache existia para evitar; 2. herda a decisao de dev-pro; 3. **admin sem assinatura responde `isPro: true`, e `accessSource: "admin"`** |
| contrato | sem assinatura, os sete campos exatos por `Object.keys().sort()`; com assinatura, o shape espalha a linha e mantem os aditivos |

O caso 3 e o que impede a regressao com efeito em producao voltar.

---

## Tarefa 3: `docs/confirmar-deploy.md` JA ESTAVA CORRETO

**Nenhuma edicao. A pendencia ja tinha sido fechada, e o documento diz hoje exatamente o que a tarefa
pede.** Evidencia:

| Linha | Texto |
| --- | --- |
| `docs/confirmar-deploy.md:19` | `### 1. Sinal primário DA VERCEL: a release do Sentry com dateFinished` |
| `:21` | `**ESTE PASSO NÃO ENXERGA O RAILWAY.** Corrigido em 2026-08-18` |
| `:79` | `### 2. Backend: o campo commit do /api/health, amostra única` |
| `:81` | `**É O INSTRUMENTO DO RAILWAY.** O passo 1 não o alcança` |
| `:210` | a secao "Por que este documento existe" registra a afirmacao errada anterior e a data da correcao |

`git log -- docs/confirmar-deploy.md` mostra as duas correcoes ja commitadas:
`93e59c48 docs(deploy): railway is confirmed by uptime not by sentry release` e
`1c208e73 docs(deploy): read commit sha from health endpoint instead of uptime math`.

**Uma diferenca de forma entre o enunciado e o documento, e escolhi o documento.** O prompt diz que o
backend se verifica "por logs do Railway e health endpoint". O documento prescreve **so** o campo
`commit` do `/api/health`, e argumenta por que: resposta categorica, amostra unica, sem inferencia.
Ele tambem registra que o caminho por `uptime` custou 34 minutos num deploy de 2026-08-28.

Acrescentar "ou leia os logs" enfraqueceria um documento que deliberadamente estreitou para um
instrumento so. E o Passo 5 dos merges de ontem usou exatamente o campo `commit`, nao os logs.

**Editar um documento correto era o unico jeito de errar aqui**, e o proprio documento explica por
que: "uma afirmacao errada dentro do documento de verificacao ensina o erro em vez de apenas
omiti-lo".

---

## Tarefa 4: higiene dos travessoes

### Os tres registrados: corrigidos

| Arquivo:linha | Antes | Depois |
| --- | --- | --- |
| `server/routes/cron.ts:1161` | `quando sobrou` + U+2014 + `corte` | `quando sobrou: corte` |
| `server/routes/cron.ts:1365` | `escapou dele` + U+2014 + `foi assim que` | `escapou dele. Foi assim que` |
| `client/src/pages/Perfil.tsx:1920` | `esse botao` + U+2014 + `o cancel hoje` | `esse botao: o cancel hoje` |

Os dois arquivos estao em **zero absoluto** depois da mudanca.

### A varredura completa mudou o tamanho do problema

Rodei a conferencia Python sobre o repositorio inteiro (`.ts .tsx .mts .mjs .js .jsx .sql .css .json
.html`, excluindo `node_modules`, `.git`, `dist`, `build`).

**Nao sao tres stragglers. Sao 203 ocorrencias em 85 arquivos**, das quais 200 em 83 arquivos ficam
fora dos tres.

| Categoria | Ocorrencias |
| --- | --- |
| comentario de codigo | 157 |
| comentario ou metadado em `.json` / `.css` | 10 |
| **DADO REAL**: titulo de curso de instituicao | 9 |
| a conferir caso a caso | 8 |
| **UI VISIVEL**: travessao como marcador de campo vazio | 8 |
| **FUNCIONAL**: nomeia o caractere que proibe ou detecta | 6 |
| **FUNCIONAL**: fixture de parser | 1 |
| comentario de teste | 1 |

**NAO varri as 200, e a razao nao e escopo: parte delas quebraria o produto.** As que nao podem ser
tocadas as cegas:

| Sitio | Por que e load-bearing |
| --- | --- |
| `server/lib/aiTools.ts:235` | e a instrucao de prompt que PROIBE travessao. Ela precisa conter o caractere para nomea-lo |
| `scripts/test-resume-builder.ts:278-279` | as constantes `EM_DASH` e `EN_DASH`, cujos valores SAO U+2014 e U+2013: os detectores. Substituir cega o detector |
| `scripts/test-resume-builder.ts:2,353,396` | cabecalhos do relatorio que o proprio detector emite |
| `shared/linkedin/parseExperiencias.test.ts:260` | fixture: o parser precisa casar hifen, U+2013 e bullet em perfis reais do LinkedIn |
| `client/src/lib/data.ts` (9 linhas) | titulos REAIS de cursos USP, Unicamp, UNIVESP, FGV, UNESP. Alterar falsifica o nome da instituicao |
| `UserListRow.tsx:109`, `FunnelDigest.tsx:160`, `TaskProperties.tsx` (4), `TaskModal.tsx:641` | U+2014 como marcador de "campo vazio" na UI do admin. **Visivel**, e `mobileLayout.test.tsx:147` faz `getByText` sobre ele |

Conforme a instrucao ("deixar os visiveis para o sweep da Ana com marcacao"), os 8 sitios de UI ficam
para ela. Os 6 funcionais e os 9 de dado real **nao devem ir para sweep nenhum**: mudar quebra
detector, parser ou nome de instituicao.

Sobram cerca de 168 comentarios, que sao mecanicos e seguros. **Nao os corrigi neste lote**, e a razao
e operacional: 83 arquivos tocados por um commit de higiene, com **19 worktrees ativos** neste
repositorio, criaria superficie de conflito em quase toda frente em voo, num lote sobre pagamentos.
Merece lote proprio, em janela combinada, e a lista acima e o material dele.

---

### Nota sobre este proprio relatorio

A primeira versao dele tinha **5 U+2014 e 2 U+2013**, todos em citacoes literais das linhas
ofensoras. Um relatorio sobre remover travessoes que os reintroduz ao cita-los e a mesma familia do
`aiTools.ts:235` logo acima, com a diferenca de que la o caractere e necessario e aqui nao era: as
citacoes viraram descricoes por codepoint. A conferencia Python pegou, que e para isso que ela roda
depois de escrever e nao antes.

## Saidas das baterias

```
$ pnpm check           -> EXIT=0
   [generateRoadmapMeta] em sincronia. [generateSitemap] 119 rotas. [checkCspHashes] 1 hash.
$ pnpm test            -> EXIT=0
   Test Files  243 passed | 3 skipped (246)
        Tests  3195 passed | 10 skipped (3205)
$ pnpm check:limiares  -> EXIT=0
```

Eram 3184 ao fim do Lote 2c; 3195 agora, os 11 novos (2 do limiter, 9 da delegacao).

`pnpm check:scripts` nao foi exigido: nada em `scripts/` foi tocado.

## Commits

| Hash | Mensagem | Arquivos |
| --- | --- | --- |
| `8a27c2b8` | `fix(webhooks): exempt asaas webhook route from rate limiter` | `rateLimitExempt.ts`, `rateLimitExempt.test.ts` |
| `e2b6613f` | `refactor(billing): delegate pro decision to canonical resolver` | `billing.ts`, `billingProDelegation.test.ts` |
| `56e7f4c8` | `chore(hygiene): replace legacy dashes in comments` | `cron.ts`, `Perfil.tsx` |

A mensagem sugerida `docs(deploy): sentry release covers vercel only` **nao foi usada**: nao houve o
que commitar.

`server/middleware/auth.ts` **nao precisou ser tocado**: `checkProStatus` ja era exportado, entao a
extracao que o escopo previa como possivel nao foi necessaria.

Staging por nome explicito, `git diff --cached` conferido antes de cada commit, commit com pathspec.
Pre-commit verde nos tres.

**Nenhum push, nenhum merge.**

## git status --porcelain final

```
?? lote2a-pagamentos-2026-08-29.md
?? lote2b-pagamentos-2026-08-29.md
?? lote2c-pagamentos-2026-08-29.md
?? lote2e-pagamentos-2026-08-30.md
```
