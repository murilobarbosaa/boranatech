-- Cobertura de faculdades de tecnologia a partir do INEP/MEC - Censo da
-- Educacao Superior 2024 (microdados publicos, CINE area geral 06 =
-- "Computacao e Tecnologias da Informacao e Comunicacao (TIC)").
--
-- Camada de COBERTURA: complementa, NAO substitui, a curadoria editorial
-- estatica em client/src/lib/faculdadesInstituicoes.ts (que tem reputacao,
-- url e duracao, trabalho editorial que o Censo nao possui). O Censo entra
-- como base ampla; a curadoria continua como camada de destaque por cima.
--
-- Conteudo publico e gratuito: SELECT liberado para anon e authenticated.
-- Escrita EXCLUSIVA do service_role (ingestao via
-- scripts/ingestFaculdadesCenso.mts), que bypassa a RLS. Fail-closed: anon e
-- authenticated tem apenas SELECT via GRANT explicito, e nao ha policy de
-- write, entao a RLS bloqueia qualquer escrita nao-service_role.
--
-- Fase 1: sem conceito do MEC (CPC/CC/IGC/ENADE, base separada) e sem
-- agregacao de matriculas por polo (TP_DIMENSAO=2). Cursos filtrados por
-- CO_CINE_AREA_GERAL='06' AND TP_DIMENSAO IN ('1','3').
--
-- Fonte: INEP/MEC - Censo da Educacao Superior 2024.

create extension if not exists pg_trgm;

create table if not exists public.faculdades_ies (
  co_ies integer primary key,
  no_ies text not null,
  sg_ies text,
  no_mantenedora text,
  sg_uf text not null,
  no_municipio text,
  co_municipio integer,
  tp_organizacao_academica smallint,
  no_organizacao_academica text,
  tp_categoria_administrativa smallint,
  no_categoria_administrativa text,
  tp_rede smallint,
  no_rede text,
  ano_censo integer not null default 2024,
  created_at timestamptz not null default now()
);

create table if not exists public.faculdades_cursos (
  co_curso integer primary key,
  co_ies integer not null references public.faculdades_ies (co_ies) on delete restrict,
  no_curso text not null,
  no_curso_raw text not null,
  co_cine_rotulo text,
  no_cine_rotulo text,
  co_cine_area_detalhada text,
  subarea text not null check (
    subarea in (
      'Desenvolvimento',
      'Dados e IA',
      'Infra e Redes',
      'Segurança',
      'Gestão e Produto',
      'Jogos',
      'QA',
      'Outros'
    )
  ),
  tp_grau_academico smallint,
  no_grau_academico text,
  tp_modalidade_ensino smallint,
  no_modalidade_ensino text,
  -- EAD (TP_DIMENSAO=3) e nivel-Brasil e nao tem UF; presencial sempre tem.
  -- Na UI o filtro por estado usa presencial; EAD entra pelo bucket nacional
  -- via modalidade. Por isso sg_uf e nullable aqui (nao em faculdades_ies).
  sg_uf text,
  no_municipio text,
  qt_vg_total integer,
  ano_censo integer not null default 2024,
  created_at timestamptz not null default now()
);

create index if not exists faculdades_ies_sg_uf_idx
  on public.faculdades_ies (sg_uf);

create index if not exists faculdades_cursos_sg_uf_idx
  on public.faculdades_cursos (sg_uf);

create index if not exists faculdades_cursos_co_ies_idx
  on public.faculdades_cursos (co_ies);

create index if not exists faculdades_cursos_cine_detalhada_idx
  on public.faculdades_cursos (co_cine_area_detalhada);

create index if not exists faculdades_cursos_grau_idx
  on public.faculdades_cursos (tp_grau_academico);

create index if not exists faculdades_cursos_modalidade_idx
  on public.faculdades_cursos (tp_modalidade_ensino);

create index if not exists faculdades_ies_no_ies_trgm_idx
  on public.faculdades_ies using gin (no_ies gin_trgm_ops);

create index if not exists faculdades_cursos_no_curso_trgm_idx
  on public.faculdades_cursos using gin (no_curso gin_trgm_ops);

alter table public.faculdades_ies enable row level security;
alter table public.faculdades_cursos enable row level security;

-- Leitura publica (descoberta e gratuita).
create policy "faculdades_ies_public_read" on public.faculdades_ies
  for select to anon, authenticated using (true);

create policy "faculdades_cursos_public_read" on public.faculdades_cursos
  for select to anon, authenticated using (true);

-- Fail-closed: anon e authenticated recebem SOMENTE select; nenhuma escrita.
-- service_role mantem seus proprios grants e bypassa a RLS.
revoke all on public.faculdades_ies from anon, authenticated;
revoke all on public.faculdades_cursos from anon, authenticated;
grant select on public.faculdades_ies to anon, authenticated;
grant select on public.faculdades_cursos to anon, authenticated;

comment on table public.faculdades_ies is
  'IES com curso de tecnologia (CINE 06). Fonte: INEP/MEC Censo da Educacao Superior 2024.';
comment on table public.faculdades_cursos is
  'Cursos de tecnologia (CINE 06, TP_DIMENSAO 1 e 3). Fonte: INEP/MEC Censo da Educacao Superior 2024.';
