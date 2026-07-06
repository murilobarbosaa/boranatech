-- Security hardening: restringe execucao das RPCs SECURITY DEFINER ao service_role,
-- fixa search_path, mantem call_cron_endpoint interno e escopa roadmap_steps a
-- roadmaps publicados. Aplicado manualmente no SQL Editor em 2026-07-02.

do $$
declare fn record;
begin
  for fn in
    select p.proname, pg_get_function_identity_arguments(p.oid) as args
    from pg_proc p
    where p.pronamespace='public'::regnamespace
      and p.proname in ('get_study_heatmap','get_study_stats','get_ai_usage_today',
                        'get_ai_usage_today_by_tool','is_user_admin','is_user_pro')
  loop
    execute format('revoke all on function public.%I(%s) from public, anon, authenticated;', fn.proname, fn.args);
    execute format('grant execute on function public.%I(%s) to service_role;', fn.proname, fn.args);
    execute format('alter function public.%I(%s) set search_path = pg_catalog, public;', fn.proname, fn.args);
  end loop;
end $$;

revoke all on function public.call_cron_endpoint(text) from public, anon, authenticated;

alter policy "roadmap_steps_select_published" on public.roadmap_steps
  using (exists (
    select 1 from public.roadmaps r
    where r.id = roadmap_steps.roadmap_id and r.is_published = true
  ));
