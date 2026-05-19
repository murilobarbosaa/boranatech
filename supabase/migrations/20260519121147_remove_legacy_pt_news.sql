-- Remove notícias PT-PT antigas (Currents language=pt antes do refactor).
-- Plataforma agora busca language=en com enrichment para PT-BR via IA.
-- Estas rows não têm enrichment e estão em português europeu —
-- não fazem sentido no produto brasileiro.
--
-- Critério: criadas antes do switch para EN (2026-05-19 00:00 UTC)
-- E ainda sem enrichment. Cobre 104 rows de fontes PT
-- (TugaTech, Lusa, Correio da Manhã, Expresso, etc).

DELETE FROM public.news
WHERE created_at < '2026-05-19 00:00:00+00'
  AND enriched_at IS NULL;
