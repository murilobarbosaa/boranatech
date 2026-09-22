# ADM-D08A-P1-R1 — recuperação de Páginas

Base original: `github/main` em `a6308c459c203d329739cc89075042017db263c3`. Rebase de publicação sobre `github/main` em `18d53e1c585ac96719bb2b4580c5ac2b3ac2f85a`. Trabalho somente no worktree `/tmp/boranatech-admin-pages-posthog-timeout`, com PostHog dublado por mocks. Nenhum dado real, PostHog real ou produção foi consultado.

## Causa reproduzida e orçamento

`PagesDashboard` pedia `/api/admin/posthog-stats`, que chamava `getPosthogStats` e iniciava nove HogQL em um único `Promise.all`. A fixture respondeu pageviews, páginas, pageleave e sinais de sessão normalmente, mas atrasou `conversion_events` e devolveu `TimeoutError` sintético após 20 ms: o leitor retornou `state:error` para Páginas. O abort observado na aplicação nasce do `AbortSignal.timeout(8000)` do `runPosthogQuery`, no backend, antes do `Promise.all` rejeitar. A frase do abort não identifica uma query por si só. O navegador não recebia o nome lógico da query. O teste registrou nome e duração de cada pedido simulado; as nove consultas foram disparadas inclusive quando a primeira falhou. Na rodada focal, oito respostas imediatas levaram de 0,0006 a 0,0028 ms no mock e `conversion_events` levou 20,56 ms; o leitor isolado registrou as cinco consultas em 0–1 ms no relógio do servidor simulado. Esses tempos não medem HogQL real.

Antes, apenas o `/posthog-stats` sem janela explícita usava cache de 30 dias por chave fixa/TTL 5 minutos. `from/to` de Páginas entrava no caminho live e recalculava as nove consultas a cada abertura; o fim com `new Date()` mudava a cada milissegundo entre montagens. Duas aberturas equivalentes repetiam a leitura. O componente tinha guarda `cancelled` que evitava commit de resposta após troca de período/desmontagem, mas não abortava o fetch em andamento.

| Consulta lógica   | Antes | Páginas isoladas | Uso nesta aba             |
| ----------------- | ----: | ---------------: | ------------------------- |
| pageviews         |   sim |              sim | total/denominador         |
| unique_users      |   sim |              não | nenhum                    |
| pages             |   sim |              sim | top 10 atuais             |
| conversion_events |   sim |              não | nenhum                    |
| pro_gates         |   sim |              não | nenhum                    |
| acquisition       |   sim |              não | nenhum                    |
| pageleave         |   sim |              sim | tempo e scroll observados |
| exit_last         |   sim |              sim | numerador de saída        |
| exit_sessions     |   sim |              sim | denominador de saída      |

Uma leitura fria de Páginas passa de **9 para 5 consultas**. Uma conversão exclusiva lenta deixa de bloquear Páginas. A fixture de consulta imediata confirma cinco resultados e valores ausentes como `null`; a fixture lenta confirma erro no leitor antigo e sucesso no novo. Duas leituras idênticas simultâneas passam por um scan lógico; período diferente exige outro scan. Conversão continua usando `/posthog-stats`, compatível com seus consumidores. Se Conversão e Páginas forem abertas juntas, seus sinais compartilhados ainda podem ser consultados em ambos os leitores; eliminar essa duplicação entre contratos fica fora desta recuperação.

## Contrato, prazo e cache

`GET /api/admin/posthog-pages` devolve somente estado da fonte, período efetivo, timezone UTC, `computedAt`, cobertura top 10 e as métricas atuais. A mesma `pageQueries` constrói os pathnames e `assemblePageStats` calcula tempo, scroll e saída para o leitor antigo e o novo. Sinal comportamental ausente permanece `null`; página vazia com fonte válida é zero legítimo. Resposta HogQL truncada ou inconsistente retorna erro nomeado.

O timeout permanece **8 segundos por query**, sem aumento. A rota nova expõe apenas o nome lógico da consulta que falhou e motivo seguro; o servidor registra nome/duração, sem mandar HogQL, credencial ou corpo bruto ao cliente. Os testes usam uma consulta exclusiva de Conversão que dura 20 ms simulados e consultas necessárias imediatas; não medem latência de PostHog/PostgREST real.

O cache local guarda `ok` completo ou parcial **identificado**, por chave `UTC|from|to` canônica, TTL **60 segundos** e até 16 períodos. `computedAt` é fixado após a leitura e não muda no hit. Pedidos simultâneos equivalentes compartilham a Promise; `refresh=1` força nova leitura. Erro não entra no cache. Um parcial não pode se apresentar como completo e não dispara retry automático. A última fotografia completa do mesmo período é preservada separadamente e, após falha principal, só aparece como `previous`/“Dados anteriores” com horário. Uma geração por chave impede que uma leitura antiga sobrescreva o refresh novo. O cliente também ignora respostas obsoletas e aborta o fetch na troca de período ou desmontagem.

As janelas da aba usam dias UTC completos. O fim `to` é **exclusivo**, no início do dia seguinte; assim “Últimos 3 meses” conserva a mesma chave durante o dia, sem cortar os eventos do dia atual silenciosamente. A tela declara os dias efetivos e UTC. A rota aceita somente datas ISO UTC canônicas **à meia-noite**: HogQL recebe segundos e aceitar milissegundos arbitrários truncaria silenciosamente a fronteira. Rejeita com 400 data inválida, apenas uma data, intervalo invertido/vazio, parâmetro relevante repetido ou acima de **400 dias**. Um único dia inclui o início e 23:59:59.999, exclui exatamente a meia-noite seguinte. Mês atual começa no dia 1; últimos três meses no dia 1 de dois meses antes; últimos doze no dia 1 de onze meses antes; personalizado inclui o dia “Até”. **400 dias** são aceitos e **401** recusados. A divergência de timezone das outras abas do Admin em relação a Brasília permanece no ADM-13.

## Arquivos alterados

- Aba e testes: `client/src/components/admin/PagesDashboard.tsx`, `client/src/components/admin/PagesDashboard.test.tsx`.
- Leitores e testes: `server/lib/posthog.ts`, `server/lib/posthog.pages.test.ts`, `server/lib/posthogPages.ts`, `server/lib/posthogPagesCache.test.ts`, `server/lib/posthogPagesPeriod.ts`, `server/lib/posthogPagesPeriod.test.ts`, `server/lib/posthogTimeout.ts`.
- Rotas e testes: `server/routes/admin.ts`, `server/routes/adminPaidFunnel.test.ts`, `server/routes/adminRbacRoutes.test.ts`, `server/routes/adminUsersGuards.test.ts`.
- Manifesto e testes: `server/lib/adminRbac.ts`, `server/lib/adminRbac.test.ts`.
- Este relatório: `docs/investigacoes/2026-09-15-adm-d08a-posthog-pages.md`.

## Interface, segurança e validação

Carregamento inicial continua visível. Erro oferece “Tentar novamente”; refresh retém somente resultado válido do mesmo período, rotulado “Dados anteriores” com horário do cálculo. `not_configured`, `error`, `ok` e `hasData` continuam distintos. Backend antigo sem `/posthog-pages` ou payload incompatível aparece como indisponibilidade e permite retry, nunca como zero. A rota é somente leitura sob `requireAuth`, `requireAdmin` e RBAC observe; `dashboard.read` recebeu o GET novo. Na base original o manifesto iria de 129 para 130 rotas; no rebase de publicação, a `main` já possuía 136 e esta rota elevou o total a **137**, com 71 GET. Nenhum dado pessoal é retornado.

Capturas sintéticas do componente real: `/tmp/boranatech-admin-pages-posthog-timeout-captures/pages-{ok,refresh,error,stale-error}-{1440x1000,390x844}.png`. Nos oito estados/tamanhos, `document.scrollWidth` igualou o viewport (1440 ou 390 px); no celular a tabela tem 760 px internos dentro de 354 px e indica o deslize, sem overflow do documento. Controles exibiram foco visível. O HTML e script temporários da fixture foram removidos; Visão e Financeiro não tiveram código/CSS alterado.

Testes focais de PostHog, rota, cache, períodos, PagesDashboard, Visão e RBAC passaram. A primeira regressão ampla detectou três mocks antigos sem a constante exportada de `posthog.ts` e uma contagem deliberada de rotas desatualizada; ambos foram corrigidos sem mudar o contrato público. Uma checagem TypeScript posterior encontrou o spread de um `MapIterator` na limpeza do cache; `Array.from` resolveu o erro e a checagem final passou. Regressão ampla: **469 arquivos, 6.179 testes aprovados, zero falhas finais; 5 arquivos e 18 testes skipped preexistentes**. Após a limpeza do cache, os testes focais de concorrência passaram. `pnpm check:all` final (TypeScript principal/de scripts e checks locais), Prettier dos 16 arquivos, build de cliente/servidor, manifesto RBAC e `git diff --check` passaram. Não houve migration nova/alterada. `check:migrations` permaneceu bloqueado por depender de banco remoto.

ADM-05/06/07/13/20: **parcialmente resolvidos** somente na disponibilidade e integridade da aba Páginas. D08B ainda precisa listar todo o conjunto, buscar/paginar, agrupar rotas dinâmicas, expandir cobertura, definir atividade/tempo e medir retenção comparável. O custo HogQL real, cobertura histórica e instrumentação não foram medidos nesta etapa.

## Revisão R1 — matriz e degradação

A primeira reprodução provou o acoplamento a Conversão, mas não qual consulta causou o timeout de produção. R1 simulou **individualmente as cinco consultas reais**. Cada linha recebeu sucesso, timeout, HTTP 503, payload inválido e vazio legítimo; a cada cenário foram iniciadas exatamente cinco consultas, em paralelo.

| Consulta        | Grupo                      | Sucesso/vazio válido                              | Timeout, HTTP ou payload inválido                                                          |
| --------------- | -------------------------- | ------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `pageviews`     | páginas e visualizações    | número/zero confirmado; vazio legítimo é `[[0]]`  | erro principal, código `posthog_pages_core_unavailable`; `results:[]` é truncado, não zero |
| `pages`         | páginas e visualizações    | ranking/top 10; `[]` legítimo quando total é zero | erro principal, lista indisponível                                                         |
| `pageleave`     | tempo e scroll             | média observada ou `null` se sem medição          | páginas/pageviews permanecem; médias `null`, grupo `unavailable`                           |
| `exit_last`     | taxa de saída, numerador   | taxa observada ou `null`                          | páginas e outros grupos permanecem; taxa `null`, grupo `unavailable`                       |
| `exit_sessions` | taxa de saída, denominador | taxa observada ou `null`                          | páginas e outros grupos permanecem; taxa `null`, grupo `unavailable`                       |

`Promise.allSettled` mantém os cinco pedidos independentes. A resposta `ok` declara `availability.pages`, `availability.timeScroll`, `availability.exitRate` e `coverage.complete`. Quando uma metade da taxa de saída falha, **numerador e denominador são descartados juntos**; não se calcula média/taxa com base incompleta. `null` numa métrica de grupo disponível é ausência de medição; `null` acompanhado de `unavailable` é falha da fonte. O cliente valida esse contrato: backend antigo, cobertura contraditória ou taxa numérica com grupo indisponível viram estado incompatível, nunca zero. O erro principal preserva fotografia anterior somente do mesmo período e a rotula desatualizada; o parcial atual mantém páginas e pageviews, com um aviso por grupo e botão de nova tentativa. Nenhuma célula dispara alerta repetido.

Logs do servidor usam somente nome lógico, duração arredondada, categoria (`timeout`, `http_error`, `invalid_payload`, `network_error`), HTTP quando disponível e período UTC. Não contêm SQL, chave, corpo bruto, ids de pessoas ou URL de eventos. O navegador recebe código estável e falhas nomeadas, sem detalhe do provedor. Timeout continua em 8 segundos por consulta, sem aumento. Uma consulta complementar lenta não inicia novas consultas nem retries automáticos; `refresh=1` faz nova leitura explícita.

Fixtures sintéticas de R1: sucesso completo, falha de `pageleave`, de `exit_last` e de `exit_sessions`, pedidos equivalentes simultâneos, refresh após parcial e troca de período. Cinco pedidos substituem os nove da implementação antiga. O mock de timeout dura cerca de 20 ms; as demais respostas são imediatas, e o conjunto termina após o pedido lento, pois os cinco correm em paralelo. Medidas: `pageleave` 19,90 ms/total 21,04 ms; `exit_last` 20,46/21,23 ms; `exit_sessions` 19,90/20,75 ms. Esses números são somente do mock, não um limite de aceitação. Cache/deduplicação reduzem dois pedidos idênticos simultâneos a um scan lógico de cinco consultas; período diferente é outro scan. O custo real de HogQL permanece desconhecido sem execução autenticada, que foi proibida nesta etapa.

Capturas R1 com fixture sintética: `/tmp/boranatech-admin-pages-posthog-timeout-r1-captures/pages-{ok,time,exit,error,refresh}-{1440x1000,390x844}.png`, com medidas em `measurements.json`. Nos dez estados/tamanhos, largura do documento igualou 1440 ou 390 px. No celular, a tabela rola internamente de 354 px para 760 px, sem overflow do documento; os controles mostraram foco visível. O aviso de indisponibilidade aparece uma vez por grupo acima da tabela. A fixture e o script temporários foram removidos. Não houve mudança em Visão, Conversão, Retenção, Usuários ou Financeiro; `/posthog-stats` continua no contrato antigo. Após rebase, manifesto tem **137 rotas**, incluindo o GET `/posthog-pages` sob `requireAuth`/`requireAdmin`, capability `dashboard.read`, RBAC observe.

Validação R1: testes focais de leitor, matriz, cache/concorrência, períodos, rota, autorização, manifesto e componente: **8 arquivos/135 testes aprovados**. O teste adicional de payload contraditório passou isoladamente. Regressão completa final após a mudança funcional: **469 arquivos/6.217 testes aprovados, zero falhas finais, 5 arquivos/18 testes skipped preexistentes**. TypeScript principal e de scripts (`pnpm check:all`), Prettier, builds cliente/servidor e `git diff --check` passaram. Nenhuma migration foi criada ou alterada. `check:migrations` e verificações autenticadas ficaram **bloqueados** por exigirem banco/serviço remoto, fora do escopo autorizado. Falhas intermediárias nos testes focais foram apenas fixtures antigas ou mocks sem terceira resposta, corrigidos antes da validação final.
