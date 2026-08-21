-- Ator de sistema: tarefa criada pelo sync tem autor identificavel que nao e
-- usuario.
--
-- Fase 2 de docs/plano-unificar-bugs-tarefas.md. Isenta da janela de migration
-- destrutiva: RELAXA uma restricao (drop not null nunca falha e nunca perde
-- dado) e acrescenta uma coluna com default.
--
-- ----------------------------------------------------------------------------
-- INVARIANTE 7: o modal tem que mostrar "Sentry", nunca "Alguem".
-- ----------------------------------------------------------------------------
-- created_by e NOT NULL e aponta para auth.users. O sync nao tem usuario, entao
-- ou a coluna aceita nulo, ou o robo vira uma conta de verdade.
--
-- ALTERNATIVA DESCARTADA: criar uma linha em auth.users chamada "Sentry". Custo:
-- uma conta real, que aparece em listagem de usuario, entra em contagem de
-- metrica, pode receber e-mail e pode, em tese, autenticar. Ator de sistema nao
-- e usuario e nao deve virar um so para caber num FK.
--
-- PRECEDENTE NA PROPRIA BASE: admin_task_boards.created_by ja e nullable, com a
-- justificativa escrita na migration que o criou (20260727160000): "o board
-- semeado por esta migration nao tem autor humano". Aqui e a mesma necessidade,
-- agora para o robo em vez do seed.
--
-- POR QUE `source` E NECESSARIO ALEM DO NULO. created_by nulo diz "nao foi
-- humano"; nao diz QUEM foi. A tela precisa da diferenca entre "criado pelo
-- Sentry" e "veio da migracao do admin_bugs", e um dia entre esses dois e um
-- terceiro. Nulo e ausencia de informacao, e derivar identidade de ausencia e
-- como o projeto ja se enganou antes (contarLinhas devolvendo -1: erro de rede
-- virou "protegida"). O valor e afirmado, nao inferido.

begin;

alter table public.admin_tasks
  alter column created_by drop not null;

alter table public.admin_tasks
  -- 'human' como default cobre as 26 linhas existentes com a verdade: todas
  -- foram criadas por gente atras do requireAdmin. Nao ha backfill a fazer, e
  -- por isso esta migration nao altera dado nenhum.
  add column if not exists source text not null default 'human'
    check (source in ('human', 'sentry', 'migrated_bug'));

-- O front resolve `source` por mapa COM FALLBACK NEUTRO (regra de lookup do
-- CLAUDE.md): o bundle no navegador pode ser mais antigo que o backend, e um
-- source que ele nao conhece precisa degradar em vez de derrubar o modal em
-- MAPA[source].label.

commit;
