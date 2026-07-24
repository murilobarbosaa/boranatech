-- Snapshot do alcance no momento da publicacao, pro denominador EXATO das stats
-- (taxa de leitura). Antes o admin usava o audience-preview de AGORA como
-- denominador, que distorce a taxa conforme a base cresce. Agora gravamos o
-- alcance no publish (manual e cron) e as stats usam esse valor congelado.
--
-- nullable de proposito: as notificacoes ja publicadas antes desta feature nao
-- tem snapshot; a UI cai na estimativa (comportamento legado) quando e null.
-- Para audience='custom' o valor gravado e o recipient_count (ja exato).

alter table public.notifications
  add column audience_snapshot integer;

comment on column public.notifications.audience_snapshot is
  'Alcance calculado no momento da publicacao (denominador exato das stats). null = publicada antes desta feature (usar estimativa).';
