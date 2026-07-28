-- Remove 'bug' dos tipos aceitos em admin_tasks.
--
-- Bug tem tela propria (aba Bugs & Erros, tabela admin_bugs). Dois lugares para
-- a mesma coisa e confusao garantida, e o tipo aqui existia so por simetria.
--
-- `type` e CHECK constraint, nao enum do Postgres: da para APERTAR a lista. Se
-- fosse enum, o valor nao sairia (o Postgres nao remove valor de enum) e a
-- unica saida seria tira-lo da interface e da validacao, deixando o valor orfao.
--
-- Conferido antes de escrever: ZERO linhas com type = 'bug' em producao, e ZERO
-- linhas de admin_task_activity referenciando 'bug' em type_changed. Nada a
-- migrar, entao o `alter` nao precisa de update preparatorio e nao pode falhar
-- por dado existente.
--
-- Migration destrutiva? Nao remove nem altera dado: so estreita o dominio
-- aceito daqui para a frente. Como nao ha linha afetada, e ISENTA da janela.
--
-- ATENCAO: o histórico continua podendo dizer "mudou o tipo para bug" em
-- instalacoes que tiverem essas linhas. O payload do log e texto livre e nao
-- passa por este CHECK, e o resolver do front (typeMetaOf) segue reconhecendo
-- 'bug'. Registro historico nao vira buraco porque a opcao saiu do menu.

begin;

alter table public.admin_tasks
  drop constraint if exists admin_tasks_type_check;

alter table public.admin_tasks
  add constraint admin_tasks_type_check
  check (type in ('feature', 'melhoria', 'debito_tecnico', 'tarefa'));

commit;
