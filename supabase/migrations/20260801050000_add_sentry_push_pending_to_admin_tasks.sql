-- Retry persistido do push de resolucao, agora em admin_tasks.
--
-- Fase 5.5 de docs/plano-unificar-bugs-tarefas.md. Migration puramente ADITIVA
-- (uma coluna nullable e um indice parcial), isenta da janela.
--
-- ----------------------------------------------------------------------------
-- POR QUE ESTA COLUNA EXISTE, e por que ela nao existia antes.
-- ----------------------------------------------------------------------------
-- O push de resolucao (card em etapa terminal -> issue marcada resolvida no
-- Sentry) sobreviveu a EMENDA 1, que revogou o invariante 6 original. Ate a
-- Fase 5 ele era disparado pelo PATCH de /api/admin/bugs e o retry morava em
-- admin_bugs.sentry_sync_pending.
--
-- A Fase 5 aposentou aquele PATCH (410) e o push ficou DORMENTE: vivo, sem
-- gatilho. Religa-lo na transicao do card exige a mesma coluna do lado de
-- admin_tasks, e a Fase 2 nao a criou porque na epoca o push ainda tinha casa.
--
-- ----------------------------------------------------------------------------
-- O QUE ELA GUARDA: o ALVO, nao um contador.
-- ----------------------------------------------------------------------------
-- 'resolved' ou 'unresolved' e o estado que o Sentry DEVERIA ter. Guardar o alvo
-- (e nao "tentar de novo N vezes") torna o retry idempotente por construcao:
-- reexecutar escreve o mesmo valor, e uma transicao humana posterior
-- simplesmente sobrescreve o alvo. Mesmo desenho de admin_bugs.sentry_sync_pending,
-- que funcionou e sobreviveu intacto a Fase 5.
--
-- Null = nada pendente. E o estado de 99,99% das linhas, e por isso o indice e
-- parcial: a varredura do retry precisa achar as poucas linhas pendentes sem ler
-- a tabela inteira.
--
-- NAO ha coluna de "orfao" como em admin_bugs. Issue apagada no Sentry devolve
-- 404 no PUT, e o codigo LIMPA a pendencia em vez de tentar para sempre: nao ha
-- o que sincronizar com uma issue que nao existe, e um retry eterno seria ruido
-- permanente no log de um job que roda a cada 15 minutos.

begin;

alter table public.admin_tasks
  add column if not exists sentry_sync_pending text check (
    sentry_sync_pending is null
      or sentry_sync_pending in ('resolved', 'unresolved')
  );

create index if not exists admin_tasks_sentry_push_pendente_idx
  on public.admin_tasks (sentry_sync_pending)
  where sentry_sync_pending is not null;

commit;
