-- Contagens brutas do ranking mensal dos creators (creators, lote 11).
--
-- UMA funcao, UMA consulta: para um intervalo [p_inicio, p_fim), devolve por
-- creator quantas publicacoes confirmadas de cada tipo, quantas vendas e
-- quantos cliques ele teve. Os PONTOS nao sao calculados aqui de proposito: a
-- regra (peso de cada acao) mora em shared/creatorRanking.ts, e mudar um peso
-- e trocar um numero no codigo, sem migration. O banco so conta.
--
-- POR QUE FUNCAO, e nao selects do PostgREST: os agregados do PostgREST estao
-- desligados em producao (medido em 2026-09-14, ver 20260914120100), e somar
-- linhas brutas no servidor cai no cap de linhas que trunca em silencio.
--
-- QUEM E O CREATOR de um evento: `creator_events.affiliate_id` aponta para
-- `affiliates.id`, e `affiliates.user_id` e o creator. `creator_events.user_id`
-- e o COMPRADOR (nulo nos cliques), conferido no schema de producao em
-- 2026-09-20. Publicacao conta no mes em que foi REGISTRADA (`created_at`),
-- nunca no em que o admin confirmou: a confirmacao atrasa e nao pode mover
-- ponto de mes. Venda e clique contam pelo `occurred_at`.
--
-- TETO DE CLIQUES POR DIA, aplicado aqui e nao no TS, porque e por dia CIVIL de
-- Brasilia e o servidor so recebe o total do mes. O dia e o mesmo fuso do
-- resto do painel (`America/Sao_Paulo`, como em creator_events_daily).
--
-- SEGURANCA, igual a creator_events_daily: security definer com search_path
-- pinado, revoke de public/anon/authenticated e execute SO para service_role.
-- Sem o grant explicito o REVOKE de PUBLIC tiraria o execute do proprio
-- service_role, e o painel receberia 42501 na primeira chamada.
--
-- ADITIVA: cria uma funcao. Nao altera nem remove dado; o rollback e um
-- `drop function`. Isenta da janela de migration destrutiva (CLAUDE.md).

create or replace function public.creator_ranking_counts(
  p_inicio timestamptz,
  p_fim timestamptz,
  p_teto_cliques_dia integer
) returns table (
  user_id uuid,
  ig_posts bigint,
  reels bigint,
  stories bigint,
  videos bigint,
  li_posts bigint,
  vendas bigint,
  cliques bigint
)
language sql stable security definer
set search_path to 'pg_catalog', 'public'
as $$
  with pubs as (
    select p.user_id,
      count(*) filter (where p.network = 'instagram' and p.kind = 'post') as ig_posts,
      count(*) filter (where p.kind = 'reel')  as reels,
      count(*) filter (where p.kind = 'story') as stories,
      count(*) filter (where p.kind = 'video') as videos,
      count(*) filter (where p.network = 'linkedin') as li_posts
    from public.creator_posts p
    where p.status = 'confirmado'
      and p.created_at >= p_inicio
      and p.created_at < p_fim
    group by p.user_id
  ),
  vendas as (
    select a.user_id, count(*) as vendas
    from public.creator_events e
    join public.affiliates a on a.id = e.affiliate_id
    where e.event_type = 'sale'
      and e.occurred_at >= p_inicio
      and e.occurred_at < p_fim
    group by a.user_id
  ),
  cliques as (
    select d.user_id, sum(d.n) as cliques
    from (
      select a.user_id, least(count(*), p_teto_cliques_dia) as n
      from public.creator_events e
      join public.affiliates a on a.id = e.affiliate_id
      where e.event_type = 'click'
        and e.occurred_at >= p_inicio
        and e.occurred_at < p_fim
      group by a.user_id, (e.occurred_at at time zone 'America/Sao_Paulo')::date
    ) d
    group by d.user_id
  ),
  ids as (
    select user_id from pubs
    union select user_id from vendas
    union select user_id from cliques
  )
  select i.user_id,
    coalesce(pb.ig_posts, 0), coalesce(pb.reels, 0), coalesce(pb.stories, 0),
    coalesce(pb.videos, 0), coalesce(pb.li_posts, 0),
    coalesce(v.vendas, 0), coalesce(c.cliques, 0)
  from ids i
  left join pubs pb on pb.user_id = i.user_id
  left join vendas v on v.user_id = i.user_id
  left join cliques c on c.user_id = i.user_id
  where i.user_id is not null;
$$;

revoke all on function public.creator_ranking_counts(timestamptz, timestamptz, integer) from public, anon, authenticated;
grant execute on function public.creator_ranking_counts(timestamptz, timestamptz, integer) to service_role;
alter function public.creator_ranking_counts(timestamptz, timestamptz, integer) owner to postgres;

comment on function public.creator_ranking_counts(timestamptz, timestamptz, integer) is
  'Contagens brutas do ranking mensal por creator (lote 11). So o service role chama; os pontos sao calculados no servidor pela regra de shared/creatorRanking.ts.';
