-- subscription_snapshots: um retrato DIARIO do estado das assinaturas, para
-- viabilizar no futuro tendencia (badges da Visao), cohorts de retencao e
-- evolucao de MRR. Hoje isso e impossivel porque subscriptions guarda SO o
-- estado atual (sem historico). Cada linha e o estado observado ao vivo pelo
-- cron num dia; nao ha reconstrucao estimada nesta frente (por isso nao existe
-- coluna is_estimated: nada e estimado).
--
-- DIVERGENCIA INTENCIONAL (documentada para nao confundir daqui a seis meses):
-- active_count / trialing_count / mrr_cents / by_plan seguem a definicao do
-- painel (getMrrSnapshot em server/lib/billingMetrics.ts): status='active' com
-- current_period_end nulo ou > now (exclui periodo expirado); trialing NAO entra
-- no MRR, so no contador. Ja by_status e um tally CRU de status sobre TODAS as
-- linhas (sem filtro de periodo). Logo by_status['active'] pode ser >= que
-- active_count. Sao definicoes diferentes de proposito: uma e "ativos que pagam
-- MRR agora", a outra e "a distribuicao crua da coluna status".
--
-- Escrita apenas pelo backend (service_role, que ignora RLS). RLS habilitada sem
-- policy = nega anon/authenticated via Data API.

begin;

create table if not exists public.subscription_snapshots (
  id uuid primary key default gen_random_uuid(),
  -- Um snapshot por dia (UTC). O unique e o que garante idempotencia: o cron
  -- roda por upsert em snapshot_date, entao rodar duas vezes no mesmo dia
  -- atualiza a mesma linha, nunca duplica.
  snapshot_date date not null unique,
  active_count int not null,
  trialing_count int not null,
  past_due_count int not null,
  canceled_count int not null,
  mrr_cents bigint not null,
  -- { "pro_monthly": { "count": N, "mrr_cents": N }, ... } (definicao do painel).
  by_plan jsonb not null,
  -- { "active": N, "past_due": N, ... } tally cru da coluna status (qualquer
  -- valor: active, canceled, trialing, past_due, incomplete, incomplete_expired,
  -- unpaid, paused).
  by_status jsonb not null,
  created_at timestamptz default now()
);

create index if not exists subscription_snapshots_snapshot_date_idx
  on public.subscription_snapshots (snapshot_date);

alter table public.subscription_snapshots enable row level security;

commit;
