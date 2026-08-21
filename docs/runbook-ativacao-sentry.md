# Runbook: ativar o feed do Sentry no quadro BUG

Passos de banco da Fase 6 de `docs/plano-unificar-bugs-tarefas.md`. O código já
está em produção; daqui para a frente é SQL editor.

**Estado de partida** (verificado em 2026-08-03, antes de qualquer bloco):

| Item                             | Valor                                                     |
| -------------------------------- | --------------------------------------------------------- |
| `admin_bugs`                     | 25 linhas, 6 com `sentry_numeric_id`, 0 órfãs             |
| ShortIds vinculados              | `NODE-EXPRESS-1, 2, 3, 7, 8, 9`                           |
| Quadro `BUG`                     | 5 etapas, `Sentry` na posição 1000, `is_start` ainda nela |
| Cards no `BUG`                   | 1 (`BUG-1`)                                               |
| `admin_tasks.type` aceita `bug`? | **NAO** (CHECK ainda sem `bug`)                           |
| Migrations da Fase 1             | **as duas pendentes**                                     |
| Migrations da Fase 2             | pendentes                                                 |

### Ha um defeito ATIVO em producao agora, e o 3.1-B o fecha

O deploy desta serie devolveu a opcao **Bug** ao campo Tipo da tarefa
(`TASK_TYPES`, `TaskType`, `TYPE_META`), e o `CHECK` do banco continua sem esse
valor. **Escolher Bug numa tarefa hoje devolve 400.**

E a janela de deploy invertida: o codigo novo esperando um schema que nao chegou.
Ela existe porque a regra do projeto manda deployar codigo ANTES da migration, e
a migration ainda nao foi aplicada. O bloco **3.1-B** e o que a fecha, e por isso
ele e o mais urgente da lista, apesar de nao ser o mais perigoso.

Se qualquer um divergir agora, **pare**: a segunda migration do 3.1-B, o bloco
3.5 e a asserção do 3.4 casam etapa por nome e contam linhas.

**Ordem obrigatória.** Cada bloco depende do anterior. O 3.6 é o último porque
agenda um cron que chama um endpoint, e agendar antes do endpoint existir seria
404 a cada 15 minutos. O endpoint já subiu, então a ordem está satisfeita.

**`sentry_sync_enabled = true` NÃO está neste arquivo.** Ele mora em
`docs/runbook-ligar-sentry.md`, separado de propósito, e só depois do dry-run.

---

## 3.1 Desagendar o `reconcile-sentry-bugs`

O job legado opera sobre `admin_bugs`, que passou a ser somente leitura. As três
fases dele ficaram sem sentido, e a terceira é ativamente errada: reabriria bugs
numa tabela que ninguém lê e mandaria e-mail sobre um bug cuja representação viva
agora é o card em Tarefas. Justificativa completa na Fase 5 do plano.

```sql
select cron.unschedule(jobid)
from cron.job
where jobname = 'reconcile-sentry-bugs';
```

**Esperado:** uma linha, com o `jobid` que foi removido.

**Verificação:**

```sql
select jobname, schedule, active from cron.job order by jobname;
```

`reconcile-sentry-bugs` **não pode** aparecer. Os demais jobs continuam.

**Se divergir:** zero linhas no `unschedule` significa que ele já não estava
agendado; confira a verificação e siga. Se ainda aparecer na lista, não siga:
ele voltaria a rodar sobre uma tabela congelada.

---

## 3.1-B Migrations da Fase 1 (2 arquivos, nesta ordem)

**Estas duas ficaram de fora da primeira versao deste runbook.** Sem elas o bloco
3.4 falha por violacao de constraint e a emenda 2 do plano fica desfeita. O que
cada uma resolve esta abaixo.

### Por que aqui, e nao depois

Verificado, nao suposto: nenhuma das duas referencia coluna criada na Fase 2
(`is_pinned`, `intake_source`, `source`, `sentry_*`, `archived_source`,
`legacy_bug_id`). A primeira so altera um CHECK de `admin_tasks`; a segunda so
atualiza `is_start` em `admin_task_columns`. Ambas dependem apenas do schema que
ja esta em producao desde julho, entao rodam antes de tudo.

### 1. `20260731040000_readd_bug_to_admin_task_type.sql`

Devolve `bug` ao CHECK de `admin_tasks.type`. **ALARGA** o dominio: nao existe
linha que possa violar um CHECK mais permissivo, entao nao pode falhar por dado
existente.

Fecha o 400 descrito no estado de partida, e e pre-requisito do 3.4: a migracao
de dados insere as 25 tarefas com `type = 'bug'`.

**Esperado:** dois `ALTER TABLE` e `COMMIT`.

### 2. `20260731040100_fix_bug_board_start_column.sql`

Move o `is_start` do quadro `BUG` da etapa `Sentry` para `Bugs Reportados`.

Isto e a **emenda 2** do plano, e nao acabamento. A etapa fixada significa
"criado pelo Sentry, ninguem triou", e e essa semantica que autoriza o job a
arquivar sozinho (poda) e a ressuscitar. Com o `is_start` nela:

- card novo criado a mao sem etapa explicita nasce dentro do balde do robo;
- card REABERTO volta para la, e a poda por silencio pode arquivar sozinho um
  card que voce sabe que regrediu.

O segundo e o buraco que a emenda 2 fechou. Sem esta migration, o job entraria em
producao com ele aberto.

A migration casa a etapa **por nome** e por isso termina num bloco de assercao
que afirma o total: exatamente uma etapa `is_start` no quadro `BUG`, e o nome
dela e `Bugs Reportados`. Divergencia levanta excecao e desfaz.

**Esperado:** dois `UPDATE` e `COMMIT`, sem `NOTICE`.

### Verificacao dos dois

```sql
select
  (select count(*) from pg_constraint
    where conname = 'admin_tasks_type_check'
      and pg_get_constraintdef(oid) like '%''bug''%') as check_aceita_bug_esperado_1,
  (select count(*) from admin_task_columns c
     join admin_task_boards b on b.id = c.board_id
   where b.key = 'BUG' and c.is_start) as etapas_iniciais_esperado_1;

-- Qual e a etapa inicial agora. Esperado: Bugs Reportados.
select c.name, c.position, c.is_start
from admin_task_columns c join admin_task_boards b on b.id = c.board_id
where b.key = 'BUG' order by c.position;
```

**Se ja estiverem aplicadas:** as duas sao idempotentes. A primeira faz
`drop constraint if exists` seguido de `add constraint`, entao reaplicar so
reescreve o mesmo CHECK. A segunda tem os `update` condicionados
(`and c.is_start` / `and not c.is_start`), entao a segunda passada casa zero
linhas e a assercao continua verdadeira. Reaplicar e seguro; basta conferir a
saida acima.

**Se a assercao da segunda disparar:** a etapa foi renomeada. Nada foi alterado
(transacao). Ajuste o nome no `update` e reaplique. Este e o mesmo cuidado do
bloco 3.5, que casa a mesma etapa pelo mesmo nome.

---

## 3.2 Migrations da Fase 2 (4 arquivos, nesta ordem)

Aditivas, isentas da janela de migration destrutiva. Não podem falhar por dado
existente: criam colunas nullable sobre tabelas que já existem.

Cole na ordem, um por vez, o conteúdo de:

1. `supabase/migrations/20260731050000_add_sentry_fields_to_admin_tasks.sql`
2. `supabase/migrations/20260731050100_add_task_automation_flags.sql`
3. `supabase/migrations/20260731050200_allow_system_actor_on_admin_tasks.sql`
4. `supabase/migrations/20260731050300_add_archive_provenance_to_admin_tasks.sql`

**Esperado:** `COMMIT` em cada, sem `NOTICE` nem erro.

**Verificação, depois dos quatro:**

```sql
select
  (select count(*) from information_schema.columns
    where table_name = 'admin_tasks'
      and column_name in ('source','sentry_issue_id','sentry_numeric_id',
        'sentry_issue_url','sentry_data','sentry_last_seen',
        'sentry_last_checked_at','sentry_reopen_event_at','legacy_bug_id',
        'archived_source')) as colunas_novas_esperado_10,
  (select count(*) from information_schema.columns
    where table_name = 'admin_task_columns'
      and column_name in ('is_pinned','intake_source')) as flags_etapa_esperado_2,
  (select count(*) from information_schema.columns
    where table_name = 'admin_task_boards'
      and column_name = 'sentry_sync_enabled') as flag_quadro_esperado_1,
  (select count(*) from pg_indexes
    where tablename = 'admin_tasks'
      and indexname in ('admin_tasks_sentry_numeric_id_key',
        'admin_tasks_legacy_bug_id_key')) as indices_unicos_esperado_2,
  (select count(*) from pg_trigger
    where tgname = 'admin_tasks_set_archive_source') as trigger_esperado_1;
```

Todos os cinco têm que bater com o nome da coluna (10, 2, 1, 2, 1).

**Se divergir:** não siga para 3.4. A migração de dados depende de
`legacy_bug_id` e dos dois índices únicos, e sem eles ela não é idempotente.

---

## 3.3 Migration da Fase 5.5

```
supabase/migrations/20260801050000_add_sentry_push_pending_to_admin_tasks.sql
```

Aditiva: uma coluna nullable com CHECK e um índice parcial.

**Verificação:**

```sql
select
  (select count(*) from information_schema.columns
    where table_name = 'admin_tasks'
      and column_name = 'sentry_sync_pending') as coluna_esperado_1,
  (select count(*) from pg_indexes
    where indexname = 'admin_tasks_sentry_push_pendente_idx') as indice_esperado_1;
```

### Rode `pnpm check:migrations` AQUI

Primeiro dos dois pontos. Neste momento todas as migrations de schema estão
aplicadas e a de dados ainda não, que é a fronteira certa para conferir o
esquema sem ruído de conteúdo.

**Esperado:** `82 tabela(s) declaradas`, `23 funcao(oes) declaradas existem`,
`5 de trigger nao sao verificaveis por REST`, e **nenhuma** linha dizendo
`mudou` ou `esperado`.

**Se aparecer `o conjunto de funcoes declaradas mudou`:** os contadores em
`scripts/checkMigrationsApplied.mts` estão em 28/5 e foram conferidos contra o
banco em 2026-08-03. Divergência aqui significa que outra migration entrou entre
aquela medição e agora. **Investigue o parser antes de mexer no número**, como
manda o `CLAUDE.md`.

---

## 3.4 Migration de dados da Fase 5

```
supabase/migrations/20260801040000_migrate_admin_bugs_to_tasks.sql
```

**DEPENDE DO 3.1-B.** As 25 tarefas nascem com `type = 'bug'`, e sem a
`20260731040000` o CHECK ainda recusa esse valor. O modo de falha e diferente do
das assercoes: violacao de constraint, com mensagem falando de
`admin_tasks_type_check` e nao de migracao. Medido contra Postgres real: a
transacao inteira e desfeita e ficam **0 tarefas**, sem dano, mas a mensagem nao
explica a causa.

**Esta é a única que pode falhar de propósito, e falhar aqui é o desenho
funcionando.**

Ela termina num bloco `do $$ ... $$` que afirma por contagem: 25 de 25 migradas,
6 de 6 com vínculo do Sentry, zero com shortId sem id numérico, zero sem autor,
zero concluídas sem `completed_at` e **zero com `type` diferente de `bug`**.
Qualquer divergência levanta exceção.

A do `type` foi acrescentada depois da primeira versão deste runbook. Ela parece
redundante (o insert escreve `'bug'` literal) e não é: sem ela, 25 linhas com o
tipo errado passariam em todas as demais verificações, porque as outras contam
linhas e não afirmam valores. Testada por quebra deliberada.

**Exceção aqui significa "não migrou nada e o banco está intacto", não "quebrou
o banco".** Tudo roda dentro de uma transação: a exceção desfaz o insert inteiro,
`admin_bugs` não é tocada em nenhum caminho, e você pode reler a mensagem, corrigir
e reaplicar. Foi testado assim, com quatro quebras deliberadas.

**Esperado:**

```
INSERT 0 25
NOTICE:  migradas 25 tarefas, 6 com vinculo do Sentry
COMMIT
```

**Verificação:**

```sql
select
  (select count(*) from admin_bugs) as bugs_intactos_esperado_25,
  (select count(*) from admin_tasks where legacy_bug_id is not null) as migradas_esperado_25,
  (select count(*) from admin_tasks
    where legacy_bug_id is not null and sentry_numeric_id is not null) as com_vinculo_esperado_6,
  (select count(*) from admin_tasks
    where legacy_bug_id is not null and sentry_sync_pending is not null) as push_pendente_esperado_0,
  (select count(*) from admin_tasks
    where legacy_bug_id is not null and type <> 'bug') as tipo_errado_esperado_0;

-- distribuicao por etapa: 6 Bugs Reportados, 9 Em Progresso, 10 Concluido
select c.name, count(*)
from admin_tasks t join admin_task_columns c on c.id = t.column_id
where t.legacy_bug_id is not null
group by c.name order by c.position;
```

O `push_pendente_esperado_0` é a prova de que os 10 concluídos migrados ficaram
inertes: nenhum deles empurra resolvido para o Sentry por efeito de migração.

**Se a exceção disparar:** leia a mensagem, ela nomeia o número e o esperado.
Nenhum card foi criado. Não reaplique sem entender a causa.

**Reaplicar é seguro:** `on conflict (legacy_bug_id) do nothing` mantém em 25.

---

## 3.5 Marcar a etapa de intake

Sem este bloco o job responde `sem_etapa_de_intake` e **aborta de propósito**:
quadro ligado sem etapa de intake é estado inválido, e escolher uma etapa
sozinho seria criar card em lugar arbitrário e chamar isso de sucesso.

```sql
begin;

update public.admin_task_columns c
set is_pinned = true, intake_source = 'sentry'
from public.admin_task_boards b
where c.board_id = b.id and b.key = 'BUG' and c.name = 'Sentry';

-- Afirma o TOTAL, nao a pertinencia: "a etapa que eu queria esta marcada"
-- passaria com tres marcadas, e o indice unico de intake por quadro so pegaria
-- o segundo intake_source, nao um is_pinned a mais.
do $$
declare
  v_pinned integer;
  v_intake integer;
  v_nome text;
begin
  select count(*) into v_pinned
  from public.admin_task_columns c
  join public.admin_task_boards b on b.id = c.board_id
  where b.key = 'BUG' and c.is_pinned;

  select count(*) into v_intake
  from public.admin_task_columns c
  join public.admin_task_boards b on b.id = c.board_id
  where b.key = 'BUG' and c.intake_source = 'sentry';

  if v_pinned <> 1 or v_intake <> 1 then
    raise exception
      'esperado exatamente 1 etapa fixada e 1 de intake no quadro BUG, encontrou % e %',
      v_pinned, v_intake;
  end if;

  select c.name into v_nome
  from public.admin_task_columns c
  join public.admin_task_boards b on b.id = c.board_id
  where b.key = 'BUG' and c.is_pinned;

  if v_nome <> 'Sentry' then
    raise exception 'a etapa fixada do quadro BUG e "%", esperado "Sentry"', v_nome;
  end if;
end $$;

commit;
```

**Esperado:** `UPDATE 1` e `COMMIT`, sem `NOTICE`.

**Verificação:**

```sql
select c.name, c.position, c.is_start, c.is_pinned, c.intake_source
from admin_task_columns c join admin_task_boards b on b.id = c.board_id
where b.key = 'BUG' order by c.position;
```

`Sentry` com `is_pinned = t` e `intake_source = sentry`; `Bugs Reportados` com
`is_start = t`; nenhuma outra com `is_pinned`.

**Se a exceção disparar:** a etapa foi renomeada. Nada foi alterado (transação).
Ajuste o nome no `update` e reaplique.

---

## 3.6 Agendar o cron (M8)

**Por último.** O endpoint já existe em produção desde o deploy desta série.

```sql
begin;

-- Idempotente: limpa agendamento anterior, se houver.
select cron.unschedule(jobid) from cron.job where jobname = 'sync-sentry-tasks';

-- A cada 15 minutos, mesma cadencia do job legado que saiu no 3.1. O sinal nao
-- e urgente e o job respeita o rate limit do Sentry.
select cron.schedule(
  'sync-sentry-tasks',
  '*/15 * * * *',
  $$SELECT public.call_cron_endpoint('/api/cron/sync-sentry-tasks')$$
);

commit;
```

**Esperado:** o `unschedule` devolve zero linhas na primeira vez; o `schedule`
devolve o `jobid` novo.

**Verificação:**

```sql
select jobname, schedule, active from cron.job where jobname = 'sync-sentry-tasks';
```

**Neste momento o job passa a rodar a cada 15 minutos e não faz nada**, porque
`sentry_sync_enabled` é `false` em todos os quadros. É o estado inerte esperado.
Confirme depois de uns 20 minutos:

```sql
select status, payload->>'estado' as estado, started_at
from cron_run_logs where job_name = 'sync-sentry-tasks'
order by started_at desc limit 3;
```

Esperado: `success` com `estado = sem_quadro_ligado`.

### Rode `pnpm check:migrations` AQUI, de novo

Segundo e último ponto. Agora com tudo aplicado.

**Esperado:** o mesmo do 3.3. Os contadores não mudam entre 3.3 e 3.6, porque
nem a migração de dados nem os dois blocos manuais criam tabela ou função.

---

## 4. O dry-run

```bash
curl -s -X POST \
  "https://api.boranatech.com.br/api/cron/sync-sentry-tasks?dryRun=1" \
  -H "x-cron-secret: $CRON_SECRET" | jq
```

O segredo vai no **header**, nunca na querystring: `requireCronSecret` só aceita
assim, para não vazar em log de proxy. Pegue o valor de `CRON_SECRET` no Railway.

Se `jq` não estiver à mão, tire o `| jq` e leia cru.

### O que esperar

| Campo                | Esperado                                   |
| -------------------- | ------------------------------------------ |
| `estado`             | `"ok"`                                     |
| `quadrosProcessados` | `1`                                        |
| `criados`            | **~18**, e nenhum dos 6 migrados           |
| Divisão do `motivo`  | Frontend e Backend, sem terceira categoria |
| `semEtiqueta`        | `[]`                                       |
| `foraDoTeto`         | `[]`                                       |
| `detalheIncompleto`  | poucos ou vazio                            |
| `decisoes`           | 25, todas com `tipo: "nada"`               |
| `ingestaoAbortada`   | `null`                                     |
| `manutencaoAbortada` | `null`                                     |
| `pushesReenviados`   | tudo em zero                               |

O número 18 foi medido em 2026-08-01 contra o Sentry real, com os 25 bugs já
migrados. Ele **vai variar**: issues novas apareceram desde então. O que não pode
variar é a ausência dos 6 migrados.

**Confirme que nenhum destes aparece em `criados`:**

```
NODE-EXPRESS-1   NODE-EXPRESS-2   NODE-EXPRESS-3
NODE-EXPRESS-7   NODE-EXPRESS-8   NODE-EXPRESS-9
```

### Zero escrita, confirmada

```sql
select count(*) from cron_run_logs
where job_name = 'sync-sentry-tasks' and payload->>'dryRun' = 'true';
```

**Esperado: 0.** Dry-run não grava linha em `cron_run_logs` de propósito: ele não
é uma execução do job, e registrá-lo poluiria o histórico com runs que não
aconteceram.

E o banco:

```sql
select count(*) from admin_tasks where source = 'sentry';
```

**Esperado: 0.** Nenhum card do sync existe ainda.

### Critérios de ABORTAR

Se qualquer um aparecer, **não ligue**:

1. **Qualquer um dos 6 shortIds migrados em `criados`.** O vínculo não pegou e
   ligar duplicaria esses cards. É o risco número 1 do projeto.
2. **`estado` diferente de `"ok"`.** `schema_pendente` = faltou migration.
   `sem_quadro_ligado` = o 3.5 não pegou. `sem_etapa_de_intake` = idem.
3. **`quadrosProcessados` diferente de 1.** Mais de um quadro ligado é
   configuração que ninguém pediu.
4. **`semEtiqueta` não vazio.** Projeto novo no Sentry que o mapa não conhece.
   Cards nasceriam sem área. Decida a etiqueta antes.
5. **`decisoes` com qualquer `tipo` diferente de `"nada"`.** Antes de ligar,
   nenhum card deveria ser reaberto, ressuscitado ou podado. `podar` aqui
   significaria arquivar card recém-migrado.
6. **`ingestaoAbortada` ou `manutencaoAbortada` não nulo.** Falha de leitura do
   Sentry. Não é perigoso (fail-safe), mas o relatório fica incompleto e você
   estaria decidindo sobre dado parcial.
7. **`criados` acima de 25.** É o teto por run: significa que há mais issues do
   que o job cria de uma vez, e a primeira run real deixaria parte de fora.
   Não impede ligar, mas você precisa saber antes.
8. **Qualquer linha em `cron_run_logs` com `dryRun = true`**, ou
   `count(*) from admin_tasks where source = 'sentry'` maior que zero. O dry-run
   escreveu, e isso contradiz o que oito testes afirmam. Pare e me avise.

Os critérios 1, 2, 3 e 8 são bloqueantes absolutos. Os 4, 5, 6 e 7 pedem
decisão sua antes de seguir.

---

## Nota: por que o 3.1-B faltava

Registrado para quem revisar este documento depois.

Ao escrever a primeira versão eu enumerei os blocos a partir das **fases do
plano** que ainda tinham passo de banco pendente, e a Fase 1 não parecia ter um:
ela foi majoritariamente código (o tipo `bug` de volta na interface), com as duas
migrations como detalhe. Enumerei a partir da minha memória do trabalho, e não a
partir do que existe no repositório.

É a classe de erro que o `CLAUDE.md` documenta: **escopo derivado de uma fonte
que encolhe em silêncio**. A lista de blocos parecia completa porque nada a
contradizia dentro do próprio documento, exceto uma contradição que ficou lá,
escrita, e que eu não vi: a tabela de estado de partida dizia que `is_start`
estava na etapa `Sentry`, e a verificação do 3.5 esperava `Bugs Reportados`, sem
nenhum bloco entre as duas movendo isso.

**A verificação que fecha essa classe**, e que agora está feita: comparar as
migrations do projeto no repositório com as citadas no runbook.

```bash
ls supabase/migrations/2026073*.sql supabase/migrations/2026080*.sql \
  | xargs -n1 basename | sort > /tmp/repo.txt
grep -ohE "2026(073|080)[0-9_a-z]+\.sql" docs/runbook-*.md | sort -u > /tmp/runbook.txt
comm -23 /tmp/repo.txt /tmp/runbook.txt
```

Resultado em 2026-08-04: **9 migrations no repositório e fora do runbook, das
quais 7 são de outras frentes** (reembolsos, `ai_usage_excluded_tools`, roadmap,
ações de auditoria) e não pertencem a este roteiro. As 2 restantes eram
exatamente as da Fase 1, agora no 3.1-B. **Nenhuma outra omissão.**
