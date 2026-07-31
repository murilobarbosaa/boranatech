-- Devolve 'bug' aos tipos aceitos em admin_tasks.
--
-- Desfaz 20260728120100_drop_bug_from_admin_task_type.sql. Aquela migration
-- tirou o tipo com a justificativa "bug tem tela propria (aba Bugs & Erros)".
-- A premissa deixou de valer: a aba vai ser aposentada e os bugs passam a viver
-- no quadro BUG do modulo de Tarefas. Fase 1 do projeto descrito em
-- docs/plano-unificar-bugs-tarefas.md.
--
-- ALARGA o dominio aceito, nao aperta. Nao existe linha que possa violar um
-- CHECK mais permissivo que o anterior, entao esta migration NAO PODE FALHAR por
-- dado existente, e nao ha update preparatorio.
--
-- Migration ISENTA da janela de migration destrutiva: nao remove nem altera
-- dado. O rollback e reaplicar o CHECK estreito de 20260728120100, e ele so
-- falharia se ja existisse linha com type = 'bug' (que e justamente o dado que
-- este projeto vai criar; a partir da Fase 5 o rollback deixa de ser trivial, e
-- isso esta registrado aqui de proposito).
--
-- O front NAO precisa subir antes: typeMetaOf ja resolvia 'bug' pelo mapa
-- TYPE_META_HISTORICO desde a remocao, exatamente para registro historico nao
-- virar buraco. Um bundle antigo desenha o cartao com o rotulo certo; o que ele
-- nao tem e a opcao no menu.

begin;

alter table public.admin_tasks
  drop constraint if exists admin_tasks_type_check;

alter table public.admin_tasks
  add constraint admin_tasks_type_check
  check (type in ('feature', 'bug', 'melhoria', 'debito_tecnico', 'tarefa'));

commit;
