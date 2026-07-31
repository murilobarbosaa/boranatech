# Unificar Bugs & Erros dentro de Tarefas

Auditoria, plano e execução por fases.
Data da auditoria: 2026-07-31. Branch: `fix/roadmap-ia-intake-desbloqueio`.

Tudo que está marcado como **medido** foi lido do banco ou da API do Sentry
durante esta auditoria, com a data acima. Tudo que não está marcado assim é
leitura de código.

## Estado

| Fase | Situação |
| --- | --- |
| 0 Auditoria | concluída |
| 1 Terreno (tipo `bug`, `is_start`, `statsPeriod`) | **concluída** |
| 2 Schema do feed, etapa fixada e proveniência | **concluída** |
| 3 O sync, desligado | **concluída** |
| 4 a 6 | não iniciadas |
| ~~7 Remover sincronização reversa~~ | **cancelada pela Emenda 1** |

Migrations M1 a M6 escritas e pendentes de aplicação pelo SQL editor. Nenhuma
delas é consumida por código ainda: o sync só nasce na Fase 3, desligado.

## Emendas ao plano aprovado (2026-07-31)

O plano foi aprovado com três emendas, todas já refletidas no corpo do
documento. Ficam registradas aqui porque duas delas **revogam** conclusões da
auditoria original, e conclusão revogada que continua escrita como se valesse é
a pior classe de documentação desatualizada: ela ensina o erro.

**Emenda 1: o invariante 6 foi reescrito e a Fase 7 saiu do plano.** O texto
original ("sincronização em uma direção só") foi escrito supondo integração
nova. O achado 0.3 mostrou que já existia, e que é muito mais estreita do que o
invariante supunha: um push de **um campo**, disparado por **transição humana**,
**simétrico** nos dois sentidos. Não são dois sistemas disputando estado.

> **Invariante 6, vigente:** o job nunca escreve no Sentry. A única escrita é o
> push de resolução disparado por transição humana explícita, e ela é simétrica
> nos dois sentidos.

`sentry_sync_pending`, `retryPendingSyncs`, `updateIssueStatus` e
`syncBugStatusToSentry` **ficam**, e ganham a cobertura que hoje não têm. O
argumento da auditoria para remover ("é a única parte que altera estado externo
a partir de um arrasto, e não tem teste nenhum") vale igual como argumento para
testar. Testes obrigatórios, na fase que mexer no `moveTask`: transição para
`is_done` empurra resolvido; transição para fora desmarca; falha no Sentry não
desfaz o movimento no quadro; o job nunca chama a função.

Condição de validade: o gatilho mudou de natureza (era um select de status,
passa a ser um arrasto), e arrasto acidental para Concluído passa a marcar
resolvido no Sentry. **É a simetria que torna isso autocurável** (arrastar de
volta desmarca). Se a simetria quebrar, o invariante volta a valer como estava.

**Emenda 2: a reabertura vai para a etapa `is_start`, não para a etapa fixada.**
A recomendação original abria um buraco na decisão A: card reaberto voltaria
para a etapa fixada, e a regra de arquivamento age sobre "card que ainda está na
etapa fixada". Um card que se **sabe** que regrediu seria arquivado sozinho na
próxima vez que o Sentry o marcasse resolvido.

O problema maior é semântico: a etapa fixada deixaria de significar "nunca
triado", e é essa semântica que autoriza tanto o arquivamento automático (A)
quanto o bloqueio de entrada manual (E). Duas decisões se apoiam nela.

A objeção original ao `is_start` (no quadro `BUG` ele era a própria etapa do
Sentry) **deixou de existir com a M2**, que é justamente o que ela conserta.
Regressão que precisa de atenção humana é entrada humana, não ruído não triado.

**Emenda 3: a poda não pode depender só do Sentry, e a verificação confirmou o
motivo.** Auto-resolve **desligado nos dois projetos** (`resolveAge = 0` em
`boranatech-front` e `node-express`, medido em 2026-07-31 pela API). Card não
triado nunca vai para Concluído, então o push de resolução nunca o alcança, e
sobra só alguém clicando resolvido no Sentry à mão. **A poda recomendada na
auditoria original quase nunca dispararia**, e o pior é que pareceria
implementada.

Por isso a decisão A passa a ter **duas condições que convivem**, e a segunda
não depende de comportamento de outro sistema:

1. issue marcada como resolvida no Sentry, **ou**
2. card nunca triado cuja issue está sem eventos novos há N dias, por `lastSeen`.

O dado da segunda é o mesmo que já alimenta o selo "verificado, sem eventos há
Xd". Está inteiramente sob nosso controle.

## A regra de ressurreição (2026-07-31)

Regra nova, não emenda: ela não existia no plano aprovado. Aparece porque a poda
por silêncio deixou de ser decorativa e virou o mecanismo principal.

**O buraco.** Card criado pelo sync na etapa fixada. Sem eventos por 21 dias, o
job arquiva. Dois meses depois o erro volta. O sync roda, vê a issue na
listagem, tenta inserir, e o `on conflict do nothing` sobre o índice único não
faz nada, **corretamente**. O card antigo continua arquivado, fora do snapshot.
Resultado: não há card novo, não há card visível, e o Sentry está gritando.

A constraint não está errada, é o invariante 3 e ela fica. O que ela faz é
**obrigar** um caminho de ressurreição.

**A regra.** `lastSeen > archived_at` → desarquiva e devolve para a **etapa
fixada**.

A etapa fixada é o destino certo aqui, ao contrário da reabertura da Emenda 2:
esse card nunca foi triado, então continua sendo exatamente o que a etapa fixada
significa. Os dois caminhos e seus destinos, lado a lado, porque a assimetria é
de propósito:

| Evento | De onde | Para onde | E-mail |
| --- | --- | --- | --- |
| Reabertura | Concluído | etapa `is_start` | individual |
| Ressurreição | arquivado | etapa fixada | só no resumo da run |

A diferença de e-mail segue a diferença de significado. Reabertura é regressão
**do que nós corrigimos**, e merece interrupção. Ressurreição é fila de triagem
de algo que ninguém olhou, e interromper por isso é o caminho para o
destinatário criar uma regra de filtro.

Log de atividade com ator Sentry nos dois casos, com o motivo ("novo evento
após arquivamento" na ressurreição). Uma vez desarquivado, o card volta a ser
elegível para a poda por silêncio: ciclo fechado, sem estado especial.

### O que a regra impõe ao schema (e por isso a Fase 2 mudou)

**A ressurreição só vale se o job foi quem arquivou.** Se uma pessoa arquiva um
card do Sentry porque decidiu que aquele erro é ruído aceitável, o job
desarquivando na próxima recorrência significa que **não existe forma de
silenciar nada**: o card volta toda vez, e o único caminho seria conferir a fila
de novo a cada recorrência.

Daí `admin_tasks.archived_source` (`'human' | 'sentry_sync'`, null quando não
arquivado), na migration `20260731050300`.

**Semântica resultante, e ela é boa: arquivar um card do Sentry à mão é
silenciar aquele erro.** Desarquivar à mão o devolve ao ciclo. Vale documentar
assim para o usuário, porque é o que ele vai entender e é o que o sistema faz.

Coluna própria e não reúso de `source`: `source` responde "quem criou",
`archived_source` responde "quem arquivou". O caso que importa é justamente
aquele em que as respostas divergem (criado pelo sync, arquivado por uma pessoa
que silenciou), e reusar uma coluna só apagaria exatamente essa informação.

A coerência entre `archived_at` e `archived_source` é imposta por **trigger**, e
isso não é preciosismo: a rota de hoje arquiva setando só `archived_at`, então
uma constraint sem trigger quebraria o arquivamento em produção no instante em
que a migration fosse aplicada, antes de qualquer código novo subir. Com o
trigger, o código antigo continua funcionando e grava o valor certo, porque quem
não é o job é humano.

### O que a regra impõe à Fase 3

Três coisas, e as três são armadilhas que falham **passando**.

**1. A varredura de manutenção é o ÚNICO lugar do módulo que lê cards
arquivados.** Em todo o resto (snapshot, filtros, contagens) `archived_at`
significa "não aparece", e isso está certo. Se essa varredura filtrar arquivados
pelo reflexo natural, a regra de ressurreição **nunca dispara, nada quebra e
ninguém percebe**. Tem que estar comentado no código da varredura, não só aqui.

**2. Poda e ressurreição são avaliadas a partir dos NOSSOS CARDS, nunca da
listagem.** Uma issue silenciosa cai fora da janela de 14d e desaparece da
listagem: se a avaliação partisse de lá, o job nunca veria o `lastSeen` de quem
ficou quieto, que é exatamente a população que a poda existe para alcançar. É a
estrutura de duas fases que o `reconcileDoneCards` já tem hoje, com o teto de
200: **ingestão a partir da listagem, manutenção a partir dos cards**.

**3. O `N` é 21 dias**, em `shared/tasks/sentryIntake.ts`, constante única e
documentada. Não é coluna de configuração: muda raramente, e mudar custa uma
linha e um deploy. Precisa ser **estritamente maior** que a janela de listagem
de 14d, para a poda não alcançar nada que ainda esteja aparecendo no feed
normal. A relação está travada por teste, não só por comentário.

---

## 0. Três achados que mudam o enunciado do projeto

Antes do mapeamento, porque eles reescrevem o escopo.

### 0.1. O feed automático do Sentry não existe hoje. Nada dele.

O enunciado fala em "absorver as duas funções" da aba. A segunda (bug tracker)
existe. A primeira **não**: hoje o Sentry é uma *listagem ao vivo*, não uma
ingestão. `server/routes/adminBugs.ts:90` consulta a API a cada abertura da aba e
devolve o resultado direto para a tela. Nada é persistido. Uma linha em
`admin_bugs` só nasce quando um humano clica em "criar bug" a partir de uma issue
(`client/src/components/admin/BugsDashboard.tsx:353`), e a partir daí o vínculo é
`sentry_issue_id` + `sentry_numeric_id`.

Consequência: o item 1 do projeto não é migração nem absorção, é **feature nova
inteira**, e é ela que traz o escritor automático. O item 2 é que é migração.
Isso já sugere o corte de fases.

### 0.2. O quadro `BUG` já existe, feito à mão, e a etapa fixada já está lá (mal configurada)

**Medido.** `admin_task_boards` tem quatro quadros: `MKT`, `BUG`, `DEV`, `SPT`.
O `BUG` (`984188f1-1a6c-4356-82da-a6421e93fb36`) já tem cinco etapas:

| Etapa | position | is_start | is_done |
| --- | --- | --- | --- |
| Sentry | 1000 | **true** | false |
| Bugs Reportados | 2000 | false | false |
| A fazer | 3000 | false | false |
| Em Progresso | 4000 | false | false |
| Concluido | 5000 | false | true |

Um card já existe (`BUG-1`, "Ao clicar em Filtros na aba de Tarefas, da erro"),
com `type = 'tarefa'`, porque `bug` já tinha saído do CHECK. As seis etiquetas
padrão estão lá, **incluindo `Frontend` e `Backend`**, que é exatamente o que a
questão G precisa.

**Defeito a corrigir na Fase 1**: `Sentry` está com `is_start = true`. Como
`resolveDefaultColumn` (`server/routes/adminTasks.ts:376`) ordena por `is_start`
desc, **todo card criado à mão sem `column_id` nasce dentro da etapa do feed
automático**. O `BUG-1` escapou porque foi criado com `column_id` explícito. Isso
precisa migrar para `Bugs Reportados` antes de qualquer automação, senão o
humano e o robô escrevem no mesmo balde.

### 0.3. A sincronização de hoje é BIDIRECIONAL, e o invariante 6 a proíbe

O invariante 6 diz "o quadro não escreve no Sentry". O código atual escreve:
`server/routes/adminBugs.ts:334` chama `syncBugStatusToSentry` em toda transição
para/de `done`, que faz `PUT /issues/{id}/` mudando o status lá
(`server/lib/sentryApi.ts:288`). Há inclusive máquina de retry persistida
(`sentry_sync_pending`) e uma fase inteira do cron dedicada a ela
(`server/lib/sentryBugReconcile.ts:100`).

O invariante não é uma descrição do que existe, é uma decisão de **remover** isso.
Está travado e eu não discuto, mas ele precisa aparecer no plano como **remoção
deliberada de comportamento**, não como "não implementar". Concretamente: a
coluna `sentry_sync_pending`, a fase 2 do job e a função `updateIssueStatus`
saem de uso. Se um dia voltar, volta como o botão explícito que o invariante 6
prevê.

---

## 1. Mapeamento

### 1.1. O lado Sentry

**Como o sync funciona hoje.** Dois caminhos, nenhum deles ingestão:

| Caminho | Gatilho | Arquivo |
| --- | --- | --- |
| Listagem ao vivo | Abrir a aba / trocar filtro | `server/routes/adminBugs.ts:90` -> `server/lib/sentryApi.ts:101` |
| Reconciliação | Cron a cada 15 min | `supabase/migrations/20260723120100_schedule_reconcile_sentry_bugs.sql:26` -> `server/routes/cron.ts:1443` -> `server/lib/sentryBugReconcile.ts:251` |

O agendamento mora no `pg_cron` do banco (`cron.schedule('reconcile-sentry-bugs',
'*/15 * * * *', ...)`), chamando `public.call_cron_endpoint`, criado lá em
`20260518003955_schedule_cron_jobs.sql`. O endpoint é protegido por
`withCronLock('reconcile-sentry-bugs', 600, ...)` (`server/routes/cron.ts:176`) e
grava resultado em `cron_run_logs` via `recordCronRun`.

Não há webhook do Sentry em lugar nenhum. Confirmado por varredura: nenhuma rota
recebe payload do Sentry.

**Os projetos do Sentry (medido, via API):**

| slug | platform | id |
| --- | --- | --- |
| `boranatech-front` | `javascript-react` | 4511810513141760 |
| `node-express` | `node-express` | 4511674783498240 |

A consulta usa `project=-1` (todos os projetos da organização),
`server/lib/sentryApi.ts:51`, com um comentário longo explicando por quê: o
`SENTRY_PROJECT_SLUG` singular esconderia metade dos erros sem avisar. A variável
`SENTRY_PROJECT_SLUG` **ainda existe no `.env` e não é mais lida** por
`sentryApi.ts`.

**Campos que a API devolve, e o que é persistido.** O payload da listagem tem 34
chaves. O `toIssue` (`server/lib/sentryApi.ts:75`) lê 12:

| Campo | Na listagem? | Persistido em `admin_bugs`? |
| --- | --- | --- |
| `id` (groupId numérico) | sim | sim, `sentry_numeric_id` |
| `shortId` | sim | sim, `sentry_issue_id` |
| `permalink` | sim | sim, `sentry_issue_url` |
| `project.slug` | sim | **não** (lido pelo server, descartado pelo client) |
| `title`, `culprit`, `level`, `status` | sim | **não** (copiados para `title`/`description` pelo humano) |
| `count`, `userCount`, `firstSeen`, `lastSeen` | sim | **não** |
| `substatus`, `priority`, `isUnhandled`, `platform`, `issueType`, `metadata`, `logger` | sim | **não**, e nem são lidos |
| **`release`** (`firstRelease`/`lastRelease`) | **não** | não |
| **`environment`** (em `tags`) | **não** | não |
| **stack trace** | **não** | não |

Os três últimos são o achado que mais custa no plano: **release, environment e
stack não vêm na listagem**. Verificado empiricamente contra a API:

- `GET /organizations/{org}/issues/{id}/` traz `firstRelease`, `lastRelease` e
  `tags` (17 chaves de tag no exemplo, incluindo `environment`, `release`,
  `url`, `browser`, `os`). É **uma requisição a mais por issue**.
- stack trace exige `GET /issues/{id}/events/latest/`, **outra** requisição por
  issue.

"Preencher com o máximo de detalhe" custa, no pior caso, 3 requisições por issue
nova. Isso entra no orçamento de rate limit da Fase 3.

Detalhe do `projectSlug`: o server já o resolve
(`server/lib/sentryApi.ts:86`) mas o tipo do client não o declara
(`client/src/services/adminBugsService.ts:43`). O dado atravessa a rede e é
jogado fora. Para a questão G isso é sorte: o campo já está lá.

**Filtros de período e situação: aplicados no Sentry.** A tela tem
`statsPeriod` (14d por padrão) e `onlyUnresolved`
(`BugsDashboard.tsx:250-251`); ambos viram querystring
(`adminBugsService.ts:63`), são validados por `SentryQuerySchema`
(`adminBugs.ts:31`, regex `^\d{1,3}[hdwm]$`) e repassados à API. Nada é filtrado
no banco nem no cliente. A paginação é por cursor do header `Link`
(`parseLinkCursor`, `sentryApi.ts:61`).

Armadilha documentada no próprio código e que vai reaparecer no plano: o endpoint
de listagem **só aceita `''`, `'24h'` ou `'14d'`** como `statsPeriod`; qualquer
outro valor responde 400 (`sentryApi.ts:339`). O regex da rota aceita `90d`, que
o Sentry recusa. É um bug latente hoje (só alcançável se alguém montar a URL na
mão), e vira bug real se o feed usar janela configurável.

**Estado de "resolvido" vindo do Sentry: existe e NÃO é lido.** O campo `status`
está em `SentryIssue` e chega ao client, mas nenhuma decisão depende dele. A
recorrência é decidida por `lastSeen > resolved_at`
(`sentryBugReconcile.ts:201`), e há um comentário explícito sobre por quê
(`sentryApi.ts:285`): reverter para `unresolved` seta `substatus: 'regressed'`
**sem evento novo**, então status/substatus não servem de sinal de recorrência.
Esse achado é a base da minha resposta à questão D.

### 1.2. O lado bug tracker

**Schema.** Uma tabela só, `admin_bugs`. Não há satélites: nada de comentários,
histórico, responsável ou checklist. Isso é bom para a migração e ruim para quem
esperava paridade.

- Base: `20260721150000_create_admin_bugs.sql`. `id`, `title` (1..200),
  `description` (1..5000), `status` CHECK `open|in_progress|done`, `severity`
  CHECK `low|medium|high|critical`, `sentry_issue_id`, `sentry_issue_url`,
  `created_by` NOT NULL, `created_at`, `updated_at`, `resolved_at`.
- Sync: `20260723120000_admin_bugs_sentry_sync.sql` acrescenta
  `sentry_numeric_id`, `sentry_sync_pending`, `sentry_reopen_event_at`,
  `sentry_last_checked_at`, `sentry_orphaned_at`.
- RLS ligada, **zero policies**, acesso só por service role atrás de
  `requireAdmin`. Mesmo desenho de `admin_task*`.

Não há `assignee`, não há `updated_by`, não há log de atividade.

**Volume (medido).** 25 linhas.

| status | linhas | com issue do Sentry |
| --- | --- | --- |
| `open` | 6 | 0 |
| `in_progress` | 9 | 4 |
| `done` | 10 | 2 |

| severity | linhas |
| --- | --- |
| `critical` | 7 |
| `high` | 14 |
| `medium` | 4 |
| `low` | 0 |

Seis linhas têm `sentry_issue_id`, **todas `NODE-EXPRESS-*`**: nenhum bug foi
criado a partir do projeto de frontend, que só nasceu em 2026-07-28. Nenhuma
linha está órfã.

Para comparação: `admin_tasks` tem 26 linhas no total, somando os quatro quadros.
Migrar 25 bugs **dobra a base do módulo**.

**Identificador curto de bug: não existe.** Verificado. `admin_bugs` tem só o
`uuid`. Os três e-mails linkam para `${APP_URL}/admin?section=bugs`
(`server/lib/email.ts:795`, `:825`, `:849`), sem parâmetro de bug, e a
`BugsDashboard` não lê nem escreve nenhum `?bug=`. **Nenhum identificador de bug
jamais circulou em e-mail.** Isso simplifica a questão F: não há o que preservar.
O que circulou foi o link da aba, e é ele que precisa sobreviver.

### 1.3. As automações

Três e-mails e três notificações, todos disparados por ação humana exceto a
reabertura.

| Evento | Gatilho | E-mail | Notificação | Destinatário |
| --- | --- | --- | --- | --- |
| Bug criado | `POST /bugs` (humano) | `sendBugCreatedEmail` (`email.ts:769`) | sim (`adminBugs.ts:223`) | `BUG_NOTIFY_NEW_EMAIL` |
| Bug resolvido | `PATCH /bugs/:id` com transição para `done` | `sendBugResolvedEmail` (`email.ts:805`) | sim (`adminBugs.ts:317`) | `BUG_NOTIFY_DONE_EMAIL` |
| Bug reaberto | **cron**, `lastSeen > resolved_at` | `sendBugReopenedEmail` (`email.ts:835`) | sim (`sentryBugReconcile.ts:139`) | `BUG_NOTIFY_DONE_EMAIL` |

Ambos os destinos são **um endereço fixo cada**, vindo de variável de ambiente
(`server/lib/env.ts:191-192`), não uma lista de admins. Se a variável estiver
vazia, a função loga um `warn` e retorna sem enviar (`email.ts:775`).

A notificação interna usa `createTargetedNotification`
(`server/lib/targetedNotifications.ts`), que resolve o e-mail para `user_id` em
`profiles`, cria uma `notifications` com `audience='custom'` já `published` e
materializa o destinatário em `notification_recipients`. Se o e-mail não tiver
cadastro na plataforma, loga `warn` e **não cria nada**. Tem rollback: se o
insert do destinatário falhar, apaga a notificação (custom sem destinatário seria
publicada e invisível).

Tudo é fire-and-forget: `void fn().catch(log)`. A resposta HTTP nunca espera nem
falha por causa de envio.

**Controle de reenvio, deduplicação e throttle: não existe nenhum.** Zero. A
única proteção que existe é um gate de transição: `becameDone` só é verdadeiro
quando o status *mudou* para `done` (`adminBugs.ts:277`), então `done -> done`
não reenvia. E a reabertura tem guard de idempotência no `UPDATE ... eq('status',
'done')` (`sentryBugReconcile.ts:219`), que impede a segunda run de reabrir e
notificar de novo. São guardas **por transição**, não por volume: nada limita
quantos e-mails saem em dois minutos. É exatamente a preocupação da questão B, e
ela está correta.

**O que acontece quando um erro resolvido volta.** Regra explícita, não é só o
`lastSeen` mudando. `reconcileDoneCards` (`sentryBugReconcile.ts:154`) busca os
cards em `done` com issue vinculada (teto de 200), pega o estado em lote e, para
cada um:

- `lastSeen > resolved_at` -> `status` volta para `in_progress`, `resolved_at`
  é limpo, `sentry_reopen_event_at` recebe o `lastSeen`, e dispara e-mail +
  notificação;
- senão -> só carimba `sentry_last_checked_at` (alimenta o selo "verificado, sem
  eventos há Xd" na UI, `BugsDashboard.tsx:226`).

Três fail-safes que valem copiar para o desenho novo: `resolved_at` nulo nunca
reabre (base incerta); issue ausente do lote conta como "sem evento novo", nunca
como recorrência; e falha de leitura (`rate_limited`, `error`) **não toca em card
nenhum** naquela run, gravando o motivo em `reconcileSkipped`.

### 1.4. O acoplamento da aba

Menor do que parecia. Sete pontos, e nenhum deles é estrutural.

| Ponto | Arquivo |
| --- | --- |
| Import do painel | `client/src/pages/Admin.tsx:62` |
| Membro `"bugs"` do `AdminSectionId` | `client/src/pages/Admin.tsx:222` |
| Item de nav `#bugs` / "Bugs & Erros" | `client/src/pages/Admin.tsx:449-450` |
| Render da seção | `client/src/pages/Admin.tsx:7546-7554` |
| Router montado | `server/routes/admin.ts:79` |
| Deep link em 3 e-mails | `server/lib/email.ts:795`, `:825`, `:849` |
| Referências em comentário | 7 arquivos do módulo de tarefas citam `BugsDashboard` como referência de estilo |

`ADMIN_SECTION_IDS` é **derivado** de `adminNavItems`
(`client/src/pages/Admin.tsx:468`), então tirar o item da nav já tira o id do
conjunto válido. O `AdminSectionId` (união escrita à mão) é a duplicação que o
`docs/tarefas-modulo.md` já sinalizou como dívida pré-existente; aqui só se
remove um membro dela.

O ponto que **não** pode simplesmente sumir é o deep link dos e-mails já
enviados. `?section=bugs` precisa continuar levando a algum lugar útil, e
`isValidSection` hoje cai em `visao-geral` para valor desconhecido
(`Admin.tsx:476`). Cair na visão geral é degradação aceitável mas ruim; um
redirecionamento explícito de `bugs` para `tarefas` no quadro `BUG` é barato e
melhor.

**Nenhum teste cobre nada disso.** Varredura por `*.test.ts(x)` citando
`adminBugs`, `BugsDashboard`, `admin_bugs` ou `sentryBug`: **zero arquivos**. O
único teste do lado Sentry é `server/lib/sentryApi.test.ts`, 73 linhas, e cobre
só `listSentryIssues`. O job de reconciliação, os três e-mails, as três
notificações e a rota inteira nunca foram exercitados por teste. Isso vai para a
seção 5.

---

## 2. As sete decisões

Cada uma com recomendação e custo das alternativas. Nenhuma implementada.

### A. Volume da etapa fixada

**Medido hoje:** 22 issues `is:unresolved` em 14 dias, 24 no total (incluindo
resolvidas), 10 nas últimas 24h, 2 resolvidas em 14d. O snapshot carrega tudo
(`adminTasks.ts:704`), com `paginateRange` para não truncar em silêncio, mais uma
varredura de `label_links`, uma de `checklist_items` e uma de `comments` sobre
todos os ids.

O volume atual é confortável. O problema é o acúmulo: o feed nunca para de
crescer, e sem poda uma etapa de 22 vira uma de 800 em alguns meses.

| Opção | Custo | Efeito |
| --- | --- | --- |
| Só não-resolvidos entram | Zero. É o `query=is:unresolved` que já é o padrão. | Limita a **entrada**, não o acúmulo. Card criado fica lá para sempre. |
| Janela de dias na ingestão | Zero, é parâmetro. Cuidado: `statsPeriod` só aceita `''`, `24h` e `14d`. | Mesma limitação: controla entrada, não estoque. |
| **Arquivamento automático de quem o Sentry resolveu** | Uma condição no job. Reusa `archived_at`, que **já sai do snapshot por padrão** (`adminTasks.ts:714`). | Limita o **estoque**. É a única opção que faz o número parar de subir. |
| Paginação da coluna | Alto. Quebra "o board carrega tudo num snapshot só", que é premissa de filtro no cliente, drag and drop e contagem. Vira projeto próprio. | Resolve de vez, mas é o projeto inteiro de novo. |

**DECIDIDO (com a Emenda 3): arquivamento automático, por DUAS condições.** O
card que ainda está na etapa fixada (ninguém triou) é arquivado pelo job quando
a issue foi marcada como resolvida no Sentry **ou** quando está sem eventos
novos há N dias (`lastSeen`). Sai do snapshot, continua existindo, volta com o
toggle de arquivadas. O mecanismo já existe e já está testado.

A segunda condição não é redundância, é o que faz a poda existir. **Auto-resolve
está desligado nos dois projetos** (medido: `resolveAge = 0` em ambos), e card
não triado nunca vai para Concluído, então o push de resolução nunca o alcança.
Sozinha, a primeira condição dependeria de alguém clicar resolvido no Sentry à
mão, e a poda pareceria implementada sem nunca disparar.

Duas salvaguardas obrigatórias: só arquivar card que **ainda está na etapa
fixada** (se um humano moveu, ele é do humano, invariante 1), e emitir o
`archived` no log de atividade com ator Sentry, para o arquivamento não ser
invisível.

Como rede, um limite duro de ingestão por run (por exemplo 50 cards) com `log()`
explícito do que ficou de fora. Truncar em silêncio é a classe de erro que o
`CLAUDE.md` inteiro documenta.

### B. E-mail

Sua recomendação está certa e eu não tenho o que acrescentar contra. Acrescento
um dado: o destinatário é **um endereço único**, não uma lista, então 15 e-mails
em dois minutos são 15 e-mails para a mesma caixa. O custo de errar aqui é o
destinatário criar uma regra de filtro, e aí o canal morre para os casos que
importam.

**Recomendação:**

- Tarefa criada pelo sync: **nenhum e-mail individual**. Um resumo agrupado por
  run ("o sync criou 15 tarefas novas no quadro BUG"), e **só quando houve
  criação** (run sem novidade não manda nada).
- Notificação interna: **por item**, como você propôs. Ela é barata, não sai da
  plataforma e o sino já agrega visualmente.
- E-mail individual continua existindo para **ação humana**: bug reportado à mão,
  bug concluído. É o comportamento de hoje e não há motivo para mexer.
- Reabertura: e-mail individual. É raro por construção e é o evento mais
  acionável dos três.

Custo da alternativa (e-mail por item no sync): zero de implementação, e o risco
descrito acima. Custo do resumo agrupado: um template novo e a decisão de o que
fazer quando a run cria 1 tarefa só (respondo: manda o resumo mesmo assim, com
uma linha; template condicional é onde nasce o bug de plural).

### C. Reabertura: qual é a etapa correta

Três opções, e a diferença entre elas é o que precisa ser persistido.

| Opção | Custo | Problema |
| --- | --- | --- |
| Etapa anterior à conclusão | Uma coluna nova (`previous_column_id`) e a disciplina de mantê-la em **todo** caminho que conclui. | O card pode ter vindo de uma etapa que não existe mais (`DELETE /columns/:id` move os cards, mas a coluna guardada some). Precisa de `on delete set null` e de um fallback. |
| **Etapa fixa de reabertos** | Zero de schema. Reusa a etapa fixada do feed. | Mistura card novo com card reaberto na mesma etapa, se for a mesma. |
| `is_start` | Zero. | É a pior das três: `is_start` é onde card **manual** nasce, e no quadro `BUG` hoje isso é a própria etapa do Sentry (achado 0.2). Mandaria o reaberto para o balde do robô. |

**DECIDIDO (Emenda 2): a reabertura vai para a etapa `is_start`**, com o card
marcado visualmente como reaberto (o dado já existe: `sentry_reopen_event_at`, e
a `BugsDashboard` já desenha esse selo hoje, `BugsDashboard.tsx:214`).

A recomendação original desta auditoria era mandar o reaberto para a **etapa
fixada**, e ela estava errada. O motivo está na Emenda 2, no topo: o reaberto
passaria a ser elegível ao arquivamento automático de A, e a etapa fixada
deixaria de significar "nunca triado", que é a premissa de A **e** de E. A
objeção que eu tinha ao `is_start` (no quadro `BUG` ele era a própria etapa do
Sentry) é exatamente o que a M2 conserta.

Consequência a garantir e a testar: depois da M2 e desta decisão, a etapa fixada
contém **apenas** cards que nunca foram triados. O arquivamento automático pode
confiar nisso sem condição extra.

A terceira opção (etapa anterior à conclusão, via `previous_column_id`) fica
descartada: exigiria coluna nova com `on delete set null`, um fallback declarado
para a coluna que não existe mais, e um caminho a mais para testar.

**Gatilho:** `lastSeen > completed_at`, sim, e é a tradução direta do que já roda
hoje (`lastSeen > resolved_at`, `sentryBugReconcile.ts:201`), com `completed_at`
no lugar de `resolved_at`. Copiar junto os três fail-safes: `completed_at` nulo
nunca reabre; ausência no lote conta como sem evento; falha de leitura não toca
em card nenhum.

Não usar `status`/`substatus` do Sentry como gatilho. O comentário em
`sentryApi.ts:285` registra o teste manual que provou o problema: reverter para
`unresolved` marca `substatus: 'regressed'` **sem evento novo**.

### D. Resolvido no Sentry, o card vai para Concluído sozinho?

**Recomendação: não.** E não, isso não conflita com o invariante 1, porque o
invariante 1 é sobre **relocalizar tarefa que humano moveu**. Um card que ninguém
tocou continua sendo do sync.

Mas a assimetria com C é proposital e é o ponto:

- **Reabrir é seguro**: o sinal (`lastSeen > completed_at`) é um fato observável
  e o custo do falso positivo é um card a mais na fila de triagem.
- **Concluir é perigoso**: "resolvido no Sentry" quer dizer "alguém clicou
  resolvido lá", que não é a mesma afirmação que "está corrigido". Mover para
  Concluído carimba `completed_at`, que é a base do gatilho de reabertura e das
  métricas de tempo. Deixaria o estado do quadro dependendo de um clique feito em
  outro sistema, sem rastro no log de atividade.

O que o sinal deve fazer é o item A: **arquivar** o card que ainda está na etapa
fixada. Arquivar diz "isso saiu da fila", Concluído diz "isso foi resolvido por
nós". São afirmações diferentes e só a primeira é verdadeira.

Se o card já foi triado (saiu da etapa fixada), o sync não faz nada. Fica para o
humano, que é o invariante 1.

### E. Etapa fixada: o que "fixada" impede

Proponho quatro regras, e uma delas é mais restritiva do que o enunciado sugere.

| Regra | Recomendação |
| --- | --- |
| Excluir | **Bloqueado.** `DELETE /columns/:id` recusa com 409 quando `is_pinned`. |
| Reordenar | **Bloqueado.** `PATCH /columns/reorder` recebe a lista completa (`adminTasks.ts:231`); se a fixada não estiver na primeira posição da lista, recusa. |
| Card **sair** arrastando | **Permitido, e é o fluxo principal.** É literalmente a triagem. Bloquear isso mataria o produto. |
| Card **entrar** à mão | **Bloqueado**, e é aqui que eu vou além do enunciado. |
| Limite de WIP | **Não faz sentido.** É desligado ali. |

O "entrar à mão bloqueado" merece a justificativa. A etapa fixada tem uma
semântica exata: "criado pelo Sentry, ninguém triou". É essa semântica que
autoriza o job a arquivar automaticamente (questão A) e a reabrir (questão C).
Se um humano puder arrastar um card manual para lá, o job passa a agir sobre um
card que ele não criou, e o invariante 1 vira letra morta por um caminho de
interface. Fechar a entrada é o que mantém a regra do job simples e verdadeira.

Custo: `moveTask` ganha uma recusa (409, `column_pinned_intake`) e a UI precisa
sinalizar antes do drop, não depois. Não é grátis, mas é a diferença entre uma
regra que se sustenta sozinha e uma que depende de ninguém fazer a coisa errada.

Sobre WIP: o limite hoje é **aviso visual, não bloqueio** (`adminTasks.ts`, a
rota não recusa). Numa etapa que o robô alimenta, um aviso permanente de estouro
é ruído, e ruído é o que faz alguém desligar o instrumento. Desligar ali.

### F. Migração de `admin_bugs`

**Mapa de status para etapa** (quadro `BUG`, ids reais medidos):

| `admin_bugs.status` | Etapa destino | linhas |
| --- | --- | --- |
| `open` | Bugs Reportados (`27bf01e6...`) | 6 |
| `in_progress` | Em Progresso (`c5cb52c5...`) | 9 |
| `done` | Concluido (`9506850b...`, `is_done`) | 10 |

A etapa `A fazer` fica vazia na migração, e está certo: não existe estado
correspondente em `admin_bugs`. Inventar um repartiria os 6 `open` por adivinhação.

**Mapa de severidade para prioridade:**

| `severity` | `priority` | linhas |
| --- | --- | --- |
| `critical` | `urgente` | 7 |
| `high` | `alta` | 14 |
| `medium` | `media` | 4 |
| `low` | `baixa` | 0 |

Bijeção limpa, quatro para quatro. Nenhuma linha `low`, então esse ramo do mapa
nasce sem exercício. Todos os 25 vão com `type = 'bug'`.

**Identificador que circulou em e-mail: não existe** (verificado, seção 1.2).
Não há nada a preservar, o que elimina a parte difícil da questão. O que precisa
sobreviver é o link `?section=bugs`, e a resposta é o redirecionamento da seção
2.4/Fase 5.

O que **precisa** ser preservado é o vínculo com o Sentry das 6 linhas
vinculadas, porque sem ele a migração criaria duplicata na primeira run do sync
(a issue `NODE-EXPRESS-1` viraria um card novo ao lado do card migrado). Elas
carregam `sentry_issue_id` e `sentry_numeric_id` para as colunas novas, e o
índice único do invariante 3 passa a proteger.

Detalhe de `created_by`: `admin_bugs.created_by` é NOT NULL e todas as 25 linhas
têm autor humano real. Ele migra direto, e essas linhas **não** usam o ator de
sistema.

Detalhe de numeração: o quadro `BUG` está em `next_number = 2`. Os 25 cards
migrados recebem `BUG-2` a `BUG-26` pelo trigger, na ordem do insert. Recomendo
ordenar o insert por `created_at` ascendente, para o número crescer junto com a
idade do bug.

### G. Etiqueta de área

Sua posição ("nenhuma etiqueta é melhor que a errada") está certa e o dado
torna ela barata de cumprir: **são dois projetos, e o mapeamento é exato.**

| `project.slug` | Etiqueta |
| --- | --- |
| `boranatech-front` | Frontend |
| `node-express` | Backend |

As duas etiquetas **já existem** no quadro `BUG` com as cores do seed (`#38BDF8`
e `#34D399`). Não há etiqueta a criar.

**Recomendação: mapa explícito por `project.slug`, com aborto em não
classificado.** Slug fora do mapa: o card é criado **sem etiqueta nenhuma** e o
job emite um aviso nomeando o slug desconhecido. É o padrão de
`scripts/mutateLinkedinThresholds.mjs` que o `CLAUDE.md` cita: todo sítio precisa
estar numa lista, e um sítio novo se faz notar.

O que **não** fazer: derivar de `platform` (`javascript-react` vs `node-express`),
que parece equivalente e não é. É o campo do SDK, muda com upgrade de SDK e não
com decisão nossa. Também não inferir por heurística no `culprit` (hoje é uma URL
no front, um caminho de arquivo no back), que funciona até o primeiro SSR ou o
primeiro erro de script carregado por CDN.

Um projeto novo no Sentry entra sozinho na listagem (é o `project=-1`) e cairá no
ramo "não classificado". Isso é o comportamento desejado: a etiqueta some, o card
continua, e o aviso avisa.

---

## 3. Plano em fases

Sete fases. A migração de dados e o sync são fases separadas da interface, como
pedido, e o sync entra **desligado**.

A ordem tem uma propriedade que vale explicitar: **nada é irreversível até a Fase
5**, e a Fase 5 é a única que remove algo.

### Fase 1: arrumar o terreno (sem automação). CONCLUÍDA

Corrigir o que já está errado no quadro `BUG` e reabrir o tipo.

- Migration M1 (`20260731040000_readd_bug_to_admin_task_type.sql`): `bug` volta
  ao CHECK de `admin_tasks.type`.
- Migration M2 (`20260731040100_fix_bug_board_start_column.sql`): `is_start` sai
  de `Sentry` e vai para `Bugs Reportados` (achado 0.2), com asserção do total.
- `TASK_TYPES` no server e `TaskType` no client voltam a incluir `bug`.
  `TYPE_META` ganha a entrada, e `TYPE_META_HISTORICO` fica vazio (o mecanismo
  permanece; ele é o que separa "nunca existiu" de "existiu e saiu do menu").
- `SentryQuerySchema.statsPeriod` deixa de ser regex de formato e vira lista
  fechada `'' | '24h' | '14d'`, que é o domínio real da API (risco 3).
- Resíduo do `BUG-1`: o filtro de Vencimento passava `value: ""` ao
  `BntSelect`, e a guarda `opcoesRenderizaveis` (que corrigiu o crash em
  `64dedd4`) descartava a opção "Qualquer data" do menu. Sentinela `__any__` na
  borda da interface, traduzida nos dois sentidos; `filters.due` continua
  `"" | "late" | "week"`.

Arquivos: `server/routes/adminTasks.ts`, `server/routes/adminBugs.ts`,
`client/src/components/admin/tasks/types.ts`,
`client/src/components/admin/tasks/taskBoardStyles.ts`,
`client/src/components/admin/tasks/BoardToolbar.tsx`, duas migrations, quatro
arquivos de teste novos.

Verificação: 24 testes novos, cada mudança quebrada de propósito e restaurada
por md5; suíte inteira verde com e **sem** `.env` (1742 testes); `pnpm check`
verde.

### Fase 2: schema do feed e da etapa fixada (sem código que use). CONCLUÍDA

Só migrations aditivas. Nada as consome ainda.

- M3 (`20260731050000_add_sentry_fields_to_admin_tasks.sql`): vínculo
  (`sentry_issue_id`, `sentry_numeric_id`, `sentry_issue_url`), bloco do
  invariante 2 (`sentry_data` jsonb), campos de manutenção (`sentry_last_seen`,
  `sentry_last_checked_at`, `sentry_reopen_event_at`), ponte da Fase 5
  (`legacy_bug_id`), e três índices: dois únicos parciais (invariante 3 e
  idempotência da migração de dados) e um de varredura.
- M4 (`20260731050100_add_task_automation_flags.sql`): `sentry_sync_enabled` no
  quadro, `is_pinned` e `intake_source` na etapa, mais índice único garantindo
  **no máximo uma etapa de intake por quadro**.
- M5 (`20260731050200_allow_system_actor_on_admin_tasks.sql`): `created_by`
  deixa de ser NOT NULL, entra `source`.
- M6 (`20260731050300_add_archive_provenance_to_admin_tasks.sql`): a coluna que
  a regra de ressurreição exige. `archived_source`, o trigger que a mantém
  coerente para qualquer escritor, a constraint que declara o invariante, e o
  índice parcial da varredura de arquivados.

Detalhe do invariante 5: a automação lê `sentry_sync_enabled` do quadro e procura
a etapa com `intake_source = 'sentry'`. Nunca `board.key === 'BUG'`. Se o quadro
está ligado e não há etapa de intake, o job **aborta com erro**, não escolhe uma.

`sentry_last_seen` é persistido de propósito, e é o campo que permite a
manutenção avaliar poda e ressurreição **sem depender da listagem**. Ver o item
2 de "o que a regra impõe à Fase 3".

Verificação feita: `pnpm check:migrations` contra o banco real. Tabelas (82) e
RLS (82) **não mudaram**, porque nenhuma migration da fase cria tabela.
`EXPECTED_FUNCTION_COUNT` foi de 27 para 28 e `EXPECTED_TRIGGER_FUNCTION_COUNT`
de 4 para 5, os dois por causa do trigger de M6. O guard foi rodado **antes** de
os números serem alterados, e acusou exatamente essas duas divergências: os
números foram atualizados a partir do que ele mediu, não do que eu supunha.

### Fase 3: o sync, desligado. CONCLUÍDA

O escritor automático. Nasce inerte: `sentry_sync_enabled` é falso por padrão, a
M8 (agendamento) não foi escrita, e nada dele jamais escreveu em produção.

| Arquivo | Papel |
| --- | --- |
| `server/lib/sentryTaskDecisions.ts` | decisões PURAS (etiqueta, bloco, reabrir/ressuscitar/podar) |
| `server/lib/sentryTaskIntake.ts` | o job: duas fases, camada de escrita injetada |
| `server/lib/sentryApi.ts` | `getIssueLatestEvent` novo, e a correção do `statsPeriod` |
| `server/routes/cron.ts` | `POST /api/cron/sync-sentry-tasks`, com `?dryRun=1` |
| `server/lib/email.ts` | `sendSentryTasksSummaryEmail`, resumo agrupado |

#### Dry-run: por que ele é prova e não aproximação

As duas modalidades percorrem **o mesmo** código de decisão. A única diferença é
qual objeto `Escritor` é injetado: o real ou o inerte. Um dry-run que decidisse
por um caminho paralelo estaria mostrando um relatório sobre um programa que não
é o que roda. E como TODA escrita passa por esse objeto, o controle negativo é
sobre a camada inteira: o teste espiona `supabaseAdmin` durante um dry-run e
exige zero mutações, então uma escrita nova que esqueça de passar pelo escritor
aparece ali.

O dry-run **não** grava em `cron_run_logs`: ele não é uma execução do job, e
registrá-lo como se fosse mascararia a cadência real.

#### O custo do detalhe caiu de 3 requisições para 1

A auditoria previa até 3 requisições por issue nova (listagem, detalhe, evento).
Medido contra a API: `GET /issues/{id}/events/latest/` traz `tags` COM VALOR
(environment, release, url) e `entries` (onde mora o stack) de uma vez. O detalhe
da issue (`GET /issues/{id}/`) traz as tags só como `{key, name, totalValues}`,
sem valor, e por isso não serve. **Uma** requisição extra por issue NOVA, nunca
por issue já vista.

#### Ausência não pode parecer falha

`sentry_data.coleta.completo` separa "esta issue não tem release" (fato sobre a
issue) de "o 429 chegou antes de eu ler o release" (fato sobre nós). Os dois
produzem release vazio na tela. A manutenção retenta exatamente os que estão com
`completo: false`, com teto próprio. Na Fase 4, card incompleto tem que dizer
isso; nunca parecer que não havia dado.

#### O que a Fase 3 provou, e como

| Item | Prova |
| --- | --- |
| 1. sync não move card triado | decisão pura, 3 testes |
| 2. nunca escreve `description`/`notes` | varre TODAS as mutações da run |
| 3. dedup pela constraint | **Postgres real, 12 inserções concorrentes** |
| 4. job nunca chama `updateIssueStatus` | espião, numa run que reabre de verdade |
| 5. `created_by` nulo, `source='sentry'` | inspeção do payload do insert |
| 6. arquivado por humano não ressuscita | decisão pura + job inteiro |
| 7. run repetida é no-op | **duas runs reais contra Postgres real** |
| 8. dry-run não escreve nada | zero mutações, com controle que prova que escreveria |

O item 3 tem controle: a MESMA rajada contra uma tabela **sem** o índice deixa 12
linhas. Sem isso, "sobrou 1" seria compatível com "as inserções nem foram
concorrentes".

#### Harness da Fase 3

`server/lib/sentryTaskIntake.pg.test.ts` e `server/lib/sentryTaskDedup.pg.test.ts`
pulam por padrão (declarados em `scripts/skipsDeclarados.test.ts`). Receita:

```bash
docker run -d --name bnt-fase3-pg -e POSTGRES_PASSWORD=test -e POSTGRES_DB=bnt postgres:16-alpine
docker exec bnt-fase3-pg psql -U postgres -d bnt -c "
  create schema if not exists auth;
  create table if not exists auth.users (id uuid primary key default gen_random_uuid());
  create or replace function public.set_updated_at() returns trigger language plpgsql as \$\$
  begin new.updated_at = now(); return new; end \$\$;
  create role anon nologin; create role authenticated nologin;
  create role service_role nologin bypassrls;"
for m in 20260727160000_create_admin_tasks 20260728120100_drop_bug_from_admin_task_type \
         20260731040000_readd_bug_to_admin_task_type 20260731050000_add_sentry_fields_to_admin_tasks \
         20260731050100_add_task_automation_flags 20260731050200_allow_system_actor_on_admin_tasks \
         20260731050300_add_archive_provenance_to_admin_tasks; do
  docker exec -i bnt-fase3-pg psql -U postgres -d bnt -v ON_ERROR_STOP=1 < supabase/migrations/$m.sql
done
# semear o quadro BUG com sentry_sync_enabled=true e a etapa Sentry com
# is_pinned=true, intake_source='sentry'; depois subir o PostgREST na 55443
# (PGRST_DB_ANON_ROLE=service_role, PGRST_JWT_SECRET=segredo-de-teste-com-mais-de-32-caracteres-ok)
BNT_PG_CONTAINER=bnt-fase3-pg npx vitest run server/lib/sentryTaskDedup.pg.test.ts
BNT_SYNC_HARNESS=1 npx vitest run server/lib/sentryTaskIntake.pg.test.ts
```

### Fase 4: interface

Só agora a tela.

- Seção "Sentry" no `TaskModal` existente, renderizando o `jsonb`. **Seção
  adicional, não modal novo** (invariante 8).
- Etapa fixada: cadeado no cabeçalho, sem alça de arrastar, sem opção de excluir,
  sem badge de WIP.
- Recusa de drop de card manual na etapa fixada (questão E), sinalizada **antes**
  do drop.
- Autor "Sentry" no cabeçalho do card e nas linhas do log.
- Resolver com fallback neutro para `source`, como manda a convenção. Um `source`
  que o bundle não conhece não pode derrubar o modal.

Arquivos: `TaskModal.tsx`, `TaskCard.tsx`, `TasksDashboard.tsx`,
`taskActivityMeta.ts`, `resolveBoardDrop.ts`, `types.ts`.

Antes de escrever qualquer mutação aqui: a seção "Regra das mutações otimistas"
do `docs/tarefas-modulo.md` (invariante 9). Em particular, se a recusa de drop
gerar rollback, ele é **por campo tocado**, nunca do snapshot.

### Fase 5: migração dos dados e desligar a aba

A única fase que remove coisa. Depois dela o `admin_bugs` para de receber escrita.

- M6: os 25 bugs viram tarefas (aditiva para `admin_tasks`, e **idempotente por
  constraint**: `legacy_bug_id` com índice único e `on conflict do nothing`).
- Rotas de escrita de `/api/admin/bugs` passam a devolver 410. O `GET` fica de pé
  por enquanto (é o que permite conferir a migração sem restaurar backup).
- `?section=bugs` redireciona para `?section=tarefas&board=bugs`, preservando o
  resto da query (o `withTaskParam` já tem o padrão de preservação).
- Nav, `AdminSectionId` e render da seção saem do `Admin.tsx`.
- Os três e-mails passam a linkar para a aba de tarefas.
- Card no `DEV`: "dropar `admin_bugs`", com a data a partir da qual é seguro
  (invariante 4).

Esta fase roda **fora** da janela de migration destrutiva? Sim: ela não altera
nem remove dado, só insere em `admin_tasks`. Mas eu recomendo tratar como se
estivesse na janela mesmo assim, porque é a única com volume de escrita e a
única cujo erro custa reverter à mão.

### Fase 6: ligar o sync

Um comando, `sentry_sync_enabled = true` no quadro `BUG`. Depois disso, 24h de
observação antes de qualquer outra coisa.

- M7: agendamento do `pg_cron`. **Por último de tudo**, e por um motivo escrito
  na migration vizinha (`20260723120100:11`): cron agendado antes do endpoint
  existir bate em 404.

O que observar nas 24h: quantos cards nasceram, quantos e-mails saíram, se
alguma issue duplicou, se alguma ficou sem etiqueta.

### ~~Fase 7: remover a sincronização reversa~~ (CANCELADA)

**Cancelada pela Emenda 1.** O push de resolução fica. O que era a Fase 7 vira
uma obrigação de teste dentro da fase que mexer no `moveTask`:

- transição para coluna `is_done` empurra `resolved` para o Sentry;
- transição para fora de `is_done` empurra `unresolved`;
- falha no Sentry **não** desfaz o movimento no quadro (o push é
  fire-and-forget e persiste `sentry_sync_pending` para o retry);
- controle negativo: um espião que falha se o **job** chamar
  `updateIssueStatus`. O invariante vigente proíbe a escrita automática, não a
  humana, e é essa fronteira que o teste trava.

---

## 4. Migrations, na ordem

Sete. Nenhuma é destrutiva, e digo isso com a definição do `CLAUDE.md`: nenhuma
faz `drop column`, `drop table`, `alter column type`, `delete` ou `rename`.
Todas são isentas da janela de 05h-09h. Mas **três restringem** em vez de
adicionar, e essas podem falhar, o que é diferente de destruir.

| # | Arquivo | Fase | Aditiva ou restritiva | Pode falhar? |
| --- | --- | --- | --- | --- |
| M1 | `20260731040000_readd_bug_to_admin_task_type` | 1 | **Alarga** o CHECK | Não |
| M2 | `20260731040100_fix_bug_board_start_column` | 1 | `update` de 2 flags | Não |
| M3 | `20260731050000_add_sentry_fields_to_admin_tasks` | 2 | Aditiva + **2 índices únicos** | Não (colunas nascem nulas) |
| M4 | `20260731050100_add_task_automation_flags` | 2 | Aditiva + 1 índice único | Não |
| M5 | `20260731050200_allow_system_actor_on_admin_tasks` | 2 | **Relaxa** NOT NULL + coluna com CHECK | Não |
| M6 | `20260731050300_add_archive_provenance_to_admin_tasks` | 2 | Aditiva + trigger + **constraint** | Não (zero linhas arquivadas) |
| M7 | `migrate_admin_bugs_to_tasks` | 5 | `insert` de 25 linhas | **Sim** |
| M8 | `schedule_sync_sentry_tasks` | 6 | `cron.schedule` | Não |

Ordem de aplicação da Fase 2: **M3, M4, M5, M6**, nesta sequência. As quatro são
independentes entre si (nenhuma referencia coluna criada por outra), então a
ordem é conveniência, não dependência. As quatro podem ser aplicadas antes do
deploy do código: coluna nullable nova é tolerada por código antigo, e o trigger
de M6 existe justamente para o código antigo continuar arquivando sem saber da
coluna nova.

Detalhamento das três que podem falhar ou que merecem atenção:

**M2** é `update`, e o `CLAUDE.md` lista `update` de backfill como destrutivo.
Aqui são dois booleanos de configuração em duas linhas, sem perda de dado e com
rollback trivial (inverter). Registro a divergência de propósito em vez de
escondê-la: se você preferir tratar como destrutiva e rodar na janela, o custo é
zero.

**M3** cria dois índices únicos parciais:
`unique (sentry_numeric_id) where sentry_numeric_id is not null` e
`unique (legacy_bug_id) where legacy_bug_id is not null`. Ambos sobre colunas
recém-criadas, portanto integralmente nulas, portanto **não podem falhar por dado
existente**. Falham se a migration for reaplicada depois de dados duplicados
entrarem, que é exatamente o que se quer que aconteça.

Escolha do `sentry_numeric_id` (o `id` do grupo) e não do `shortId` como chave de
deduplicação: os dois são estáveis, mas o numérico é o que a API sempre devolve
na listagem e o que as rotas de leitura por id aceitam. O `shortId` é para gente
ler. Unicidade **global**, não por quadro: uma issue é uma tarefa, ponto.

**M5** faz `alter column created_by drop not null`. Relaxar restrição nunca falha
e nunca perde dado. Precedente na própria base: `admin_task_boards.created_by` já
é nullable, com a justificativa escrita na migration
(`20260727160000:46`, "o board semeado por esta migration nao tem autor humano").
Aqui é a mesma necessidade, agora para o robô.

Alternativa descartada: criar uma linha em `auth.users` para "Sentry". Custo:
uma conta de verdade, que aparece em listagens de usuário, conta em métricas e
pode receber e-mail. O ator de sistema não é um usuário e não deve virar um.

**M6** é a única da Fase 2 que acrescenta uma constraint capaz de recusar uma
escrita: `(archived_at is null) = (archived_source is null)`. Ela não pode falhar
na aplicação (zero linhas arquivadas hoje, conferido), mas poderia falhar
**depois**, em toda escrita do código atual, que arquiva setando só
`archived_at`. É o trigger que impede isso, e é por isso que ele não é
preciosismo: sem ele, esta migration quebra o arquivamento em produção no
instante em que for aplicada.

Ela também é a única da fase que mexe nos contadores do guard, e nos **dois**:
`EXPECTED_FUNCTION_COUNT` (27 para 28, a função nova entra no conjunto declarado)
e `EXPECTED_TRIGGER_FUNCTION_COUNT` (4 para 5, porque ela devolve `trigger` e sai
do conjunto verificável por REST). Subir só um dos dois esconderia uma função
real que a classificação passou a tratar como trigger.

**M7** insere 25 linhas em `admin_tasks`. É a única com volume. Idempotência por
`legacy_bug_id` + `on conflict do nothing`, nunca por `not exists` (a janela de
corrida é a mesma que o invariante 3 proíbe). Não apaga nem altera `admin_bugs`.

Ordem de aplicação, com o passo de deploy no meio:

```
M1, M2                      -> deploy Fase 1  -> check:migrations
M3, M4, M5, M6              -> deploy Fase 3 (sync desligado) -> check:migrations
                            -> deploy Fase 4 (interface)
M7                          -> deploy Fase 5  -> conferir os 25 cards
                            -> ligar sentry_sync_enabled
M8                          -> observar 24h
```

M3 a M6 podem ir antes do deploy sem violar a regra "código antes da migration":
coluna nullable nova é tolerada por código antigo, que simplesmente não a
seleciona, e o trigger de M6 cobre a única escrita que o código antigo faz e que
a constraint nova alcança. O que **não** pode ir antes é M8, pelo motivo já
registrado na migration vizinha.

**Asserção comportamental obrigatória.** M2 e M6 não criam tabela nem função:
são invisíveis para o `check:migrations`, que verifica tabelas e funções por
nome. É literalmente a classe do `get_ai_usage_today`, que ficou verde por 17
dias sobre um banco onde a mudança não estava. Então M2 e M6 exigem entrada em
`ASSERCOES` (`scripts/checkMigrationsApplied.mts:597`) afirmando o **resultado**:
para M2, qual etapa do quadro `BUG` tem `is_start`; para M6, a **contagem exata**
de tarefas com `legacy_bug_id` não nulo, por etapa. Contagem, não pertinência.
Sem isso as duas não estão prontas.

---

## 4-bis. Dois defeitos que só o harness pegou (2026-07-31)

Os dois são sobre **o que o outro lado aceita**, e nenhum mock os pega. A lição é
a mesma do CLAUDE.md: o instrumento que não simula a condição é o que pega.

### 1. `on conflict` não casa com índice único PARCIAL

A primeira versão da M3 criava os dois índices com `where <coluna> is not null`,
para não ocupar espaço com card humano. Contra Postgres real:

```
ERROR: there is no unique or exclusion constraint matching the ON CONFLICT specification
```

O Postgres exige que o alvo repita o predicado (`on conflict (col) where ...`), e
o PostgREST só sabe mandar NOMES DE COLUNA no `onConflict`. Com índice parcial, o
insert do sync falharia em toda execução e o invariante 3 seria impossível de
cumprir pelo caminho que o módulo usa.

E o predicado não era necessário: em índice único comum o Postgres trata NULLs
como distintos, então N cards humanos convivem. Verificado, não suposto: 5 nulos
inseridos, todos aceitos. **Os dois índices deixaram de ser parciais**, e a M3
mudou depois de aprovada.

### 2. `statsPeriod=` vazio passou a dar 400, e já quebrava produção

`getIssuesByNumericIds` fazia `set("statsPeriod", "")`, que manda `statsPeriod=`
na URL. Medido nos dois sentidos contra a API viva:

| Forma | Resposta |
| --- | --- |
| `statsPeriod=` | **400** `{"detail":"Invalid statsPeriod: ''"}` |
| parâmetro ausente | 200 |
| `statsPeriod=24h` | 200, e recorta (issue de 9 dias não volta) |
| `statsPeriod=14d` | 200 |

Essa função é a mesma que o job `reconcile-sentry-bugs` usa **em produção**.
`cron_run_logs` confirma: `partial` com esse erro em **78 runs seguidas**, desde
2026-07-30 13:15 (última run sadia às 13:00). A reabertura automática de bug do
tracker antigo estava morta havia cerca de 19 horas, e o que impediu isso de
virar dano foi o fail-safe "falha de leitura não toca em card nenhum".

O guard funcionou: o motivo real estava gravado no payload. Ninguém olhou. É
literalmente o que esta fase previa, "vai rodar a cada 15 minutos e ninguém vai
olhar".

**Correção**: omitir o parâmetro em vez de mandar vazio.

### A correção de desenho que o defeito 2 forçou

Não dá para **provar** que o filtro por id sem `statsPeriod` é ilimitado: a issue
mais velha da organização tem 9 dias, então não há como testar 21+. E disso
dependia a poda inteira: se a janela implícita for menor que 21 dias, toda issue
elegível estaria fora do lote, `lastSeen` viria `undefined`, e a poda **nunca
dispararia, em silêncio**.

Por isso o silêncio passou a ser medido pelo `sentry_last_seen` **persistido** no
nosso card, com o valor fresco tendo precedência quando existe. A assimetria é de
propósito e está travada por teste:

- **recorrência** (reabrir, ressuscitar) exige evidência FRESCA. Usar o
  persistido faria o card reabrir para sempre, porque o valor guardado não muda
  sozinho.
- **silêncio** (podar) pode ser medido pelo que já sabemos. Ausência no lote não
  é falta de informação aqui: é consistente com "está quieto".

Isso remove a dependência de uma incógnita da API.

## 5. O que eu acho que vai dar errado

Em ordem de probabilidade multiplicada por custo.

**1. A duplicação vai aparecer na primeira run, pelas 6 linhas já vinculadas.**
Se M6 não carregar `sentry_numeric_id` para os cards migrados, ou se carregar o
`shortId` na coluna errada, a primeira run do sync cria um card novo ao lado de
cada um dos 6. O índice único não protege, porque o card migrado ficou com a
coluna nula. É o erro mais provável do projeto inteiro, e o mais fácil de não
notar: 6 cards a mais numa etapa que acabou de ganhar 20. Verificação
específica: contar cards com `sentry_numeric_id` não nulo antes e depois da
primeira run.

**2. O orçamento de requisições ao Sentry vai estourar em silêncio.** "Preenchida
com o máximo de detalhe" custa 3 requisições por issue nova. Numa release ruim
com 40 issues novas, são 120 requisições em uma run. O `sentryFetch` trata 429
devolvendo estado, e o job vai parar a fase, o que é o comportamento certo. O que
me preocupa é o efeito: cards nascem **pela metade**, com o bloco `jsonb`
incompleto, e nada distingue "não tinha release" de "não deu tempo de buscar". O
`jsonb` precisa registrar a diferença explicitamente, e o card incompleto precisa
ser retentado na run seguinte. Isso é desenho da Fase 3, não conserto depois.

**3. ~~`statsPeriod` vai dar 400 quando alguém quiser uma janela maior.~~
RESOLVIDO na Fase 1.** Era um bug latente: `SentryQuerySchema` aceitava
`^\d{1,3}[hdwm]$` e o endpoint de listagem só aceita `''`, `24h` e `14d`.
Trocado por lista fechada, com teste que inclui `7d` e `1h` de propósito
(sintaticamente impecáveis e mesmo assim inválidos), porque são eles que provam
que a troca foi de formato para domínio e não um regex um pouco mais apertado.

**4. O primeiro e-mail de resumo agrupado vai sair errado.** Não pelo conteúdo,
pelo gatilho: run que não criou nada não pode mandar e-mail, e é fácil escrever
`if (created.length)` no lugar errado da função e mandar "0 tarefas criadas" a
cada 15 minutos. Quatro por hora, para uma caixa só. O sintoma aparece rápido, o
que é bom, mas queima confiança no canal justamente na estreia.

**5. Alguém vai arrastar um card do Sentry de volta para a etapa fixada.** Se a
recusa da questão E não for implementada (ou for só visual), o card volta a ser
elegível para o arquivamento automático, e some da fila sozinho depois. O rastro
existe (log de atividade), mas ninguém vai olhar. É por isso que eu recomendei
bloquear a entrada no servidor e não só na interface.

**6. A ausência total de teste do lado bugs vai cobrar na Fase 5.** Zero arquivos
de teste cobrem `admin_bugs`, o job de reconciliação, os três e-mails e as três
notificações. A Fase 5 mexe nos três e-mails (mudança de link) e desliga rotas.
Não há rede embaixo. Ou se escreve teste antes de mexer, ou se aceita que a
verificação é manual e ela vai para um roteiro versionado, no molde do
`docs/smoke-tarefas.md`. Roteiro em conversa some numa compactação, e o
`CLAUDE.md` tem um parágrafo inteiro sobre a vez em que isso aconteceu.

**7. O snapshot vai ficar lento antes de ficar grande.** O gargalo não é o número
de tarefas, são as três varreduras extras sobre `taskIds`
(`adminTasks.ts:727-771`). Dobrar a base do módulo (26 para 51 na Fase 5) não vai
doer. O feed rodando por três meses, sim. O arquivamento automático da questão A
é o que segura isso, e ele **precisa** entrar junto com o sync, não depois. Sync
sem poda é a versão do projeto que funciona por seis semanas e depois trava a
aba.

**8. O push de resolução vai disparar por arrasto acidental.** Substitui o risco
original (que era sobre cumprir o invariante 6 e saiu com a Emenda 1). O gatilho
mudou de natureza: era um select de status, passa a ser arrastar um card para a
coluna Concluído. Arrasto errado marca resolvido no Sentry.

É autocurável **enquanto a simetria existir**: arrastar de volta desmarca. O
risco real não é o arrasto, é alguém quebrar a simetria depois, otimizando o
caminho de volta ("não precisa chamar o Sentry quando sai de Concluído, o card
já estava certo"). Nesse dia o push vira mão única e o erro deixa de ter
conserto pela interface. É o teste "transição para fora de `is_done` empurra
`unresolved`" que trava isso, e é por isso que ele é obrigatório e não
desejável.
