-- Leituras agregadas do painel de creators, TODAS feitas no banco.
--
-- POR QUE FUNCOES, e nao selects do PostgREST. Os agregados do PostgREST estao
-- DESLIGADOS em producao (medido em 2026-09-14: `select=...sum()` e
-- `select=...max()` devolvem PGRST123 "Use of aggregate functions is not
-- allowed"). Sem eles, as tres perguntas abaixo so teriam resposta lendo linhas
-- brutas e somando no servidor, e o cap de linhas do PostgREST trunca essa
-- leitura em silencio, que e a classe de falha que este projeto ja catalogou.
-- Cada funcao devolve o agregado pronto e nunca uma linha por evento.
--
-- DIA = dia civil em America/Sao_Paulo, o mesmo fuso que o resto do admin usa
-- para "dia" (shared/brasiliaDay.ts, diaBrasilia). Com UTC, um clique depois das
-- 21h de Brasilia cairia no dia seguinte no painel e no dia certo no admin.
--
-- SEGURANCA, igual a admin_list_users_page: security definer com search_path
-- PINADO, revoke de public/anon/authenticated e execute SO para service_role.
-- admin_creators_page le e-mail de profiles; sem o grant restrito, qualquer
-- sessao logada leria a base de creators pelo PostgREST.
--
-- ADITIVA: cria funcoes. Nao altera nem remove dado; o rollback e um
-- `drop function`. Isenta da janela de migration destrutiva (CLAUDE.md).

-- 1. serie por dia e por tipo de evento, para um conjunto de codigos.
create or replace function public.creator_events_daily(
  p_affiliate_ids uuid[],
  p_from timestamptz,
  p_to timestamptz
) returns table (
  dia date,
  event_type text,
  quantidade bigint,
  revenue_cents bigint,
  commission_cents bigint
)
language sql stable security definer
set search_path to 'pg_catalog', 'public'
as $$
  select
    (e.occurred_at at time zone 'America/Sao_Paulo')::date as dia,
    e.event_type,
    count(*) as quantidade,
    coalesce(sum(e.revenue_cents), 0) as revenue_cents,
    coalesce(sum(e.commission_cents), 0) as commission_cents
  from public.creator_events e
  where e.affiliate_id = any(p_affiliate_ids)
    and e.occurred_at >= p_from
    and e.occurred_at < p_to
  group by 1, 2
  order by 1, 2;
$$;

revoke all on function public.creator_events_daily(uuid[], timestamptz, timestamptz) from public, anon, authenticated;
grant execute on function public.creator_events_daily(uuid[], timestamptz, timestamptz) to service_role;
alter function public.creator_events_daily(uuid[], timestamptz, timestamptz) owner to postgres;

-- 2. uma pagina do quadro de creators do admin.
--
-- Uma linha por PESSOA, com a concessao mais recente dela (uma pessoa pode ter
-- varias concessoes no historico, mas no maximo uma ativa, e a ativa e sempre a
-- mais recente, porque so se concede de novo depois de revogar).
--   p_status: 'active' (revoked_at null), 'revoked' (a mais recente foi
--             revogada) ou 'all'. Valor fora desses tres nao casa nada: quem
--             valida e a rota, que responde 400 antes de chamar.
--   p_kind:   'influencer', 'afiliado' ou 'all', mesma regra.
-- Totais = soma dos CONTADORES dos codigos do creator (fonte de verdade).
-- ultimo_evento_at = max(occurred_at) dos eventos desses codigos, calculado aqui
-- para a pagina inteira de uma vez.
-- Ordem: receita somada desc, depois granted_at desc, desempate por user_id
-- (sem desempate a paginacao por offset pula e repete linhas).
create or replace function public.admin_creators_page(
  p_status text,
  p_kind text,
  p_limit int,
  p_offset int
) returns table (
  user_id uuid,
  kind text,
  granted_at timestamptz,
  revoked_at timestamptz,
  name text,
  email text,
  handle text,
  avatar_url text,
  codigos jsonb,
  codigos_count bigint,
  clicks bigint,
  sales bigint,
  revenue_cents bigint,
  commission_due_cents bigint,
  commission_paid_cents bigint,
  ultimo_evento_at timestamptz,
  total_count bigint
)
language sql stable security definer
set search_path to 'pg_catalog', 'public'
as $$
  with ultima_concessao as (
    select distinct on (c.user_id)
      c.user_id, c.kind, c.granted_at, c.revoked_at
    from public.creators c
    order by c.user_id, c.granted_at desc, c.id desc
  ),
  filtrados as (
    select u.*
    from ultima_concessao u
    where (p_status = 'all'
           or (p_status = 'active' and u.revoked_at is null)
           or (p_status = 'revoked' and u.revoked_at is not null))
      and (p_kind = 'all' or u.kind = p_kind)
  ),
  codigos as (
    select
      a.user_id,
      jsonb_agg(jsonb_build_object('code', a.code, 'status', a.status)
                order by a.created_at, a.id) as codigos,
      count(*) as codigos_count,
      sum(a.clicks) as clicks,
      sum(a.sales) as sales,
      sum(a.revenue_cents) as revenue_cents,
      sum(a.commission_due_cents) as commission_due_cents,
      sum(a.commission_paid_cents) as commission_paid_cents
    from public.affiliates a
    where a.user_id in (select f.user_id from filtrados f)
    group by a.user_id
  ),
  ultimos as (
    select a.user_id, max(e.occurred_at) as ultimo_evento_at
    from public.creator_events e
    join public.affiliates a on a.id = e.affiliate_id
    where a.user_id in (select f.user_id from filtrados f)
    group by a.user_id
  )
  select
    f.user_id,
    f.kind,
    f.granted_at,
    f.revoked_at,
    p.name,
    p.email,
    p.handle,
    p.avatar_url,
    coalesce(cd.codigos, '[]'::jsonb) as codigos,
    coalesce(cd.codigos_count, 0) as codigos_count,
    coalesce(cd.clicks, 0) as clicks,
    coalesce(cd.sales, 0) as sales,
    coalesce(cd.revenue_cents, 0) as revenue_cents,
    coalesce(cd.commission_due_cents, 0) as commission_due_cents,
    coalesce(cd.commission_paid_cents, 0) as commission_paid_cents,
    ul.ultimo_evento_at,
    count(*) over () as total_count
  from filtrados f
  left join public.profiles p on p.user_id = f.user_id
  left join codigos cd on cd.user_id = f.user_id
  left join ultimos ul on ul.user_id = f.user_id
  order by coalesce(cd.revenue_cents, 0) desc, f.granted_at desc, f.user_id desc
  limit p_limit
  offset p_offset;
$$;

revoke all on function public.admin_creators_page(text, text, int, int) from public, anon, authenticated;
grant execute on function public.admin_creators_page(text, text, int, int) to service_role;
alter function public.admin_creators_page(text, text, int, int) owner to postgres;

-- 3. os numeros do topo do quadro, numa linha so.
--
-- Codigos "vinculados" sao os que tem dono (affiliates.user_id preenchido).
-- Cliques, vendas e comissao devida contam SO os codigos vinculados, porque o
-- quadro e dos creators; codigo sem dono nao pertence a painel nenhum.
-- p_from: inicio da janela de eventos (a rota passa o comeco dos ultimos 30
-- dias civis de Brasilia).
create or replace function public.creators_board_summary(
  p_from timestamptz
) returns table (
  creators_influencer bigint,
  creators_afiliado bigint,
  codigos_vinculados bigint,
  codigos_sem_dono bigint,
  clicks_periodo bigint,
  sales_periodo bigint,
  commission_due_cents bigint
)
language sql stable security definer
set search_path to 'pg_catalog', 'public'
as $$
  select
    (select count(*) from public.creators c
       where c.revoked_at is null and c.kind = 'influencer'),
    (select count(*) from public.creators c
       where c.revoked_at is null and c.kind = 'afiliado'),
    (select count(*) from public.affiliates a where a.user_id is not null),
    (select count(*) from public.affiliates a where a.user_id is null),
    (select count(*) from public.creator_events e
       join public.affiliates a on a.id = e.affiliate_id
       where a.user_id is not null
         and e.event_type = 'click'
         and e.occurred_at >= p_from),
    (select count(*) from public.creator_events e
       join public.affiliates a on a.id = e.affiliate_id
       where a.user_id is not null
         and e.event_type = 'sale'
         and e.occurred_at >= p_from),
    (select coalesce(sum(a.commission_due_cents), 0) from public.affiliates a
       where a.user_id is not null);
$$;

revoke all on function public.creators_board_summary(timestamptz) from public, anon, authenticated;
grant execute on function public.creators_board_summary(timestamptz) to service_role;
alter function public.creators_board_summary(timestamptz) owner to postgres;
