-- Vagas multi-fonte + destaque (front VAGAS, fase 2).
--
-- APLICACAO MANUAL PENDENTE: file-only, NAO aplicada via db push. Aplicar no
-- SQL Editor e carimbar com supabase migration repair junto do lote.
--
-- Colunas 100% aditivas e nulas (banco compartilhado com producao). A tabela
-- ja tinha external_id, source, description, employment_type e tags do schema
-- original; os ADD IF NOT EXISTS abaixo cobrem o delta real e documentam o
-- shape completo esperado pelo pipeline novo. employment_type e tags legadas
-- ficam sem uso (o pipeline novo escreve contract_type e labels; consolidar
-- em migration futura de limpeza se valer a pena).
--
-- featured/featured_until/created_by: vagas destaque criadas manualmente pelo
-- admin (source='manual'). created_by e auditoria SEM foreign key de
-- proposito (admin deletado nao pode quebrar a vaga).
--
-- Indices:
--   - (is_published, published_at desc): a query principal do feed
--     (published=true ordenado por data) para de depender do indice solto de
--     published_at.
--   - country: filtro de regiao br/intl do endpoint.
--   - parcial de featured: destaques sao pouquissimas linhas; indice parcial
--     custa quase nada e cobre o endpoint de destaques.
--   - seniority e area_slug ja existem do schema original; contract_type,
--     modality e source ficam SEM indice por enquanto (cardinalidade baixa e
--     volume pequeno; adicionar quando houver evidencia de necessidade).

alter table public.external_jobs
  add column if not exists external_id text,
  add column if not exists source text,
  add column if not exists description text,
  add column if not exists country text,
  add column if not exists salary_min numeric,
  add column if not exists salary_max numeric,
  add column if not exists salary_currency text,
  add column if not exists salary_is_predicted boolean,
  add column if not exists contract_type text,
  add column if not exists modality text,
  add column if not exists labels jsonb,
  add column if not exists last_seen_at timestamptz,
  add column if not exists featured boolean not null default false,
  add column if not exists featured_until timestamptz,
  add column if not exists created_by uuid;

-- Backfill leve das linhas pre-existentes (todas eram Jooble Brasil). source
-- ja e NOT NULL no schema original, entao o where cobre apenas o caso de a
-- coluna ter acabado de ser criada em um banco divergente.
update public.external_jobs set country = 'br' where country is null;
update public.external_jobs set source = 'jooble' where source is null;
update public.external_jobs set last_seen_at = now() where last_seen_at is null;

create index if not exists external_jobs_published_published_at_idx
  on public.external_jobs (is_published, published_at desc);

create index if not exists external_jobs_country_idx
  on public.external_jobs (country);

create index if not exists external_jobs_featured_idx
  on public.external_jobs (published_at desc)
  where featured;
