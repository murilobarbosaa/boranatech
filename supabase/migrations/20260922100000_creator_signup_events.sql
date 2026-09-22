-- Cadastro pelo link vale ponto (creators, lote 11i).
--
-- Ate aqui `creator_events.event_type` aceitava click, checkout e sale, e
-- nada ligava a conta nova ao codigo que estava guardado no navegador de quem
-- se cadastrou. Este arquivo faz tres coisas, todas aditivas:
--
-- 1. A CHECK de `event_type` ganha 'signup'. O nome da constraint e o que o
--    Postgres deu a CHECK inline (`creator_events_event_type_check`),
--    conferido em producao pelo pg_constraint.
-- 2. Um cadastro POR CONTA, para sempre: indice unico parcial em `user_id`
--    onde `event_type = 'signup'`. E ele que torna a insercao idempotente (o
--    client pode chamar de novo; o servidor trata o 23505 como "ja existia") e
--    que impede dois codigos de dividirem a mesma conta.
-- 3. `creator_ranking_counts` ganha a coluna `cadastros`. RETURNS TABLE mudou,
--    entao e DROP e CREATE, nao REPLACE; os GRANTs sao refeitos porque nao
--    sobrevivem ao DROP. `check:migrations --declared` continua em 41
--    funcoes (a mesma sai e entra), e a assercao comportamental do guard
--    (intervalo vazio devolve zero linhas) continua valendo.
--
-- `creator_events_daily` agrupa por `event_type` sem lista fixa, entao o tipo
-- novo flui por ela sem mudanca; e o servidor (acumular) que precisa
-- conhece-lo, e conhece desde o mesmo lote.
--
-- Rollback: a CHECK de volta a tres valores (so enquanto nao houver linha
-- 'signup'), DROP INDEX, e a funcao de volta a versao da 20260921100000.
-- Isenta da janela de migration destrutiva: nao altera nem remove dado.

BEGIN;

ALTER TABLE public.creator_events DROP CONSTRAINT creator_events_event_type_check;
ALTER TABLE public.creator_events ADD CONSTRAINT creator_events_event_type_check
  CHECK (event_type IN ('click', 'checkout', 'sale', 'signup'));

CREATE UNIQUE INDEX creator_events_signup_unico_por_usuario
  ON public.creator_events (user_id)
  WHERE event_type = 'signup';

DROP FUNCTION public.creator_ranking_counts(timestamptz, timestamptz, integer);

CREATE FUNCTION public.creator_ranking_counts(
  p_inicio timestamptz,
  p_fim timestamptz,
  p_teto_cliques_dia integer
) RETURNS TABLE (
  user_id uuid,
  ig_posts bigint,
  reels bigint,
  stories bigint,
  videos bigint,
  li_posts bigint,
  vendas bigint,
  cliques bigint,
  cadastros bigint
)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path TO 'pg_catalog', 'public'
AS $$
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
  cadastros as (
    select a.user_id, count(*) as cadastros
    from public.creator_events e
    join public.affiliates a on a.id = e.affiliate_id
    where e.event_type = 'signup'
      and e.occurred_at >= p_inicio
      and e.occurred_at < p_fim
    group by a.user_id
  ),
  ids as (
    select user_id from pubs
    union select user_id from vendas
    union select user_id from cliques
    union select user_id from cadastros
  )
  select i.user_id,
    coalesce(pb.ig_posts, 0), coalesce(pb.reels, 0), coalesce(pb.stories, 0),
    coalesce(pb.videos, 0), coalesce(pb.li_posts, 0),
    coalesce(v.vendas, 0), coalesce(c.cliques, 0), coalesce(cd.cadastros, 0)
  from ids i
  left join pubs pb on pb.user_id = i.user_id
  left join vendas v on v.user_id = i.user_id
  left join cliques c on c.user_id = i.user_id
  left join cadastros cd on cd.user_id = i.user_id
  where i.user_id is not null;
$$;

REVOKE ALL ON FUNCTION public.creator_ranking_counts(timestamptz, timestamptz, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.creator_ranking_counts(timestamptz, timestamptz, integer) TO service_role;
ALTER FUNCTION public.creator_ranking_counts(timestamptz, timestamptz, integer) OWNER TO postgres;

COMMENT ON FUNCTION public.creator_ranking_counts(timestamptz, timestamptz, integer) IS
  'Contagens brutas do ranking mensal por creator (lote 11, cadastros no 11i). So o service role chama; os pontos sao calculados no servidor pela regra de shared/creatorRanking.ts.';

COMMIT;
