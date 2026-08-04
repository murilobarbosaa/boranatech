# Runbook de deploy: Fase 2 do Roadmap com IA

> **FASE CONCLUÍDA E VERIFICADA EM 2026-08-04.** O que está abaixo da linha é o
> plano como foi escrito, mantido porque o raciocínio continua valendo para as
> próximas fases. O deploy em si **não seguiu este roteiro**: os commits da Fase 2
> foram para a `main` carregados por uma merge da frente de admin, e subiram
> junto com ela. O runbook não foi executado; foi ultrapassado.

## Como terminou, com os números medidos

| Verificação                       | Resultado                                                          |
| --------------------------------- | ------------------------------------------------------------------ |
| Código na `main`                  | 36 arquivos da fase, **nenhum ausente**, 29 idênticos ao preparado |
| `20260730170000` (lista canônica) | aplicada; asserção comportamental do guard **ok**                  |
| `20260730180000` (índice único)   | aplicado                                                           |
| `pnpm check:migrations`           | **verde**, nos dois sentidos, 0 tabelas expostas                   |
| Suíte na `main`                   | **2254 testes**, 0 falhas                                          |
| Roadmaps `ready`                  | 19 → **28** (+9 desde o deploy)                                    |
| Roadmaps `partial`                | 2 → **2** (não cresceu)                                            |
| Turnos de chat                    | **101** em 4 dias                                                  |
| Rejeições por `turn_limit`        | **ZERO**                                                           |
| Conversão conversou → gerou       | **50%** nos dias fechados                                          |

### Os dois testes da janela imediata, executados em 2026-08-04

Ambos rodaram contra produção, na conta de teste
`6a9063c4-2bcb-4432-8a75-70fccc676851`.

**Índice único: PASSOU.** Dois `POST /generate` concorrentes, mesmo payload:

| Requisição | Resultado                                                        |
| ---------- | ---------------------------------------------------------------- |
| Vencedora  | `ia-dcffb368`, 8 seções, chegou a **`ready`**                    |
| Perdedora  | `generation_in_progress` ("Voce ja tem um roadmap sendo gerado") |

A perdedora recebeu o erro **depois** do `sseInit`, como frame SSE em HTTP 200.
Isso é o esperado e é a prova de que veio do **índice**, não da checagem prévia de
concorrência: aquela responde antes de os headers saírem, com 429 de verdade.
Depois que o SSE abre, 429 deixa de ser expressável e o contrato vira o frame de
erro, com a mesma mensagem.

**Zero HTTP 500** e **zero ocorrências do caminho das 3 tentativas de slug** no log
do servidor, que eram os dois modos de falha que a D2 previu. **A perdedora não
deixou lixo**: nenhuma linha `generating`, e apenas 1 roadmap novo.

**Cobrança dupla: PARADA, agora com tráfego novo.**

| Momento         | Global | Dedicada |
| --------------- | ------ | -------- |
| Antes do turno  | 0      | 0        |
| Depois do turno | **0**  | **1**    |

Dedicada **+1**, global **+0**. Antes desta fase seria +1 nas duas. A prova
anterior (11 → 1) era recálculo histórico; esta é com requisição real.

**Efeito colateral verificado:** a geração perdedora gravou
`roadmap-generator / error / generation_in_progress` e **devolveu a vaga de
cota** — a global terminou em 1, não 2. É o `logAiUsage` com status diferente de
`success` liberando a reserva, exatamente como desenhado.

O número que responde à demanda original: **zero `turn_limit` em 101 turnos**. O
beco sem saída que motivou a fase não aconteceu nenhuma vez.

## O que este runbook errou, e vale para a próxima fase

O plano assumia uma branch isolada indo para a `main` por fast-forward. A
realidade foi outra: as duas frentes compartilharam a árvore de trabalho, e a
Fase 2 viajou dentro da merge da outra. **Nada disso quebrou o produto**, mas
invalidou quatro rodadas de preparação (rebase, `fase2-rebaseada`, `fase2-limpa`,
janela de freeze) que existiam para um caminho que não foi o usado.

A lição não é "o plano estava errado", é: **quando duas frentes dividem árvore, a
branch não é a unidade de deploy.** Ver "O episódio do índice sujo" em
`docs/divida-fase2-roadmap-ia.md`.

---

## Branches de preparação (todas obsoletas)

`fase2-rebaseada`, `fase2-limpa` e `backup-antes-rebase-0304` foram tentativas de
levar a fase à `main` por fast-forward. Nenhuma foi usada: a fase chegou lá pela
merge da frente de admin. Podem ser apagadas depois de confirmado que os últimos
commits de instrumento entraram.

## Nunca abrir o preview da Vercel para "testar"

O push da branch cria um preview. Ele fala com o **Railway e o Supabase de
produção** (`VITE_API_URL`, `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` estão
no escopo Production _and_ Preview, ver `CLAUDE.md`). Uma conversa iniciada ali
grava linha real em `ai_usage_logs`, consome cota de IA de verdade e entra nas
métricas que este runbook usa para validar o deploy.

Preview serve para **ver a interface**, nunca para exercitar fluxo.

## Commits órfãos a resgatar DEPOIS do deploy

Dois commits da frente de admin existem **só** na branch de trabalho
`fix/roadmap-ia-intake-desbloqueio` e **não** entram no deploy da Fase 2:

| Hash      | Assunto                                                                                 |
| --------- | --------------------------------------------------------------------------------------- |
| `45a2171` | fix(admin): paginate the ai usage and beta unlock aggregates past the postgrest row cap |
| `859e324` | fix(admin): measure churn by effective exits instead of an always-null timestamp        |

Vão para a `main` depois, pela frente de admin. O rename da branch de trabalho
fica para depois disso, para não haver peça móvel durante o deploy.

## PRÉ-FREEZE: o que precisa estar verdadeiro ANTES de a outra frente parar

A `20260730170000` **não é etapa do freeze, é pré-condição**. Se ela entrar na
janela e algo falhar, o freeze estica com a outra frente parada esperando.

| #   | O quê                                               | Como confirmar                                                                              | Dono  |
| --- | --------------------------------------------------- | ------------------------------------------------------------------------------------------- | ----- |
| 1   | `20260730170000` aplicada                           | `docs/verificacao-migration-170000.sql`, blocos ANTES e DEPOIS, as 4 verificações passando  | admin |
| 2   | `pnpm check:migrations` verde contra produção       | exit 0, sem linha `ausente:`                                                                | eu    |
| 3   | Árvore principal sem nada que bloqueie `git rebase` | `git status --porcelain` sem modificações não commitadas                                    | admin |
| 4   | O que for para o commit empurrado compila e passa   | `pnpm check && pnpm test` verdes na árvore que vai subir                                    | ambos |
| 5   | Decisão sobre `040000`/`040100` tomada              | se o código de bugs vai junto, as duas precisam estar aplicadas ANTES (ver ordem combinada) | admin |
| 6   | Cota da conta de teste disponível                   | dedicada abaixo de ~50/60, para o teste do índice pós-deploy                                | eu    |

Só depois dos seis o freeze começa.

## Sequência do FREEZE (NÃO EXECUTADA)

Mantida como referência: a janela medida foi de ~9 minutos, com o CI em 115s de
mediana. Não foi usada porque o deploy veio pela merge.

e o push. Na sessão de 2026-07-30 ela andou **cinco vezes**.

**Começa** quando a frente de admin para de commitar E para de empurrar para a
`main`. **Termina** no passo 4. Os passos 5 em diante **não** exigem freeze.

| #   | Quem  | O quê                                          | Comando                                                                                                                          | Tempo |
| --- | ----- | ---------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- | ----- |
| 1   | admin | parar de commitar e de empurrar para a `main`  | —                                                                                                                                | —     |
| 2   | eu    | rebase final                                   | `git fetch origin && git rebase origin/main`                                                                                     | 1 min |
| 3   | eu    | reverificação completa, na worktree sem `.env` | `pnpm check && pnpm test`, as 4 constantes uma vez cada, asserções do Q1.a, `pnpm check:migrations`                              | 4 min |
| 4   | você  | push da branch, CI verde, ff-only              | `git push -u origin fase2-rebaseada` e depois `git checkout main && git merge --ff-only fase2-rebaseada && git push origin main` | 8 min |
| —   | —     | **FIM DO FREEZE**                              | a frente de admin volta a commitar                                                                                               | —     |
| 5   | você  | confirmar server no ar                         | `curl -s https://<api>/api/health \| grep -o '"uptime":[0-9.]*'`                                                                 | 5 min |
| 6   | você  | aplicar a `180000`                             | SQL editor                                                                                                                       | 2 min |
| 7   | eu    | testar o índice                                | dois `/generate` concorrentes; sucesso = 429                                                                                     | 3 min |
| 8   | eu    | verificação pós-deploy                         | cota, integridade, funil                                                                                                         | 5 min |

**Janela de freeze: cerca de 9 minutos** (passos 2 a 4). O total até a
verificação imediata é de cerca de **24 minutos**, mas só os 9 primeiros
bloqueiam a outra frente.

O número do CI não é estimativa: medido em 2026-07-31 pela API do GitHub, sobre
as **15 execuções mais recentes** do `ci.yml`, todas com sucesso. **Mediana 115s,
média 116s, máximo 132s.** É por isso que o passo 4 caiu de 8 para 4 minutos.

**Se a frente de admin commitar por acidente no meio:** não quebra nada, **custa
uma reverificação**. Commit em branch própria é inofensivo; o que dói é **push
para a `main`**, porque aí o `merge-base --is-ancestor` falha e o ciclo dos
passos 2 e 3 recomeça do zero. A regra prática: durante o freeze, commitar local
é tolerável, empurrar para a `main` não é.

## Ordem combinada das DUAS frentes

Cinco migrations pendentes, e os conjuntos de objetos são **disjuntos**:

| Migration        | Frente       | Objetos                                                                          |
| ---------------- | ------------ | -------------------------------------------------------------------------------- |
| `20260730170000` | Roadmap      | funções `ai_usage_excluded_tools`, `get_ai_usage_today`, `reserve_ai_usage_slot` |
| `20260730180000` | Roadmap      | índice `ai_roadmaps_one_generating_per_user`                                     |
| `20260730190000` | reembolsos   | `admin_refunds.settlement`, CHECK de `content_audit_logs`                        |
| `20260731040000` | tarefas/bugs | CHECK `admin_tasks_type_check`                                                   |
| `20260731040100` | tarefas/bugs | DML em `admin_task_columns`                                                      |

**Nenhuma toca objeto de outra. A ordem ENTRE frentes é livre**; o que não é
livre é a ordem **dentro** de cada uma, em relação ao código que a consome.

**O risco concreto, e é da frente de tarefas:** o código de bugs lê
`type = 'bug'`, e o CHECK em produção **ainda não aceita esse valor** (medido em
2026-07-31: `CHECK (type = ANY (ARRAY['feature','melhoria','debito_tecnico','tarefa']))`).
Se esse código subir para a `main` junto com a Fase 2 **sem a `040000` aplicada**,
criar tarefa do tipo `bug` falha com violação de constraint. Não é degradação
suave: é erro na cara de quem usa.

**Checklist única, na ordem:**

1. **[admin]** aplicar `20260730190000` **se** o código de `settlement` já estiver na `main`.
2. **[tarefas]** aplicar `20260731040000` e `20260731040100` **antes** de o código de bugs chegar à `main`. Estas duas são a exceção à regra "código antes de migration": o CHECK precisa aceitar o valor **antes** de alguém tentar gravá-lo.
3. **[roadmap]** aplicar `20260730170000` (pré-condição do CI verde).
4. **[roadmap]** freeze, rebase, reverificar, push, CI, ff-only.
5. **[roadmap]** deploy das duas plataformas; confirmar server no ar.
6. **[roadmap]** aplicar `20260730180000`; testar o índice.
7. **[roadmap]** verificação pós-deploy.

## Nota da Fase 3: o roadmap montado não é revalidado

`concludeGeneration` decide `ready` versus `partial` **só** por
`failed.length === 0`; não há `safeParse` do `RoadmapV2` montado. O risco é
estreito e não foi observado: o número de seções é validado no esqueleto
(`.min(7).max(10)`, `generate.ts:787`) e não muda depois, os `children` de cada
seção são validados por chamada, e seção que falha vira `partial`. Nenhuma
instância nos 19 `ready`. Fica registrado, não é para consertar agora.

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

### A main se move. Reverificar não é opcional.

Na sessão de 2026-07-30 a `origin/main` andou **cinco vezes** enquanto a Fase 2
era preparada. Fast-forward apoiado numa verificação feita antes desse movimento
é o mesmo defeito das outras instâncias do `CLAUDE.md`: um instrumento dando
veredito sobre uma superfície que já mudou.

**Antes de CADA fast-forward, nesta ordem:**

```bash
git fetch origin
git merge-base --is-ancestor origin/main fase2-rebaseada && echo "OK: a main nao andou" \
  || echo "A MAIN ANDOU: rebasear de novo e REVERIFICAR"
```

O `merge-base --is-ancestor` é o critério: ele passa se e somente se
`origin/main` for ancestral da branch, que é a definição de fast-forward
possível.

**Se a main andou**, o ciclo inteiro se repete, sem atalho:

1. `git rebase origin/main`
2. na worktree limpa, sem `.env`: `pnpm check` e a suíte completa verdes;
3. as quatro constantes aparecendo **uma vez cada** e com os valores certos
   (`EXPECTED_TABLE_COUNT` 82, `EXPECTED_RLS_COUNT` 82,
   `EXPECTED_FUNCTION_COUNT` 27, `EXPECTED_TRIGGER_FUNCTION_COUNT` 4);
4. as asserções comportamentais do Q1.a ainda no guard (`grep -c
ai_usage_excluded_tools scripts/checkMigrationsApplied.mts` maior que zero);
5. `pnpm check:migrations` com o único vermelho esperado.

Ausência de conflito textual **não** substitui nenhum desses passos: as duas
frentes tocam `CLAUDE.md`, `scripts/checkMigrationsApplied.mts` e
`server/lib/env.ts`, e o código combinado só existe depois do rebase.

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

**Check:** `0` no comando acima ANTES do merge, e
`git merge-base --is-ancestor origin/main <branch>` passando. Se qualquer um
falhar, pare: não é fast-forward, e a política do projeto não prevê merge commit.
Volte ao passo 0-B, rebaseie e **reverifique tudo**.

**Empurrar a BRANCH não deploya produção**, medido por leitura de configuração:
não há workflow de deploy em `.github/workflows/` (só `ci.yml`) e o
`vercel.json` não tem `ignoreCommand`. Quem deploya são as integrações de GitHub
da Vercel e do Railway, e elas sobem produção a partir da `main`. O push da
branch dispara o CI e **um preview da Vercel**, que fala com o Railway e o
Supabase de PRODUÇÃO (ver `CLAUDE.md`): serve para ver a interface, nunca para
exercitar fluxo.

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

## Verificação em TRÊS janelas

"Fase 2 verificada" não acontece no mesmo dia. O funil é client-side e precisa de
gente real; antes de 24h, ausência de evento é indistinguível de "ninguém entrou
ainda", que é o defeito do blip de disponibilidade registrado no `CLAUDE.md`.

### Janela 1 — IMEDIATA (minutos após o deploy)

| O quê                     | Onde consultar                                                                                                                                               | Sucesso                                     |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------- |
| Server no ar              | `curl -s https://<api>/api/health`                                                                                                                           | `uptime` baixo, amostra única               |
| Índice único ativo        | dois `/generate` concorrentes pelo harness                                                                                                                   | **429 `generation_in_progress`**, e não 500 |
| Cobrança dupla parada     | um turno de chat real, medindo antes e depois: `select public.get_ai_usage_today('<uid>'), public.get_ai_usage_today_by_tool('<uid>','roadmap-intake-chat')` | dedicada **+1**, global **+0**              |
| Nenhuma geração presa     | `select status, count(*) from public.ai_roadmaps group by status`                                                                                            | **0** linhas `generating`                   |
| Dados anteriores íntegros | mesma query                                                                                                                                                  | **19 `ready`** e **2 `partial`** ainda lá   |
| Guard                     | `pnpm check:migrations`                                                                                                                                      | exit 0                                      |

### Janela 2 — PRIMEIRO DIA (24h)

Tudo no PostHog, **filtrando a conta de teste `6a9063c4-2bcb-4432-8a75-70fccc676851`**.

| O quê                         | Onde                                                                                                                                                                          | Sucesso                                     |
| ----------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------- |
| Funil completo de alguém real | PostHog, eventos `roadmap_ia_chat_iniciado` → `roadmap_ia_can_generate` → `roadmap_ia_geracao_iniciada` → `roadmap_ia_geracao_concluida`, mesmo `distinct_id`                 | **pelo menos 1 pessoa** atravessa os quatro |
| Beco sem saída de volta       | SQL: `select count(*) from public.ai_usage_logs where status='rejected' and error_message='turn_limit' and created_at > '<instante do deploy>' and user_id <> '6a9063c4-...'` | **0**                                       |
| Issue de pessoa travada       | Sentry, fingerprint `roadmap-ia-travado`                                                                                                                                      | **nenhuma nova**                            |

As **4 linhas `rejected`** do smoke test (ids `1a08b64b`, `00234a4d`, `4e851a4c`, `25d0048a`) são anteriores ao deploy e da conta de teste; o filtro por instante e por `user_id` já as exclui.

### Janela 3 — PRIMEIRA SEMANA

É esta que responde à pergunta que abriu a demanda.

**Métrica: taxa de conversão `chat_iniciado` → roadmap `ready`, por semana.**

Três períodos para comparar, e o SQL de referência é o mesmo mudando a janela:

```sql
select date_trunc('week', created_at) as semana,
       count(distinct user_id) as pessoas_que_conversaram,
       (select count(distinct user_id) from public.ai_roadmaps r
         where r.status = 'ready'
           and date_trunc('week', r.created_at) = date_trunc('week', l.created_at))
         as pessoas_com_roadmap
  from public.ai_usage_logs l
 where l.tool = 'roadmap-intake-chat' and l.status = 'success'
 group by 1 order by 1;
```

| Período             | O que era                               | Referência                              |
| ------------------- | --------------------------------------- | --------------------------------------- |
| Antes de 2026-07-13 | o formulário estático ainda existia     | linha de base do produto que funcionava |
| 13/07 a 31/07       | chat guiado com o teto de 12, quebrado  | o fundo do poço                         |
| Depois do deploy    | chat com teto de 20 e saídas garantidas | o que precisa superar os dois           |

**Sucesso: acima de 50%**, e as 2 linhas `partial` não crescendo. Abaixo disso o
problema mudou de lugar, e o funil do P2 diz para onde.

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
