-- Busca de faculdades ACCENT-INSENSITIVE (Censo INEP 2024).
--
-- Problema: ilike/trigram sao case-insensitive mas accent-SENSITIVE, entao
-- "estacio" nao casava "ESTÁCIO" e "ciencia" nao casava "Ciência". Ninguem
-- digita acento em caixa de busca.
--
-- Solucao: comparar a versao unaccent+lower do termo contra a versao
-- unaccent+lower das colunas, com indices trigram FUNCIONAIS sobre essa
-- expressao.
--
-- PEGADINHA CLASSICA: unaccent() do modulo e apenas STABLE (a forma de 1
-- argumento resolve o dicionario pelo search_path em tempo de execucao), e
-- Postgres NAO aceita funcao nao-IMMUTABLE em indice. A saida conhecida e um
-- wrapper IMMUTABLE que fixa o dicionario explicitamente (forma de 2
-- argumentos). So esse wrapper pode ir no indice.
--
-- O filtro por funcao (immutable_unaccent(lower(col))) nao e expressavel pelo
-- PostgREST, e ordenar por similarity() tambem nao. Por isso a busca textual
-- passa pela funcao buscar_faculdades_cursos (RPC) definida aqui, que usa os
-- indices funcionais e ordena por relevancia. A rota sem q continua no
-- PostgREST.
--
-- RLS das tabelas nao muda. Fonte: INEP/MEC Censo da Educacao Superior 2024.

create extension if not exists unaccent;

-- Wrapper IMMUTABLE: fixa o dicionario 'unaccent' (2 args) e o search_path,
-- para resolver o dicionario e a funcao unaccent onde quer que a extensao
-- tenha sido instalada (public no vanilla, extensions no Supabase).
create or replace function public.immutable_unaccent(text)
returns text
language sql
immutable
parallel safe
strict
set search_path = public, extensions, pg_catalog
as $func$
  select unaccent('unaccent', $1);
$func$;

-- Substitui (nao mantem) os indices trigram sobre a coluna crua: a busca nunca
-- mais consulta a coluna crua, entao os antigos ficariam mortos (custo de
-- escrita, zero uso).
drop index if exists public.faculdades_cursos_no_curso_trgm_idx;
drop index if exists public.faculdades_ies_no_ies_trgm_idx;

create index if not exists faculdades_cursos_no_curso_unaccent_trgm_idx
  on public.faculdades_cursos
  using gin (public.immutable_unaccent(lower(no_curso)) gin_trgm_ops);

create index if not exists faculdades_ies_no_ies_unaccent_trgm_idx
  on public.faculdades_ies
  using gin (public.immutable_unaccent(lower(no_ies)) gin_trgm_ops);

-- Busca textual paginada. p_termo casa nome de curso OU nome de instituicao,
-- ambos comparados sem acento. Ordena por relevancia (maior similarity entre
-- curso e IES) com desempate deterministico (qt_vg_total desc, no_curso asc)
-- para paginacao estavel. total_count (janela) vai em toda linha para a rota
-- ler o total sem segunda query.
--
-- Regra de UF x EAD identica a do caminho sem q em server/routes/faculdades.ts:
--   modalidade=2 (ead): so EAD, ignora uf.
--   modalidade=1 (presencial): so presenciais (+ uf se veio).
--   uf sem modalidade: presenciais da UF E os EAD (nacionais).
create or replace function public.buscar_faculdades_cursos(
  p_termo text,
  p_uf text default null,
  p_modalidade integer default null,
  p_grau integer default null,
  p_subarea text default null,
  p_rede integer default null,
  p_limit integer default 20,
  p_offset integer default 0
)
returns table (
  co_curso integer,
  co_ies integer,
  no_curso text,
  no_curso_raw text,
  no_cine_rotulo text,
  co_cine_area_detalhada text,
  subarea text,
  tp_grau_academico smallint,
  no_grau_academico text,
  tp_modalidade_ensino smallint,
  no_modalidade_ensino text,
  sg_uf text,
  no_municipio text,
  qt_vg_total integer,
  ies_no_ies text,
  ies_sg_ies text,
  ies_tp_organizacao_academica smallint,
  ies_no_organizacao_academica text,
  ies_no_rede text,
  total_count bigint
)
language sql
stable
set search_path = public, extensions, pg_catalog
as $func$
  with termo as (
    select public.immutable_unaccent(lower(p_termo)) as t
  )
  select
    c.co_curso,
    c.co_ies,
    c.no_curso,
    c.no_curso_raw,
    c.no_cine_rotulo,
    c.co_cine_area_detalhada,
    c.subarea,
    c.tp_grau_academico,
    c.no_grau_academico,
    c.tp_modalidade_ensino,
    c.no_modalidade_ensino,
    c.sg_uf,
    c.no_municipio,
    c.qt_vg_total,
    i.no_ies,
    i.sg_ies,
    i.tp_organizacao_academica,
    i.no_organizacao_academica,
    i.no_rede,
    count(*) over () as total_count
  from public.faculdades_cursos c
  join public.faculdades_ies i on i.co_ies = c.co_ies
  cross join termo
  where
    (
      public.immutable_unaccent(lower(c.no_curso)) like '%' || termo.t || '%'
      or c.co_ies in (
        select ii.co_ies
        from public.faculdades_ies ii
        where public.immutable_unaccent(lower(ii.no_ies)) like '%' || termo.t || '%'
      )
    )
    and (
      case
        when p_modalidade = 2 then c.tp_modalidade_ensino = 2
        when p_modalidade = 1 then
          c.tp_modalidade_ensino = 1 and (p_uf is null or c.sg_uf = p_uf)
        when p_uf is not null then
          (c.sg_uf = p_uf or c.tp_modalidade_ensino = 2)
        else true
      end
    )
    and (p_grau is null or c.tp_grau_academico = p_grau)
    and (p_subarea is null or c.subarea = p_subarea)
    and (p_rede is null or i.tp_rede = p_rede)
  order by
    greatest(
      similarity(public.immutable_unaccent(lower(c.no_curso)), termo.t),
      similarity(public.immutable_unaccent(lower(i.no_ies)), termo.t)
    ) desc,
    c.qt_vg_total desc nulls last,
    c.no_curso asc,
    c.co_curso asc
  limit p_limit
  offset p_offset;
$func$;

-- Leitura publica: a rota chama via service_role, mas anon/authenticated podem
-- executar (a funcao e security invoker e as tabelas ja liberam SELECT via RLS).
revoke all on function public.buscar_faculdades_cursos(
  text, text, integer, integer, text, integer, integer, integer
) from public;
grant execute on function public.buscar_faculdades_cursos(
  text, text, integer, integer, text, integer, integer, integer
) to anon, authenticated, service_role;
