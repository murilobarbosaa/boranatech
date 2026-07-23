-- Sincronizacao bidirecional do bug tracker com o Sentry (aba Bugs & Erros).
-- Ate aqui o vinculo com o Sentry era so referencia (sentry_issue_id = shortId,
-- sentry_issue_url = permalink), sem escrita. Estas colunas sustentam:
--   1. escrita de status no Sentry nas transicoes do card (done -> resolved);
--   2. o job periodico reconcile-sentry-bugs (reabrir card quando volta a
--      acontecer, marcar verificado, backfill do id numerico, retry de sync).
-- Todas NULLABLE e aditivas: cards legados (sem numeric id) convivem e o backfill
-- do job preenche sob demanda.

-- groupId numerico da issue no Sentry (issue.id). shortId (sentry_issue_id) nao
-- serve para as rotas de escrita/leitura por id; resolvido via
-- GET /organizations/{org}/shortids/{short_id}/ e cacheado aqui. Preenchido na
-- criacao a partir de uma issue (issue.id ja vem no payload) ou pelo backfill do
-- job para cards legados.
alter table public.admin_bugs
  add column if not exists sentry_numeric_id text check (
    sentry_numeric_id is null or char_length(sentry_numeric_id) between 1 and 100
  );

-- Sincronizacao de status pendente de retry pelo job: setada quando a escrita no
-- Sentry na transicao do card (PATCH) falha. Guarda o status ALVO a reescrever,
-- para o job repetir de forma idempotente. Null = sem pendencia.
alter table public.admin_bugs
  add column if not exists sentry_sync_pending text check (
    sentry_sync_pending is null
      or sentry_sync_pending in ('resolved', 'unresolved')
  );

-- lastSeen do evento que disparou a reabertura automatica (o "motivo"): quando o
-- job detecta lastSeen > resolved_at, move o card para "Em correcao" e grava aqui
-- a data do evento novo. Null se o card nunca foi reaberto pelo job.
alter table public.admin_bugs
  add column if not exists sentry_reopen_event_at timestamptz;

-- Ultima verificacao do card contra o Sentry pelo job (base do selo
-- "verificado - sem eventos ha Xd"). Atualizada em toda checagem, com ou sem
-- evento novo.
alter table public.admin_bugs
  add column if not exists sentry_last_checked_at timestamptz;

-- Marcado quando o shortId nao resolve mais (issue deletada no Sentry): o card
-- vira orfao, sai da reconciliacao e a UI sinaliza a divergencia. Nunca falha o
-- job. Acao destrutiva nenhuma: o card permanece, so deixa de sincronizar.
alter table public.admin_bugs
  add column if not exists sentry_orphaned_at timestamptz;

-- Indice parcial para o job: varre so os cards vinculados ao Sentry e ainda
-- sincronizaveis (tem id curto, nao orfaos). Pequeno; a tabela e o tracker
-- interno do admin.
create index if not exists admin_bugs_sentry_linked_idx
  on public.admin_bugs (status)
  where sentry_issue_id is not null and sentry_orphaned_at is null;
