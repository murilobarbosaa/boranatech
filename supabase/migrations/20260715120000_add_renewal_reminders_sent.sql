-- Marcos de lembrete de renovacao ja enviados por assinatura boleto manual, para
-- o cron nao reenviar nem pular. text[] com os codigos ('d30','d15','d7','d1').
--
-- Por que text[] e nao a renewal_reminder_sent_at (timestamptz, migration
-- 20260714160000): aquela guarda UM timestamp e nao distingue QUAL marco ja saiu;
-- se o cron pular um dia ou rodar duas vezes, nao da pra saber onde parou. O array
-- guarda o conjunto de marcos enviados, entao "ja enviei d7?" e um teste de
-- pertinencia ('d7' = ANY(renewal_reminders_sent)) e cada marco sai uma unica vez.
--
-- A coluna antiga NAO e removida aqui (e nova, ninguem depende dela). Fica
-- redundante; remocao/limpeza fica para uma task propria, se decidido.
--
-- Idempotente (add column if not exists); nada destrutivo. Default '{}' (array
-- vazio) para as linhas existentes; NOT NULL para o cron nunca lidar com null.
alter table public.subscriptions
  add column if not exists renewal_reminders_sent text[] not null default '{}';
