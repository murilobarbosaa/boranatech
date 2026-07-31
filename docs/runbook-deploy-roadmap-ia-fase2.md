# Runbook de deploy: Fase 2 do Roadmap com IA

Escrito em 2026-07-30 para ser **executado por uma pessoa**, não por mim. Nada
neste documento foi executado: nenhum push, nenhuma migration aplicada, nenhum
merge.

Estado de partida (revisado em 2026-07-31): branch
`fix/roadmap-ia-intake-desbloqueio`, **16 commits**, nada empurrado. `origin/main`
avançou para `bd4b91d` e a branch está **16 à frente e 3 atrás**. Produção roda
`bd4b91d`.

**Este runbook cobre DUAS frentes na mesma branch.** Além das migrations do
Roadmap, a branch carrega `20260730190000` (reembolsos), commitada por `9529487`.
A órfã `20260713160000` **não será aplicada** (ver
`docs/debito-ledger-migrations.md`).

## Passo 0-A — a frente de reembolsos está deployável ou desacoplada?

**Pré-condição de tudo. Não pule.** A branch leva a migration de reembolsos, e o
código que a consome pode não estar junto.

```bash
cd /home/s0ft/boranatech
git status --porcelain                     # o que da frente de reembolsos ficou de fora
git log --oneline origin/main..HEAD | cat  # o que a branch leva
git show --stat 9529487                    # o que a migration de reembolsos traz
```

Em 2026-07-31 o estado era: `9529487` commitou **só o arquivo de migration**, e o
código consumidor (`server/routes/admin.ts`, `server/lib/proRevocation.ts`)
estava **fora do commit**. Isso é o desacoplamento que torna o push seguro:

- **Migration sem código é inócua aqui.** Migration não é aplicada por deploy
  nenhum; ela só existe como arquivo até alguém rodar o SQL. E o guard é **cego**
  para a `190000` (só `ALTER TABLE`, nada que ele conte), então ela não muda o
  veredito do CI. Verificado: o guard rodado numa worktree SEM esse arquivo dá
  saída idêntica à da árvore COM ele.
- **Código sem migration seria o perigoso**, e é o que não pode acontecer: se
  `admin.ts` lendo `settlement` for para produção antes de a `190000` ser
  aplicada, a área de reembolsos quebra em runtime.

**Sucesso:** ou (a) a frente de reembolsos não tem código consumidor commitado na
branch — pode seguir; ou (b) tem, e então a `190000` precisa ser aplicada no
mesmo deploy, e o passo 6-B abaixo deixa de ser opcional.
**Se nenhuma das duas:** pare e alinhe com a outra frente antes de empurrar.

## Passo 0-B — sincronizar com a main (rebase, não merge)

A branch está **3 atrás**: `42986d9`, `5926dc2`, `bd4b91d`. A política do projeto
é fast-forward, e `git rev-list --count <branch>..origin/main` precisa dar **0**
antes do merge — hoje dá 3.

**Recomendação: `git rebase origin/main`.** Merge criaria merge commit, que a
política proíbe.

**Risco de conflito: praticamente nulo, e isso foi medido, não estimado.**

- Os únicos arquivos tocados pelas duas pontas são `CLAUDE.md` e
  `scripts/checkMigrationsApplied.mts`.
- `git merge-tree --write-tree HEAD origin/main` **não produz conflito** (exit 0,
  árvore `6ca4772`), e o guard na árvore fundida sai correto: `EXPECTED_TABLE_COUNT
= 82` e `EXPECTED_RLS_COUNT = 82` uma única vez, comentário não duplicado, e as
  asserções comportamentais preservadas.
- `git log --cherry-mark --left-right origin/main...HEAD` marca `3c5f486` e
  `42986d9` com `=`: **são o mesmo patch**, commitado dos dois lados. O rebase
  descarta o meu sozinho, sem intervenção.

Depois do rebase, reconferir: `git rev-list --count HEAD..origin/main` = 0, e
`pnpm check && pnpm test` verdes.

## A ordem é obrigatória, e não é a intuitiva

**Migration `170000` → push/CI → deploy do server → deploy do front → migration
`180000`.**

O que fixa cada elo:

1. **`20260730170000` antes do push.** O guard novo (asserção comportamental do
   Q1.a) exige que `ai_usage_excluded_tools()` exista em produção. O job
   `migrations` do CI roda em **todo push, de qualquer branch**, contra os
   secrets de produção (`.github/workflows/ci.yml`). Empurrar antes de aplicar
   deixa o CI vermelho por causa do guard que nós mesmos escrevemos.
2. **Server antes do front.** É a única ordem que não quebra ninguém, e é o
   contrário do que a infra faz sozinha (a Vercel costuma terminar antes do
   Railway). Ver a matriz abaixo.
3. **`20260730180000` depois do server.** O índice único parcial precisa do
   handler que traduz `23505` em 429, e esse handler está no código novo.

### Matriz de compatibilidade

A análise foi feita contra `47e6a32` e continua valendo para `bd4b91d`, que é o
que produção roda hoje. Não é suposição: os 9 arquivos da superfície do Roadmap
(`server/routes/aiRoadmap.ts`, `server/lib/aiRoadmap/intakeChat.ts` e
`generate.ts`, `client/src/pages/RoadmapIA.tsx`,
`client/src/services/aiRoadmapService.ts`, `shared/aiRoadmap.ts`,
`client/src/components/ai/IntakeChatPanel.tsx`, `server/lib/aiUsage.ts`,
`server/middleware/auth.ts`) têm **o mesmo hash de blob** nos dois commits. O que
a main ganhou no meio foi admin, billing, LinkedIn e telemetria, nada do fluxo do
Roadmap.

|                  | server em produção (`bd4b91d`)       | server novo |
| ---------------- | ------------------------------------ | ----------- |
| client `bd4b91d` | hoje, ok                             | **ok**      |
| client novo      | **QUEBRAVA** (corrigido, ver abaixo) | destino, ok |

**client velho × server novo: seguro.** A resposta do chat é puramente aditiva:
`{reply, intake, missing, ready}` ganhou `canGenerate`, `missingToGenerate`,
`restantes`, `maxMensagens`. O campo `ready`, de que o bundle antigo depende para
mostrar o botão, **continua sendo enviado** (`server/routes/aiRoadmap.ts`, o
`res.json` do turno). Nenhum código de erro mudou: `turn_limit`,
`payload_too_large`, `invalid_request`, `rate_limited` (429), `rate_check_failed`
(503), `pro_required` (403) e `upstream_error` (502) são os mesmos, com os mesmos
status. Os frames SSE são idênticos byte a byte. O bundle antigo prefixa a
semente a cada turno, e o servidor novo a remove em qualquer posição
(`stripKickoff`), então não há semente duplicada nem orçamento errado. No
`/generate`, `buildGenerationIntake` é **mais permissivo** que o
`RoadmapIntakeSchema.safeParse` antigo (campo opcional inválido é descartado em
vez de bloquear) e idêntico nos três campos obrigatórios: nada que o client
antigo mandasse e o server antigo aceitasse passa a ser recusado.

**client novo × server velho: era uma quebra dura, e foi corrigida.** O bundle
novo abre a conversa com **histórico vazio** (`runTurn([], true)`), porque a
semente passou para o servidor. O backend em produção rejeita corpo vazio com
`invalid_request` (`intakeChat.ts:99`, `!Array.isArray(raw) || raw.length === 0`),
e o client novo mapeia `invalid_request` para um bloqueio **não-transiente**, sem
botão de tentar de novo. Efeito: **a conversa não abria**, para todo mundo, na
janela de 1 a 3 minutos entre a Vercel e o Railway.

Correção (commit `fix(ai-roadmap): let the new bundle open the chat against the
previous backend`): o turno de abertura, e só ele, tem **uma** tentativa de
compatibilidade que reenvia apenas a semente. Contra o backend antigo é
exatamente o que ele espera; contra o novo é inofensiva, porque a semente é
removida e não entra no orçamento (travado por teste). A constante do texto passou
a morar em `shared/aiRoadmap.ts`, importada pelos dois lados, porque duas cópias
mantidas à mão divergiriam em silêncio e o servidor deixaria de reconhecê-la.

Isso vale mais do que a sequência de deploy: **um rollback do server inverteria a
ordem**, e o bundle novo já estaria em cache nos navegadores. A defensividade
cobre os dois sentidos; a sequência sozinha não cobriria.

Remoção programada do retry: **após 2026-08-30** (marcada no código).

---

## Passos

Legenda de executor: **[você]** = pessoa; **[eu]** = pode ser delegado a mim.

### Passo 0 — pré-condições [você]

```bash
cd /home/s0ft/boranatech
git status --porcelain            # so o que a outra frente ainda nao commitou
git log --oneline -1              # ultimo commit
pnpm check && pnpm test           # verde
```

**Sucesso:** `pnpm check` sem erro, suíte verde.
**Se falhar por arquivo que não é da Fase 2:** não conserte, não stashe. A
verificação da Fase 2 se faz numa **worktree limpa**, que é imune ao que está
solto na árvore principal:

```bash
git worktree add --detach /tmp/wt-fase2 HEAD
ln -s /home/s0ft/boranatech/node_modules /tmp/wt-fase2/node_modules
cd /tmp/wt-fase2 && pnpm check && pnpm test     # sem .env: e a condicao do CI
git worktree remove --force /tmp/wt-fase2
```

O symlink de `node_modules` custa 0 bytes e 0 segundo, e evita um
`pnpm install` inteiro. A worktree também não tem `.env`, então a suíte roda na
condição real do CI de graça.

### Passo 1 — aplicar `20260730170000_ai_usage_excluded_tools.sql` [você]

SQL Editor do Supabase, **arquivo inteiro**, de uma vez.

Aditiva e idempotente: cria uma função e faz `create or replace` de duas. Não
altera nem remove dado. **Isenta da janela destrutiva**, pode rodar a qualquer
hora.

**Check:**

```bash
set -a && . ./.env && set +a && pnpm check:migrations
```

**Sucesso:** o guard fica **verde**. Hoje ele falha exatamente com
`ausente: public.ai_usage_excluded_tools()`; essa linha tem que sumir e a
asserção comportamental precisa dar veredito, afirmando os 4 tools.

**Estado intermediário (produção com a função nova + código `47e6a32`):**
**seguro, e já é uma melhoria.** As assinaturas de `get_ai_usage_today(uuid)` e
`reserve_ai_usage_slot(uuid, text, integer)` não mudam: mesmos nomes, mesmos
parâmetros, mesmos tipos de retorno. Só o corpo muda. O código que está rodando
chama as duas por RPC e não sabe a diferença. O efeito para quem usa é que **a
cobrança dupla para no ato**, antes mesmo do deploy do código.

Equivalência do predicado, provada contra os dados reais e não por leitura: com a
mesma lista de 3, a versão antiga (`is distinct from`) e a nova
(`tool is null or tool <> all(...)`) contam **984 de 1204** linhas, iguais; a
tabela-verdade bate nos 6 casos, inclusive `tool` nulo, que continua **contando**
nas duas. `ai_usage_logs.tool` é `NOT NULL` em produção e há **0** linhas nulas,
então o ramo do NULL é defesa, não necessidade. Com a lista de 4, a contagem cai
para 711: os **273 registros** de diferença são a cobrança dupla que para.

**Rollback:** reaplicar o corpo anterior das duas funções (está em
`20260727150000_reserve_ai_usage_slot.sql` e no `_archive` para
`get_ai_usage_today`) e `drop function public.ai_usage_excluded_tools()`. Sem
perda de dado: nada é reescrito, as duas funções são calculadas na chamada. Mas
note que o CI voltaria a ficar vermelho, de propósito.

### Passo 2 — push da branch [você]

```bash
git push -u origin fix/roadmap-ia-intake-desbloqueio
```

**Check:** os dois jobs do CI verdes (`qualidade` e `migrations`).

**Pré-condição do job `migrations`, medida e não suposta:** ele roda contra
**produção**, com o conjunto de arquivos da branch. Rodado hoje, o único item
vermelho é `ausente: public.ai_usage_excluded_tools()` — **da Fase 2, e mais
nada**. As asserções de tamanho passam (`82 tabelas`, `82 RLS`) porque
`admin_refunds` já existe em produção desde `1bb48ca`, que já está em
`origin/main`. A `190000`, não aplicada, **não** deixa o guard vermelho, porque
ele é cego para `ALTER TABLE`.

Logo: **aplicar a `170000` (passo 1) é a única pré-condição para o CI ficar
verde.** A frente de reembolsos não bloqueia o push.

**Estado:** produção intocada. Push não deploya.
**Rollback:** `git push origin --delete fix/roadmap-ia-intake-desbloqueio`.

### Passo 3 — fast-forward para `main` [você]

```bash
git rev-list --count fix/roadmap-ia-intake-desbloqueio..origin/main   # tem que dar 0 (passo 0-B)
git checkout main && git merge --ff-only fix/roadmap-ia-intake-desbloqueio
git push origin main
```

**Check:** `0` no comando acima ANTES do merge. Se não der 0, pare: não é
fast-forward e a política do projeto não prevê merge commit.

### Passo 4 — deploy do SERVER (Railway), e só dele [você]

O Railway sobe sozinho no push para `main`. A Vercel também. **Não dá para
impedir**, então a ordem "server antes do front" é uma preferência, não uma
garantia — e é por isso que o passo existe como verificação, não como controle.
A defensividade do turno de abertura é o que torna a inversão tolerável.

**Check, em amostra única (nunca por frequência):**

```bash
curl -s https://<api>/api/health | grep -o '"uptime":[0-9.]*'
```

**Sucesso:** `uptime` pequeno, indicando processo novo. Uma requisição basta; não
faça loop de polling contra `boranatech.com.br` (150 requisições em 5 minutos já
dispararam a mitigação da Vercel uma vez, e cegaram a própria medição).

**Estado intermediário (server novo + front antigo):** seguro, célula
`client em produção × server novo` da matriz.

### Passo 5 — deploy do FRONT (Vercel) [você]

**Check:** o nome do bundle no `index.html` mudou.

```bash
curl -s https://boranatech.com.br/ | grep -o 'assets/index-[a-zA-Z0-9]*\.js'
```

**Sucesso:** hash diferente do de antes do deploy. Uma requisição.

**Estado intermediário (front novo + server antigo), se a Vercel ganhar a
corrida:** tolerado pela correção do turno de abertura. Uma pessoa que abrir a
página nessa janela vê a conversa começar normalmente.

**Rollback do server, se preciso:** a pergunta que importa é se o bundle novo,
já em cache, funciona contra o server velho. **Funciona**, por causa do retry de
compatibilidade. Sem ele, não funcionaria, e o rollback deixaria o produto pior
que o bug original.

### Passo 6 — aplicar `20260730180000_ai_roadmaps_one_generating_per_user.sql` [você]

**Só depois do passo 4 confirmado.** SQL Editor, arquivo inteiro.

Aditiva e idempotente (`CREATE UNIQUE INDEX IF NOT EXISTS`). Isenta da janela.

Pré-condição já verificada em 2026-07-30: `ai_roadmaps` tem 18 `ready`, 2
`partial` e **0 `generating`**, então não há duplicata que faça a criação falhar.
**Reconfira antes de aplicar**, porque isso muda com o uso:

```sql
select status, count(*) from public.ai_roadmaps group by status;
```

Se aparecer mais de uma linha `generating` **do mesmo usuário**, a criação do
índice falha. Nesse caso, espere as gerações terminarem (o código novo expira
`generating` órfão para `failed`) e tente de novo.

**Por que não antes do código**, medido no fonte de `47e6a32`: o
`insertRoadmapRow` de lá trata **qualquer** `23505` como colisão de slug
(`aiRoadmap.ts:148`), regenera o slug e tenta de novo até 3 vezes. Com o índice e
sem o handler novo, um clique duplo gastaria as 3 tentativas, cada uma
descartando um esqueleto já gerado pela OpenAI, e terminaria num frame SSE
`{type:"error"}` com a mensagem genérica "Nao consegui montar seu roadmap agora".
Não é um 500 (o `catch` de esqueleto pega, e o `logAiUsage` com status `error`
devolve a vaga reservada), mas é um beco: repetir dá o mesmo erro enquanto a
outra geração estiver ativa.

**Segundo escritor, achado nesta auditoria e não óbvio:** o `/resume` também põe
`status='generating'`, por **UPDATE**, então ele colide com o mesmo índice. O
código novo não tratava isso e devolveria o 503 genérico `resume_lock_failed`.
Corrigido no commit `fix(ai-roadmap): translate the one-generating collision on
resume into the same 429`: os dois caminhos agora usam a mesma classificação
(`isOneGeneratingCollision`, módulo puro, testado) e devolvem o mesmo 429. Não há
terceiro escritor: os outros acessos a `ai_roadmaps` em `47e6a32` são `select` ou
`update` para status terminal.

**Check:**

```sql
select indexname from pg_indexes
 where schemaname='public' and tablename='ai_roadmaps'
   and indexname='ai_roadmaps_one_generating_per_user';
```

**Sucesso:** uma linha.
**Rollback:** `drop index if exists public.ai_roadmaps_one_generating_per_user;`
Sem perda: índice não guarda dado.

### Passo 6-B — `20260730190000` (reembolsos), se e só se o código dela subiu [você]

**Não é da Fase 2.** Está aqui porque a branch a carrega, e esquecê-la seria
repetir a `20260710120000` (código no ar, migration no repositório, feature morta
em produção).

**Ordem entre as três: irrelevante.** Não há objeto em comum. A `170000` mexe em
funções de cota (`get_ai_usage_today`, `reserve_ai_usage_slot`,
`ai_usage_excluded_tools`); a `180000` cria um índice em `ai_roadmaps`; a
`190000` altera `admin_refunds` e `content_audit_logs`. Conjuntos disjuntos.

**Aditiva**, e por isso isenta da janela destrutiva: `ADD COLUMN IF NOT EXISTS
settlement NOT NULL DEFAULT 'stripe_api'` (as linhas existentes recebem o
default, que é o que elas são), mais duas trocas de CHECK. A de `admin_refunds`
restringe a 3 valores, e todas as linhas existentes ficam com `stripe_api`, que
está no conjunto. A de `content_audit_logs` **alarga** o conjunto (acrescenta
`refund_external` e `revoke_pro`), e alargar CHECK não pode falhar sobre linha
existente.

**Check:**

```sql
select column_name from information_schema.columns
 where table_schema='public' and table_name='admin_refunds' and column_name='settlement';
```

**Sucesso:** uma linha. **Atenção:** o guard **não** verifica isto (checks,
colunas e constraints são pontos cegos, ver `docs/auditoria-pontos-cegos-guard.md`),
então `check:migrations` verde **não** prova que a `190000` subiu.

---

## Janela: nenhuma etapa exige horário de baixo tráfego

Veredito explícito. As duas migrations são **puramente aditivas** e, pela regra do
`CLAUDE.md`, isentas da janela de 05h-09h: uma cria função e substitui corpo de
duas (nenhum dado tocado), a outra cria índice. O rollback das duas é `drop` do
que acabou de ser criado, sem depender de backup.

A única ressalva é operacional, não de risco de dado: **evite aplicar o passo 6
enquanto houver geração em andamento**, porque a criação do índice falha se
existir mais de uma linha `generating` por usuário. Isso é um horário de menos
uso, não uma janela de backup.

---

## Verificação pós-deploy

### 1. A cobrança dupla parou

Antes de um turno de chat real, e depois dele:

```sql
select public.get_ai_usage_today('<user_id>');
```

**Sucesso:** o número **não muda** depois de mandar uma mensagem no chat de
intake. Se subir, a `170000` não pegou.

Conferência independente, que não depende da função:

```sql
select count(*) from public.ai_usage_logs
 where tool='roadmap-intake-chat' and status='success'
   and created_at >= date_trunc('day', now() at time zone 'America/Sao_Paulo');
```

Esse número **deve** subir (a cota dedicada conta), enquanto o anterior não sobe.
São os dois lados da mesma afirmação.

### 2. Alguém atravessou o funil inteiro

**O funil só pode ser validado DEPOIS do deploy, e por gente de verdade.** Ele é
100% client-side: `posthog.init` só existe em `client/src/main.tsx` e os seis
eventos vivem em `client/src/lib/analytics.ts`, que importa `posthog-js`. O
harness de smoke test fala HTTP com o servidor e **nunca carrega o bundle**, então
ele não emite nem pode emitir evento nenhum. Nenhuma quantidade de teste local
substitui esta verificação.

**Quando olhar:** 24h depois do deploy do frontend, não antes. Antes disso a
ausência de eventos é indistinguível de "ninguém entrou ainda", que é o mesmo
defeito do blip de disponibilidade registrado no `CLAUDE.md`.

No PostHog, sequência para um mesmo `distinct_id`:

`roadmap_ia_chat_iniciado` → `roadmap_ia_can_generate` →
`roadmap_ia_geracao_iniciada` → `roadmap_ia_geracao_concluida`.

**Sucesso:** pelo menos uma pessoa completa os quatro. Enquanto não houver, o
deploy não está validado, só instalado.

### 3. Nenhum `turn_limit` com `canGenerate` false

Esse é o beco sem saída original: a conversa acabou e a pessoa não podia gerar.

```sql
select count(*) from public.ai_usage_logs
 where status='rejected' and error_message='turn_limit'
   and created_at > '<instante do deploy>';
```

**Sucesso: zero.** No PostHog, o mesmo em outra fonte:
`roadmap_ia_chat_bloqueado` com `motivo='turn_limit'` e `can_generate=false`.
Um único evento desses é regressão e pede investigação, não espera.

Complementarmente, o Sentry recebe `[roadmap-ia] usuario TRAVADO` para os estados
de pessoa presa (throttle de 5 min). **Sucesso: nenhuma issue nova.**

### 3-bis. O índice único da 180000 funciona (só verificável AQUI)

**Não pode ser exercitado antes do deploy**, por decisão de sequenciamento: aplicar
o índice antes do código novo é exatamente o que a ordem deste runbook proíbe (o
handler que traduz `23505` em 429 está no código novo). Então esta verificação é
pós-deploy, e é obrigatória.

**Teste:** com o servidor novo no ar e a `180000` aplicada, dispare **dois
`POST /api/roadmaps-ia/generate` concorrentes** com o mesmo intake, na mesma
conta, dentro da janela de 5 minutos.

**Sucesso:** um devolve o stream normalmente e o outro devolve **429
`generation_in_progress`**.

**Falha, e o que cada uma significa:**

- **500**, ou o stream morrendo com `{type:"error"}` genérico: o handler não
  reconheceu o `23505`. Provável causa: o nome do índice divergiu de
  `ONE_GENERATING_INDEX` em `server/lib/aiRoadmap/oneGenerating.ts`. Os dois estão
  acoplados de propósito e a migration avisa disso no cabeçalho.
- **Duas gerações nascendo**: o índice não foi criado. Reconferir o passo 6.
- **429 vindo da checagem antiga** (antes de qualquer insert) também é sucesso
  parcial: significa que a corrida não aconteceu nesta tentativa. Repita até a
  colisão ocorrer de fato, ou force disparando as duas requisições em paralelo.

Confirme também que **não** houve o caminho das 3 tentativas de slug: no log do
servidor, uma colisão de geração não deve produzir três inserts seguidos nem três
esqueletos gerados. Um esqueleto descartado é uma chamada de OpenAI paga por nada.

### 4. Guard verde

```bash
set -a && . ./.env && set +a && pnpm check:migrations
```

**Sucesso:** exit 0, com a asserção comportamental afirmando os 4 tools.

### 4-bis. Excluir a conta do smoke test das métricas

O smoke test de 2026-07-31 rodou contra **produção** (não existe staging), sob a
conta admin **`6a9063c4-2bcb-4432-8a75-70fccc676851`**. Ela deixou, naquele dia,
15 linhas em `ai_usage_logs` (10 `success` e 4 `rejected` de `roadmap-intake-chat`,
1 `success` de `roadmap-generator`) e **1** roadmap, `ia-5de5a6c6`
(id `89e1b43a-c13a-49e2-a577-21f04cf4484c`).

**Exclua esse `user_id` de toda métrica pós-deploy.** Em especial: as 4 linhas
`rejected` com motivo `turn_limit` são do teste, e a verificação "zero
`turn_limit` com `canGenerate` false" precisa filtrá-las, senão parece regressão
logo no primeiro dia. Nada foi apagado, de propósito: deletar dado de produção
para arrumar a aparência de um teste é risco maior que o teste.

### 5. Os dados existentes continuam íntegros

```sql
select status, count(*) from public.ai_roadmaps group by status;
```

**Sucesso:** os **18 `ready` e 2 `partial`** de antes continuam lá (mais o que for
gerado depois). Nenhuma linha migrou de status sozinha.

---

## O número que diz que a demanda original foi resolvida

A demanda era "o roadmap não está sendo criado".

**O número: `roadmap_ia_geracao_concluida` por pessoa que iniciou o chat, em 7
dias.** Hoje o denominador existe e o numerador é o que estava faltando.

- **Em 48h:** pelo menos **uma** conclusão ponta a ponta de uma pessoa que não
  seja você, e **zero** `turn_limit` com `canGenerate` false. Isso já refuta a
  hipótese "ninguém consegue chegar ao fim".
- **Em 7 dias:** a taxa `chat_iniciado → geracao_concluida` acima de **50%**, e
  as duas linhas `partial` não crescendo. Abaixo disso, o problema mudou de lugar
  e o funil do P2 diz para onde, que é exatamente o que ele foi construído para
  fazer.

Antes da Fase 2 esse número não podia ser calculado: não havia evento nenhum
entre "abriu o chat" e "gerou". A resposta honesta a "está resolvido?" só existe
a partir deste deploy.
