-- Migra study_entries.studied_at de `date` para `timestamptz`.
--
-- CONTEXTO: studied_at era do tipo `date`, mas as RPCs get_study_heatmap e
-- get_study_stats usam `AT TIME ZONE 'America/Sao_Paulo'`. Em coluna `date`,
-- o Postgres trata o valor como meia-noite UTC, o que após conversão pra SP
-- resulta no dia anterior. Heatmap pinta dia errado.
--
-- BACKFILL: para cada row existente, define studied_at como meio-dia (12:00)
-- em America/Sao_Paulo do mesmo dia. 12h SP = 15h UTC — longe das fronteiras
-- de dia em qualquer timezone razoável, sem ambiguidade de DST.

alter table public.study_entries
  alter column studied_at type timestamptz
  using ((studied_at + interval '12 hours')::timestamp at time zone 'America/Sao_Paulo');

alter table public.study_entries
  alter column studied_at set default now();
