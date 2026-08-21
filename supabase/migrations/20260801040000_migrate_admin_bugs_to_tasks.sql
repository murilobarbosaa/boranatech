-- Migra as 25 linhas de admin_bugs para tarefas no quadro BUG.
--
-- Fase 5 de docs/plano-unificar-bugs-tarefas.md. A UNICA fase que remove algo,
-- e mesmo assim esta migration NAO REMOVE NADA: `admin_bugs` fica intacta, com
-- as 25 linhas, e passa a ser somente leitura (invariante 4). Dropar a tabela e
-- card no quadro DEV, nao passo desta fase.
--
-- ----------------------------------------------------------------------------
-- IDEMPOTENCIA POR CONSTRAINT, nunca por `not exists`.
-- ----------------------------------------------------------------------------
-- `legacy_bug_id` tem indice unico (criado em 20260731050000) e o insert usa
-- `on conflict do nothing`. Reaplicar nao duplica. `not exists` teria a mesma
-- janela de corrida que o invariante 3 proibe, e aqui o risco e concreto: se
-- alguem rodar isto duas vezes em abas diferentes do SQL editor, a versao com
-- `not exists` cria 50 cards.
--
-- ----------------------------------------------------------------------------
-- O RISCO NUMERO 1 DESTE PROJETO, e por que ele acaba aqui.
-- ----------------------------------------------------------------------------
-- Seis linhas de admin_bugs tem vinculo com o Sentry. Se o `sentry_numeric_id`
-- delas NAO for carregado para a tarefa, a primeira run do sync nao encontra o
-- card (a coluna fica nula), cria um SEGUNDO card para a mesma issue, e o indice
-- unico nao protege porque unicidade nao alcanca nulo.
--
-- Conferido contra o banco antes de escrever (2026-08-01): as 6 linhas ja tem
-- `sentry_numeric_id` PREENCHIDO em admin_bugs (o backfill do job legado fez o
-- trabalho). Nenhuma orfa. Entao isto e migration SQL pura: NAO precisa buscar
-- id na API do Sentry, e nao vira script.
--
--   NODE-EXPRESS-1 -> 7626973783      NODE-EXPRESS-3 -> 7627623610
--   NODE-EXPRESS-9 -> 7634772772      NODE-EXPRESS-7 -> 7634730125
--   NODE-EXPRESS-2 -> 7627514443      NODE-EXPRESS-8 -> 7634730134
--
-- O bloco de assercao no fim AFIRMA POR CONTAGEM que o vinculo pegou, e levanta
-- excecao na divergencia. Nao basta a ordem das fases estar certa: o vinculo
-- precisa ser provado carregado, nao presumido.
--
-- ----------------------------------------------------------------------------
-- MIGRATION QUE ALTERA DADO? Insere, nao altera nem remove.
-- ----------------------------------------------------------------------------
-- E a unica da serie com volume (25 linhas). Nao toca em admin_bugs, nao apaga
-- nada, e o rollback e `delete from admin_tasks where legacy_bug_id is not
-- null`, que e exatamente o que `legacy_bug_id` existe para permitir. Tecnicamente
-- isenta da janela; recomendada dentro dela mesmo assim, pelo volume.

begin;

-- ---------------------------------------------------------------------------
-- Os alvos, resolvidos por CHAVE e NOME, nunca por uuid escrito a mao
-- ---------------------------------------------------------------------------
-- Uuid literal aqui amarraria a migration a este banco e ela falharia em
-- silencio (zero linhas casadas) em qualquer outro, inclusive num ensaio. O
-- bloco de assercao pega isso: se os alvos nao resolverem, o insert casa zero
-- linhas e a contagem final acusa.

-- Subconsulta escalar por etapa, e nao `max(c.id) filter (...)`: o Postgres nao
-- tem agregado max para uuid, e a primeira versao desta migration morreu com
-- "function max(uuid) does not exist". O `limit 1` e defensivo contra etapa
-- duplicada por nome (nao ha unicidade em admin_task_columns.name, de proposito).
with alvo as (
  select
    b.id as board_id,
    (select c.id from public.admin_task_columns c
      where c.board_id = b.id and c.name = 'Bugs Reportados' limit 1) as col_open,
    (select c.id from public.admin_task_columns c
      where c.board_id = b.id and c.name = 'Em Progresso' limit 1)    as col_progresso,
    (select c.id from public.admin_task_columns c
      where c.board_id = b.id and c.name = 'Concluido' limit 1)       as col_done
  from public.admin_task_boards b
  where b.key = 'BUG'
),
-- Posicao inicial de cada etapa: continua de onde o quadro esta, para os cards
-- migrados nao se intercalarem com o que ja existe.
base as (
  select
    a.*,
    coalesce((select max(t.position) from public.admin_tasks t where t.column_id = a.col_open), 0) as pos_open,
    coalesce((select max(t.position) from public.admin_tasks t where t.column_id = a.col_progresso), 0) as pos_progresso,
    coalesce((select max(t.position) from public.admin_tasks t where t.column_id = a.col_done), 0) as pos_done
  from alvo a
),
origem as (
  select
    g.*,
    -- Ordenado por created_at: o numero do card (BUG-2, BUG-3...) cresce junto
    -- com a idade do bug, que e a leitura que alguem espera de uma numeracao.
    row_number() over (
      partition by g.status
      order by g.created_at, g.id
    ) as ordem
  from public.admin_bugs g
)
insert into public.admin_tasks (
  board_id, column_id, title, description, position, priority, type,
  created_by, updated_by, completed_at, created_at, updated_at,
  source, legacy_bug_id,
  sentry_issue_id, sentry_numeric_id, sentry_issue_url
)
select
  base.board_id,
  case o.status
    when 'open'        then base.col_open
    when 'in_progress' then base.col_progresso
    when 'done'        then base.col_done
  end,
  o.title,
  o.description,
  case o.status
    when 'open'        then base.pos_open
    when 'in_progress' then base.pos_progresso
    when 'done'        then base.pos_done
  end + (o.ordem * 1000),
  -- Bijecao 4 para 4, sem adivinhacao.
  case o.severity
    when 'critical' then 'urgente'
    when 'high'     then 'alta'
    when 'medium'   then 'media'
    when 'low'      then 'baixa'
  end,
  'bug',
  -- AUTORIA PRESERVADA. Bug registrado por gente continua com autor humano.
  o.created_by,
  o.created_by,
  -- completed_at vem do resolved_at: conferido, as 10 concluidas tem o campo
  -- preenchido. Sem ele o fail-safe 1 tornaria esses cards inertes para sempre
  -- (a reabertura precisa de uma base para comparar o lastSeen).
  o.resolved_at,
  o.created_at,
  o.updated_at,
  -- source = 'human' MESMO nas 6 vinculadas ao Sentry. `source` responde "quem
  -- criou", e quem criou foi uma pessoa clicando "criar bug a partir desta
  -- issue". O vinculo com o Sentry e outra coisa, e mora nas colunas
  -- sentry_*: um card pode ser de autoria humana E ter issue vinculada, e a
  -- manutencao do job age sobre o VINCULO, nao sobre a autoria.
  'human',
  o.id,
  o.sentry_issue_id,
  o.sentry_numeric_id,
  o.sentry_issue_url
from origem o
cross join base
-- `where ... is not null` protege contra etapa renomeada: sem ele, um status sem
-- coluna correspondente inseriria column_id nulo e estouraria o NOT NULL com uma
-- mensagem que nao explica nada. A assercao final acusa a falta.
where case o.status
        when 'open'        then base.col_open
        when 'in_progress' then base.col_progresso
        when 'done'        then base.col_done
      end is not null
on conflict (legacy_bug_id) do nothing;

-- ---------------------------------------------------------------------------
-- ASSERCAO: afirma o TOTAL, nao a pertinencia
-- ---------------------------------------------------------------------------
-- Mesmo desenho da migration do is_start (20260731040100), que ja provou o
-- valor. "As que eu migrei estao la" passaria com 3 de 25; "existem exatamente
-- 25, e 6 delas tem vinculo" nao.
do $$
declare
  v_bugs        integer;
  v_migradas    integer;
  v_vinculadas  integer;
  v_com_vinculo_sem_id integer;
  v_sem_autor   integer;
  v_done_sem_conclusao integer;
  v_tipo_errado integer;
begin
  select count(*) into v_bugs from public.admin_bugs;

  select count(*) into v_migradas
  from public.admin_tasks where legacy_bug_id is not null;

  if v_migradas <> v_bugs then
    raise exception
      'migracao incompleta: % linhas em admin_bugs, % tarefas migradas',
      v_bugs, v_migradas;
  end if;

  -- O RISCO NUMERO 1, afirmado por contagem nos DOIS sentidos.
  select count(*) into v_vinculadas
  from public.admin_tasks
  where legacy_bug_id is not null and sentry_numeric_id is not null;

  if v_vinculadas <> (
    select count(*) from public.admin_bugs where sentry_numeric_id is not null
  ) then
    raise exception
      'vinculo do Sentry nao carregou: % tarefas com numeric_id, esperado %',
      v_vinculadas,
      (select count(*) from public.admin_bugs where sentry_numeric_id is not null);
  end if;

  -- Sentido inverso: nenhuma tarefa migrada pode ter shortId sem o numeric id.
  -- Esse e exatamente o estado que faria o sync duplicar o card.
  select count(*) into v_com_vinculo_sem_id
  from public.admin_tasks
  where legacy_bug_id is not null
    and sentry_issue_id is not null
    and sentry_numeric_id is null;

  if v_com_vinculo_sem_id <> 0 then
    raise exception
      '% tarefa(s) migradas tem issue do Sentry SEM id numerico; o sync duplicaria',
      v_com_vinculo_sem_id;
  end if;

  -- Autoria preservada: bug de humano nao pode virar card sem autor.
  select count(*) into v_sem_autor
  from public.admin_tasks where legacy_bug_id is not null and created_by is null;
  if v_sem_autor <> 0 then
    raise exception '% tarefa(s) migradas perderam o autor', v_sem_autor;
  end if;

  -- Concluidas com completed_at: sem ele a reabertura nunca dispara.
  select count(*) into v_done_sem_conclusao
  from public.admin_tasks t
  join public.admin_bugs g on g.id = t.legacy_bug_id
  where g.status = 'done' and t.completed_at is null;
  if v_done_sem_conclusao <> 0 then
    raise exception
      '% tarefa(s) concluidas ficaram sem completed_at e nunca reabririam',
      v_done_sem_conclusao;
  end if;

  -- TIPO, afirmado explicitamente.
  --
  -- Parece redundante (o insert acima escreve 'bug' literal) e nao e: esta
  -- migration DEPENDE de 20260731040000 ter alargado o CHECK de
  -- admin_tasks.type. Sem ela o insert falha por violacao de constraint, com uma
  -- mensagem que fala de CHECK e nao de migracao. Com esta assercao, o dia em
  -- que alguem inserir por outro caminho (ou aceitar um default) tem contagem
  -- afirmando o valor, e nao so o numero de linhas: 25 linhas com o tipo errado
  -- passariam em todas as demais verificacoes.
  select count(*) into v_tipo_errado
  from public.admin_tasks where legacy_bug_id is not null and type <> 'bug';
  if v_tipo_errado <> 0 then
    raise exception
      '% tarefa(s) migradas ficaram com type diferente de bug', v_tipo_errado;
  end if;

  raise notice
    'migradas % tarefas, % com vinculo do Sentry', v_migradas, v_vinculadas;
end $$;

commit;
