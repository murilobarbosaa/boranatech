-- Proveniencia do arquivamento: quem arquivou, o job ou uma pessoa.
--
-- Fase 2 de docs/plano-unificar-bugs-tarefas.md. Aditiva (coluna nova, funcao
-- nova, trigger novo, constraint sobre coluna recem-criada). Isenta da janela de
-- migration destrutiva. Conferido antes de escrever: ZERO tarefas arquivadas em
-- producao hoje (26 linhas, todas com archived_at nulo), entao a constraint nao
-- tem como falhar por dado existente e nao ha backfill.
--
-- ----------------------------------------------------------------------------
-- POR QUE ESTA COLUNA EXISTE: a regra de ressurreicao precisa dela.
-- ----------------------------------------------------------------------------
-- A poda por silencio arquiva card nao triado sem evento ha 21 dias. A
-- ressurreicao desarquiva quando o erro volta (lastSeen > archived_at). As duas
-- juntas fecham um ciclo, mas so se o job souber QUEM arquivou:
--
--   arquivado pelo JOB     -> ressuscitar quando o erro voltar (e a fila);
--   arquivado por PESSOA   -> NAO ressuscitar. Foi decisao de silenciar.
--
-- Sem a distincao, arquivar um card do Sentry a mao nao silencia nada: o card
-- volta na proxima recorrencia, toda vez, e nao existe forma de dizer "esse erro
-- e ruido aceitavel" a nao ser conferindo a fila de novo para sempre.
--
-- SEMANTICA RESULTANTE, e ela e boa: arquivar um card do Sentry a mao E
-- silenciar aquele erro. Desarquivar a mao devolve ele para o ciclo.
--
-- ----------------------------------------------------------------------------
-- POR QUE COLUNA PROPRIA, e nao reuso de `source`.
-- ----------------------------------------------------------------------------
-- `source` responde "quem CRIOU este card". `archived_source` responde "quem
-- ARQUIVOU". Sao eventos diferentes, em momentos diferentes, e o caso que
-- importa e justamente aquele em que as respostas DIVERGEM: card criado pelo
-- sync (source='sentry') e arquivado por uma pessoa que decidiu silenciar
-- (archived_source='human'). Reusar `source` colapsaria as duas perguntas numa
-- so e apagaria exatamente a informacao que motivou a coluna.
--
-- ----------------------------------------------------------------------------
-- POR QUE UM TRIGGER, e nao "a rota preenche".
-- ----------------------------------------------------------------------------
-- Regra do CLAUDE.md: protecao DENTRO da funcao, nunca no call site. Guarda
-- escrita no chamador precisa ser repetida em cada chamador e some no primeiro
-- que alguem esquecer; foi assim com setScoreDelta (2 call sites, um ficou sem).
-- Aqui os escritores sao a rota PATCH de hoje, o job de amanha, e o SQL editor
-- sempre. O trigger cobre os tres por construcao.
--
-- E ele tambem resolve a ORDEM DE DEPLOY. A constraint abaixo exige que
-- archived_at e archived_source andem juntos, e o codigo EM PRODUCAO hoje
-- arquiva setando so archived_at. Sem o trigger, aplicar esta migration
-- quebraria o arquivamento na hora, que e exatamente o modo de falha que a regra
-- "codigo antes da migration" existe para evitar. Com ele, o codigo antigo
-- continua funcionando e o valor gravado e o CERTO: quem nao e o job e humano.

begin;

alter table public.admin_tasks
  add column if not exists archived_source text check (
    archived_source is null or archived_source in ('human', 'sentry_sync')
  );

-- Mantem archived_at e archived_source coerentes, sem depender de quem escreve.
--   arquivando sem dizer quem  -> 'human' (o job SEMPRE se declara);
--   desarquivando              -> limpa, porque a proveniencia morreu com o
--                                 arquivamento. Rearquivar depois grava de novo,
--                                 e se foi a mao vira 'human', que e a leitura
--                                 certa: a pessoa tomou posse da decisao.
create or replace function public.set_admin_task_archive_source()
  returns trigger
  language plpgsql
  set search_path = public
as $$
begin
  if new.archived_at is null then
    new.archived_source := null;
  elsif new.archived_source is null then
    new.archived_source := 'human';
  end if;
  return new;
end;
$$;

drop trigger if exists admin_tasks_set_archive_source on public.admin_tasks;
create trigger admin_tasks_set_archive_source
  before insert or update on public.admin_tasks
  for each row execute function public.set_admin_task_archive_source();

revoke all on function public.set_admin_task_archive_source()
  from public, anon, authenticated;

-- Afirma o invariante, mesmo com o trigger tornando-o inalcancavel. Nao e
-- redundancia: o trigger IMPOE, a constraint DECLARA. Se alguem desabilitar o
-- trigger (`alter table ... disable trigger`), a constraint continua de pe. E a
-- mesma postura de RLS mais REVOKE que este projeto ja adotou: duas camadas com
-- mecanismos diferentes, explicitas as duas.
alter table public.admin_tasks
  drop constraint if exists admin_tasks_archived_source_ck;
alter table public.admin_tasks
  add constraint admin_tasks_archived_source_ck
  check ((archived_at is null) = (archived_source is null));

-- Varredura da ressurreicao: o UNICO lugar do modulo que le cards ARQUIVADOS.
-- Indice parcial sobre exatamente essa populacao (arquivados pelo job e ainda
-- vinculados), para o scan nao virar leitura da tabela inteira.
create index if not exists admin_tasks_sync_archived_idx
  on public.admin_tasks (archived_at)
  where archived_source = 'sentry_sync' and sentry_numeric_id is not null;

commit;
