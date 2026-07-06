-- get_ai_usage_admin_summary: agregacao por ferramenta, cruzando TODOS os usuarios.
-- SECURITY DEFINER + search_path fixo. Acesso restrito a service_role.
create or replace function public.get_ai_usage_admin_summary(
  p_since timestamptz default null,
  p_until timestamptz default null
)
returns table (
  tool text,
  total_runs bigint,
  success_runs bigint,
  error_runs bigint,
  total_input_tokens bigint,
  total_output_tokens bigint,
  total_cost_estimate numeric
)
language sql
stable
security definer
set search_path = public
as $$
  select
    l.tool,
    count(*) as total_runs,
    count(*) filter (where l.status = 'success') as success_runs,
    count(*) filter (where l.status <> 'success') as error_runs,
    coalesce(sum(l.input_tokens), 0) as total_input_tokens,
    coalesce(sum(l.output_tokens), 0) as total_output_tokens,
    coalesce(sum(l.cost_estimate), 0) as total_cost_estimate
  from public.ai_usage_logs l
  where (p_since is null or l.created_at >= p_since)
    and (p_until is null or l.created_at < p_until)
  group by l.tool
  order by total_runs desc;
$$;

revoke all on function public.get_ai_usage_admin_summary(timestamptz, timestamptz) from public;
revoke all on function public.get_ai_usage_admin_summary(timestamptz, timestamptz) from anon, authenticated;
grant execute on function public.get_ai_usage_admin_summary(timestamptz, timestamptz) to service_role;
