-- Adiciona colunas pra enriquecimento via IA das notícias
-- - title_pt_br / summary_pt_br: tradução automática
-- - level: nível de leitura (iniciante/intermediario/avancado)
-- - why_it_matters: contextualização gerada por IA
-- - enriched_at: timestamp de quando IA enriqueceu (NULL = pendente)

ALTER TABLE public.news
  ADD COLUMN title_pt_br    TEXT,
  ADD COLUMN summary_pt_br  TEXT,
  ADD COLUMN level          TEXT,
  ADD COLUMN why_it_matters TEXT,
  ADD COLUMN enriched_at    TIMESTAMPTZ;

-- Constraint: level só aceita valores válidos OU NULL
ALTER TABLE public.news
  ADD CONSTRAINT news_level_check
  CHECK (level IN ('iniciante', 'intermediario', 'avancado') OR level IS NULL);

-- Index parcial pra busca eficiente de pendentes de enriquecimento
CREATE INDEX idx_news_enrichment_pending
  ON public.news (created_at DESC)
  WHERE enriched_at IS NULL;
