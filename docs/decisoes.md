# Decisões de processo

Este arquivo guarda o porquê das regras que o `CLAUDE.md` enuncia em uma linha. Cada seção tem
âncora estável, e é essa âncora que o `CLAUDE.md` e as rules de `.claude/rules/` citam. Datas,
números medidos e nomes de arquivo ficam aqui, não lá.

A política de branch e deploy foi decidida em **2026-07-27**, depois de um lote de 94 commits
acumulados sem subir. Esse lote é o anti-padrão de referência: cada fase da auditoria deveria
ter sido um deploy com 24h de observação. Lote grande transforma qualquer problema numa
investigação entre 94 suspeitos, e adia a única verificação que vale, que é o comportamento em
produção. É daí que sai a regra de branch de dias, não de semanas.

<a id="hook-de-pre-commit"></a>

## Hook de pre-commit

Hook de pre-commit versionado em `.githooks/pre-commit` (suite inteira + **suite de novo sem `.env`** + `pnpm check`; a duracao NAO e afirmada aqui de proposito: ela depende da maquina e da carga, e este arquivo ja carregou quatro valores diferentes para ela, ~14s, ~64s, ~18,5s no cabecalho do proprio hook e ~142s medidos numa maquina carregada em 2026-08-01. Numero que erra quatro vezes nao e afirmavel; o que importa e a composicao dos passos). Roda a suite toda de proposito: a versao com lista de arquivos escrita a mao deixou passar um commit com 10 testes vermelhos. A segunda rodada renomeia o `.env` porque essa e a condicao real do CI, e a restauracao e conferida por md5 com trap em `EXIT INT TERM` (hook que deixa o `.env` renomeado seria pior que o problema que resolve). Roda a suite toda de novo em vez de "so os testes que leem env" porque a dependencia e transitiva (`janelaDeDeployInversa.test.ts` nao importa `./env`, importa `analyzeLinkedin`, que importa), e enumerar isso exigiria seguir o grafo de imports, ou seja, um parser que pode sub-casar em silencio. `pnpm check` COBRE `*.test.ts`, e a afirmacao anterior deste paragrafo ("NAO cobre, o tsconfig os exclui") era falsa: o `include` e `client/src/**/*`, `shared/**/*` e `server/**/*`, e o `exclude` e so `node_modules`, `build` e `dist`. A qualificacao que faltava: **cobre dentro dos diretorios do `include`**. `scripts/` ficava de FORA, e em 2026-08-01 o `checkMigrationsApplied.mts` subiu com um `ReferenceError` (variavel de bloco referenciada fora do bloco) com o `pnpm check` VERDE. Corrigido com `tsconfig.scripts.json`, que sobrescreve so o `target` (os scripts sao `.mts` com top-level await e o `tsconfig.json` da aplicacao nao declara `target`, caindo em ES5). **Ele roda como `pnpm check:scripts`, no CI, e NAO no hook de pre-commit**: o hook ja e o gate mais caro do fluxo, e gate lento vira `--no-verify`, que e a unica barreira que resta quando o sandbox esta fora. O custo medido do passo e ~6s a quente, entao a separacao nao e sobre esses 6s: e sobre nao acrescentar passo nenhum a um gate que roda a cada commit. Se alguem quiser junta-lo ao `pnpm check` daqui a tres meses, este e o motivo de nao estar la. **Duas afirmacoes erradas seguidas sobre a cobertura do proprio instrumento de cobertura**, num arquivo de regras, e o motivo de a regra agora citar o `include` explicitamente em vez de resumir. A afirmacao errada custava o inverso do que a regra existe para proteger: mandava PULAR uma checagem barata que de fato pega o erro, e foi o `tsc` que apontou os 15 call sites de `buildTransactionList` nos testes quando a assinatura mudou. Regra escrita errada em arquivo de regras e a pior classe de documentacao desatualizada, porque ensina o erro em vez de so omiti-lo. O `prepare` do `package.json` aponta o `core.hooksPath` sozinho no `pnpm install`; se o hook não estiver rodando, `git config core.hooksPath .githooks`. `--no-verify` só em emergência.

<a id="preview-vercel"></a>

## Preview da Vercel e as alternativas descartadas

**NÃO rodar análise em preview da Vercel.** `VITE_API_URL`, `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` estão no escopo Production **and** Preview, então o preview fala com o Railway e o Supabase de produção: uma análise rodada nele grava linha real em `linkedin_analyses` e consome cota de IA de verdade. Preview serve para ver a interface, não para exercitar fluxo. Duas alternativas foram descartadas em 2026-07-27, e o motivo fica aqui para a decisão não ser reaberta do zero: **desligar o preview** (`ignoreCommand` no `vercel.json`) tiraria a única forma de ver o frontend antes da `main`; **ambiente de ensaio de verdade** exige um segundo Supabase e um segundo Railway, com custo próprio e com o mesmo problema de sincronia de schema que `docs/ambiente-backup-restauracao.md` já recomendou evitar. `VITE_POSTHOG_KEY` e `VITE_POSTHOG_HOST` ficaram só em Production, então preview não polui telemetria (e o `posthog.init` sem chave não quebra: testado, ele loga e segue).

<a id="worktree-de-deploy"></a>

## Worktree de deploy: `/home/s0ft/bnt-main`

**`/home/s0ft/bnt-main` é o worktree de deploy, e ninguém edita lá.** Decidido em 2026-07-30, depois de um deploy travar por disputa de check-out: a `main` não estava em worktree nenhum, o lugar óbvio (`/home/s0ft/boranatech`) tinha trabalho não commitado de outra frente, e trocar de branch ali teria atropelado arquivo aberto. Com várias frentes em paralelo isso se repete toda vez, porque o git só permite uma branch por worktree. **O que o `bnt-main` aceita: `cherry-pick`, `merge --ff-only`, `push`. Editar arquivo, não.** O que precisa de edição nasce em branch própria, passa pelo CI e chega por fast-forward, inclusive documentação (a exceção "é só um doc" é exatamente como a regra apodrece). O isolamento é garantido pelo próprio git, não por disciplina: uma branch não pode estar em dois worktrees ao mesmo tempo.

<a id="worktree-lock"></a>

## `git worktree lock` e o hook de pre-commit descartado

**`git worktree lock` NÃO impede edição.** Protege contra remoção e `prune`, e nada mais. Foi testado com essa intenção e não serve; fica registrado para ninguém tentar de novo. Um hook `pre-commit` que recusasse commit vindo do `bnt-main` também foi descartado, e por um motivo que vale saber: **`git cherry-pick` não dispara `pre-commit`**, então o hook cobriria a edição manual e deixaria passar a operação principal do worktree. Barreira que não cobre o caso principal é pior que convenção, porque dá falsa segurança.

<a id="worktrees-paralelos"></a>

## Frentes paralelas em worktrees separados e as quatro colisões

**Frentes paralelas usam WORKTREES SEPARADOS, nunca o mesmo working tree.** Duas sessões editando o mesmo checkout colidem por construção, e nenhuma disciplina de `git add` resolve: o índice, o `HEAD` e a árvore de trabalho são únicos e compartilhados. Custou três colisões em 2026-07-30, todas no mesmo dia: (1) quatro scripts de investigação varridos para dentro de um commit de admin porque estavam na raiz do repositório na hora errada; (2) um `git reset --hard` planejado que teria apagado trabalho não commitado de outra frente, abortado só porque a árvore foi conferida antes; (3) um `git add <arquivo> && git commit` que levou junto 7 arquivos de outra frente, porque `git add` não limita o commit ao arquivo e o índice tinha sido preenchido entre a conferência e o commit. Nenhuma das três foi falta de cuidado no comando: a árvore compartilhada é que é o defeito.

**Experimento que modifica prompt roda em worktree separada, sem exceção, e o snapshot de restauração é da worktree, nunca da árvore principal.** Quarta colisão, 2026-08-05, e a mais cara porque durou 40 minutos e envolveu escrita nos dois sentidos. Um experimento A/B de prompt precisa alternar o arquivo entre dois estados, então ele faz `cp` de um snapshot em loop; rodando na árvore compartilhada, o `cp` final do `trap` reverteu um `generate.ts` que a outra frente tinha commitado no meio da rodada. E no sentido inverso, o commit da outra frente varreu junto a regra de prompt não commitada do experimento, publicando dentro do commit dela uma mudança de comportamento que ainda estava sendo medida (e que a medição depois reprovou). O `trap` estava certo e o snapshot também: o defeito é que **snapshot tirado antes de uma janela longa deixa de descrever a árvore no fim dela**, e árvore compartilhada garante que alguém escreva nessa janela. Worktree separada elimina os dois sentidos de uma vez, porque o `cp` só alcança arquivos que ninguém mais enxerga.

```bash
git worktree add /home/s0ft/bnt-<frente> -b <branch> main
cp .env /home/s0ft/bnt-<frente>/.env      # .env é gitignored, não vem no checkout
cd /home/s0ft/bnt-<frente> && pnpm install # ~2s: o store do pnpm é compartilhado e hardlinka
```

**Compartilhado entre os worktrees** (é o mesmo `.git`): objetos, **todas as branches e tags**, `git config` do repositório (portanto o `core.hooksPath`, e o pre-commit roda igual nos dois), `reflog` por ref, e o **stash**, que é uma ref global e é o lugar onde ainda dá para colidir. **Independente:** working tree, índice, `HEAD`, branch em uso, `node_modules`, `.env` e `dist/`. Uma branch só pode estar em check-out em UM worktree por vez, o que é uma trava útil, não um problema. Ao terminar: `git worktree remove <caminho>`, e `git worktree list` para conferir.

**`git add <arquivo>` não limita o commit àquele arquivo.** O commit leva o índice inteiro. Em árvore compartilhada, use `git commit -- <arquivos>`, que ignora o resto do índice; com worktree separado o problema não existe.

<a id="expand-contract"></a>

## Renomear campo de resposta é expand/contract

**Renomear campo de resposta é expand/contract com alias, nunca troca seca.** E o motivo não é a janela de deploy: é que **todo cliente com JS antigo em execução** continua lendo o nome velho até recarregar, e não existe prazo para isso. Aba aberta desde antes do deploy não é alcançada por redeploy nenhum do frontend; só o backend alcança. Medido nesta base: `f70f1b3` renomeou `skillsSugeridas` para `skillsParaEstudar`, única mudança não-aditiva em 94 commits, e o bundle anterior lia o nome antigo sem guarda (`.length` direto), então a ausência derrubava o render inteiro do resultado com `TypeError` em vez de degradar. O procedimento: (1) **expand**, o backend emite os dois nomes, na resposta E no que persiste, com data de remoção no comentário; (2) esperar o tempo de vida plausível de uma sessão; (3) **contract**, remover o alias no mesmo commit que atualiza o teste que trava a decisão (`server/lib/janelaDeDeployInversa.test.ts`).

<a id="medir-producao"></a>

## Medir estado de produção por endpoint declarativo

**Medir estado de produção por endpoint que DECLARA o estado, em amostra única. Nunca por frequência.** Estado que se afirma: `uptime` do `/api/health` (dá o instante em que o processo subiu, com uma requisição), o nome do bundle no `index.html` (dá qual build está sendo servido, com uma requisição). Estado que se infere de repetição: "bati de 2 em 2 segundos e num momento mudou". A segunda forma custa mais, mede pior e **tem efeito colateral**: um loop de 150 requisições em 5 minutos contra `boranatech.com.br` disparou a mitigação da Vercel (`x-vercel-mitigated: challenge`, 403 para tudo que não seja navegador), e o desafio cegou exatamente a medição que o loop existia para fazer. Além de não medir, apagou a evidência.

<a id="protecao-dentro-da-funcao"></a>

## Proteção dentro da função, nunca no call site

**Proteção dentro da função, nunca no call site.** A contramedida acima é de DETECÇÃO; esta é de PREVENÇÃO, e é mais barata. Guarda escrita no chamador precisa ser repetida em cada chamador e some no primeiro que alguém esquecer; guarda escrita dentro da função cobre todos os chamadores por construção, inclusive os que ainda não existem. Os dois casos desta base, medidos: `setScoreDelta` tinha **2 call sites e a guarda no chamador**, e um dos dois ficou sem a supressão por autodeclaração (corrigido com um funil único, `shared/linkedin/deltaFunil.ts`); `logAiUsage` tem **mais de oitenta call sites e a guarda dentro** (85 medidos em 2026-07-31, reconferidos em 2026-08-01), procurando a reserva por `(usuario, tool)`, e todos estão cobertos sem ninguém ter que lembrar de nada. O número vai com data de propósito: é uma medição, não uma asserção, e sem a data ele vira uma daquelas contagens à mão que este arquivo documenta como desatualizando no primeiro esquecimento. Quando a guarda não couber dentro, o teste que enumera os call sites da fonte é o plano B, não o A.

A "contramedida acima" a que o parágrafo se refere é a de detecção descrita em
`docs/postmortems-instrumentos.md`, seção "Afirmar o TOTAL, não só a pertinência".

<a id="fallback-vs-excecao"></a>

## Fallback de apresentação versus exceção

**Fallback para valor de APRESENTAÇÃO; exceção para valor que É a informação.** O resolver com fallback neutro (`faixaUiOf`, `notificationTypeMetaOf`) é a contramedida certa para cor, rótulo e ícone: degradar mantém a informação principal correta, e a página não cai. Ele é a contramedida ERRADA quando o valor lido do mapa é o dado em si. O critério de decisão em uma pergunta: **"degradar este valor produz um resultado que alguém pode confundir com correto?"** Se sim, lance. Medido nesta base: `TIER_WEIGHTS[check.tier]` com tier desconhecido fazia `possivel += undefined` e a nota inteira saía `NaN`, sem erro; peso zero ou peso de `opcional` seriam PIORES, porque devolveriam um número plausível e indistinguível do certo (mesma família do `contarLinhas` devolvendo `-1`). Hoje são 16 resolvers de apresentação e um caso de informação, que lança e nomeia o tier e o `check.id` na mensagem. Lançar é barato quando o código roda no servidor dentro do `try` da rota; no render do cliente, a conta é outra.

O lado do cliente dessa mesma regra: todo acesso a mapa indexado por um valor que vem do servidor (status, type, audience, category, enums em geral) passa por um resolver com fallback neutro, nunca acesso direto. Um enum novo que o bundle ainda não conhece derruba a página inteira, e isso já aconteceu em produção: `STATUS_META[item.status].label` quebrou o admin com `Cannot read properties of undefined (reading 'label')`. Referência de implementação: `notificationTypeMetaOf` em `client/src/lib/notificationTypeMeta.ts`.

<a id="origem-da-chave"></a>

## Classificar por origem da chave

**Classificar por ORIGEM da chave, nunca pela forma do acesso.** "É um `Record` indexado por variável?" parece a pergunta e não é; a pergunta é "de onde vem essa chave?". Numa varredura de 2026-07-31, três sítios do LinkedIn foram classificados como dívida pela forma e **dois eram falso positivo**: `LINKEDIN_CATEGORY_LABELS[d.categoria]` itera `LINKEDIN_CATEGORIES`, constante local, e `VERDICT_UI[verdict]` recebe o retorno de união fechada de uma função local. Só sobrou `LINKEDIN_CAMPO_LABELS`, cuja chave vem de `deterministic.keywordsCampos`, persistido. É a mesma família do critério lexical que perguntava "isto parece nome de pessoa?" e acusou 64 de 149: a forma é barata de medir e responde outra pergunta. Enumeração por forma serve para achar candidatos; o veredito exige seguir a origem. Inventário em `docs/mapas-indexados-por-valor-do-servidor.md`, com as colunas separando "traçado" de "candidato".

<a id="header-footer-remontam"></a>

## Header e Footer remontam a cada navegação

**Header/Footer remontam a cada navegação**: o `Layout` (Header + main + Footer) é renderizado DENTRO de cada página, não em volta do `<Switch>` (`App.tsx`), então o wouter desmonta e remonta o Header e o Footer a cada troca de rota, e todo `useState`/`useRef` local deles renasce. Estado que precisa SOBREVIVER à navegação vive em Context (montado uma vez em `App.tsx`), nunca em estado local do Header/Footer; estado efêmero de UI (dropdown aberto, drawer, modal) pode ficar local, porque resetar ao navegar é o comportamento desejado. Caso real: a animação de chegada do sino não disparava porque o `useRef` do contador anterior renascia semeado a cada navegação, corrigido movendo o sinal para o `NotificationsContext`. Efeitos de fetch no Header/Footer também disparam a cada navegação, então precisam de cache/Context (ex.: `client/src/lib/newsletterState.ts`, uma chamada por carga de app).

<a id="divida-gating-catalogo"></a>

## Dívida conhecida do gating de catálogo

Dívida conhecida do gating de catálogo: o gate por tier cobre a API (`server/routes/content.ts`), o DOM, o HTML prerenderizado e o JSON-LD, mas o catálogo completo continua extraível do bundle JS, porque `client/src/lib/data.ts` é a fonte canônica e é importada estaticamente pelas páginas. Fechar isso exige inverter a fonte canônica para o DB (servir só a amostra ao free no runtime), o que é um projeto à parte.

<a id="gatilhos-do-ci"></a>

## Gatilhos do CI: `push` e `pull_request`

**`on: push` sem filtro mais `pull_request` faz o workflow rodar DUAS vezes num PR do mesmo repositório.** Sem efeito hoje, porque o fluxo é branch e fast-forward, sem PR. Se PR voltar a ser usado, filtrar um dos dois gatilhos.

Esta nota saiu do `CLAUDE.md` em 2026-08-06 porque ela só importa a quem editar um workflow, e
passou a viver em `.claude/rules/github-workflows.md`, com escopo `.github/workflows/**`.
