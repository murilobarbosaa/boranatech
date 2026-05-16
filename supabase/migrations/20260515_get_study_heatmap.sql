-- RPC: heatmap diário das últimas N entries (default 35 dias).
-- Returns: [{ date: 'YYYY-MM-DD', minutes: int, entries: int }]
create or replace function public.get_study_heatmap(
  p_user_id uuid,
  p_days integer default 365
)
returns table(
  date date,
  minutes integer,
  entries integer
)
language sql
stable
security definer
set search_path = public
as $$
  select
    (date_trunc('day', studied_at at time zone 'America/Sao_Paulo'))::date as date,
    coalesce(sum(minutes), 0)::integer as minutes,
    count(*)::integer as entries
  from study_entries
  where user_id = p_user_id
    and studied_at >= (now() - (p_days || ' days')::interval)
  group by (date_trunc('day', studied_at at time zone 'America/Sao_Paulo'))::date
  order by date asc;
$$;

grant execute on function public.get_study_heatmap(uuid, integer) to service_role;
