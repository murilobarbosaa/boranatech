# Ligar o feed do Sentry

Arquivo separado de `docs/runbook-ativacao-sentry.md` **de propósito**: este é o
único bloco que faz o robô começar a escrever, e ele não pode ser colado por
engano junto com os passos de schema.

## Pré-requisitos

Todos os blocos 3.1, **3.1-B**, 3.2 a 3.6 aplicados, e o **dry-run lido**, com nenhum dos oito
critérios de abortar presente. Se você não leu o relatório do dry-run, volte.

## O bloco

```sql
update public.admin_task_boards
set sentry_sync_enabled = true
where key = 'BUG';
```

**Esperado:** `UPDATE 1`.

```sql
select key, name, sentry_sync_enabled from admin_task_boards order by position;
```

Só o `BUG` com `true`.

## A primeira run real

O cron roda a cada 15 minutos. Espere a próxima virada e confira.

### Em `cron_run_logs`

```sql
select status, started_at, finished_at, payload
from cron_run_logs
where job_name = 'sync-sentry-tasks'
order by started_at desc limit 1;
```

**Esperado:** `status = success`, e no `payload`:

| Campo                | Esperado                                                                       |
| -------------------- | ------------------------------------------------------------------------------ |
| `estado`             | `ok`                                                                           |
| `quadros`            | `1`                                                                            |
| `criados`            | o mesmo número do dry-run, mais ou menos as issues que apareceram no intervalo |
| `foraDoTeto`         | `[]`                                                                           |
| `semEtiqueta`        | `[]`                                                                           |
| `detalheIncompleto`  | vazio ou poucos                                                                |
| `ingestaoAbortada`   | `null`                                                                         |
| `manutencaoAbortada` | `null`                                                                         |

`status = partial` **não é falha**: significa que algo entrou em `foraDoTeto`,
`semEtiqueta`, `detalheIncompleto` ou houve aborto de fase. O motivo está no
payload, e é por isso que ele carrega o texto do erro e não só o estado.

### No banco

```sql
select
  (select count(*) from admin_tasks where source = 'sentry') as cards_do_sync,
  (select count(*) from admin_tasks where legacy_bug_id is not null) as migrados_intactos_25,
  (select count(*) from admin_task_label_links l
     join admin_tasks t on t.id = l.task_id where t.source = 'sentry') as com_etiqueta;

-- Nenhuma issue pode ter virado DOIS cards. Esperado: zero linhas.
select sentry_numeric_id, count(*)
from admin_tasks where sentry_numeric_id is not null
group by sentry_numeric_id having count(*) > 1;
```

A segunda consulta é a que fecha o risco número 1 em produção. Zero linhas.

### No quadro

Abra `/admin?section=tarefas&board=bugs`:

- A etapa **Sentry** cheia, com cadeado, sem "+ Nova tarefa" e sem alça de
  arrastar a coluna.
- Cards com selo **Sentry** e etiqueta **Frontend** ou **Backend**.
- Abrir um card mostra a seção do Sentry com eventos, usuários, environment,
  release e o stack colapsado.
- Arrastar um card para fora da etapa fixada funciona; arrastar **para dentro**
  não.
- Filtro de origem separa Automático de Manual.

### O e-mail

Uma run que criou cards manda **um** e-mail de resumo. Se chegarem vários, ou um
por card, pare e me avise: o agrupamento quebrou.

## O caminho de volta

```sql
update public.admin_task_boards
set sentry_sync_enabled = false
where key = 'BUG';
```

**Isto desliga tudo sem desfazer nada.** Confirmado por desenho e por teste:

- A ingestão para. Nenhum card novo.
- A manutenção para. Nada é reaberto, ressuscitado ou podado.
- **Os cards já criados NÃO somem.** Eles são linhas normais de `admin_tasks`, com
  `source = 'sentry'`; a flag governa o job, não os dados.
- O push de resolução **continua funcionando**: ele mora na rota de movimento e
  é disparado por transição humana, não pelo job.
- O retry de pushes pendentes também continua: ele roda antes da resolução de
  quadro, de propósito, porque uma pendência é decisão humana já tomada.

Religar é o mesmo `update` com `true`, e o job retoma de onde estava. Não há
estado a reconstruir.

Se quiser parar também o retry e o job inteiro, desagende:

```sql
select cron.unschedule(jobid) from cron.job where jobname = 'sync-sentry-tasks';
```

Aí sim nada roda. Os cards continuam lá.

## Se der errado depois

Remover os cards do sync sem tocar nos migrados:

```sql
-- Confira ANTES de apagar.
select count(*) from admin_tasks where source = 'sentry';

delete from admin_tasks where source = 'sentry';
```

`legacy_bug_id` não é tocado por esse `delete`, então os 25 migrados ficam. E
`admin_bugs` continua intacta, com as 25 linhas originais, que é a razão de a
tabela não ter sido dropada (invariante 4).
