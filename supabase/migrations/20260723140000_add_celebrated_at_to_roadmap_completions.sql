-- celebrated_at: marca que a celebracao (confete do card dourado de conclusao)
-- ja foi exibida para esta conclusao, pra o confete disparar SO na primeira vez
-- e cross-device. Escrita exclusiva do service role, como o resto da tabela.
--
-- Nullable e SEM default de proposito: linha nova nasce NULL (ainda nao
-- celebrada) e celebra na primeira visualizacao do card dourado. Um default
-- (ex.: now()) marcaria conclusoes novas como ja celebradas e mataria a feature.
--
-- Backfill retrocompat: toda conclusao PRE-EXISTENTE recebe celebrated_at =
-- completed_at, marcando-a como ja celebrada. Sem isso, quem concluiu antes da
-- coluna existir veria o confete disparar na proxima visita. Conclusoes novas
-- (inseridas depois desta migration) nascem NULL e celebram normalmente.
-- Idempotente.

BEGIN;

ALTER TABLE public.roadmap_completions
  ADD COLUMN IF NOT EXISTS celebrated_at timestamptz;

UPDATE public.roadmap_completions
  SET celebrated_at = completed_at
  WHERE celebrated_at IS NULL;

COMMIT;
