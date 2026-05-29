-- Corrige 3 bugs em get_study_stats:
--   1. Streak nao expirava: a clausula `or v_current_streak = 0` fazia a
--      atividade mais recente sempre virar streak >= 1 sem comparar com hoje.
--      Agora o streak so esta vivo se a ultima atividade foi HOJE ou ONTEM (SP).
--   2. Timezone: a funcao derivava o "dia" via cast implicito timestamptz->date
--      no TZ da sessao (UTC), divergindo do get_study_heatmap (America/Sao_Paulo).
--      Agora todo "dia" e derivado em America/Sao_Paulo, consistente com o heatmap.
--   3. Distinct por timestamp: `distinct studied_at` / `count(distinct studied_at)`
--      distinguiam instantes, nao dias. Agora distingue/conta por DIA (em SP).
create or replace function public.get_study_stats(p_user_id uuid, p_range text default '30d')
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_days integer;
  v_today date;
  v_from date;
  v_total_minutes integer;
  v_days_studied integer;
  v_current_streak integer;
  v_longest_streak integer;
  v_streak_count integer;
  v_prev_date date;
  v_entry_date date;
begin
  v_days := case
    when p_range = '7d' then 7
    when p_range = '30d' then 30
    when p_range = '90d' then 90
    else 30
  end;

  -- "hoje" no fuso de Sao Paulo (consistente com get_study_heatmap)
  v_today := (now() at time zone 'America/Sao_Paulo')::date;
  v_from := v_today - v_days;

  -- total de minutos e dias estudados no range (dia derivado em SP)
  select
    coalesce(sum(minutes), 0),
    count(distinct (studied_at at time zone 'America/Sao_Paulo')::date)
  into v_total_minutes, v_days_studied
  from public.study_entries
  where user_id = p_user_id
    and (studied_at at time zone 'America/Sao_Paulo')::date >= v_from;

  -- STREAK ATUAL: dias distintos (SP) em ordem desc, historico completo
  v_current_streak := 0;
  v_prev_date := null;

  for v_entry_date in
    select distinct (studied_at at time zone 'America/Sao_Paulo')::date as d
    from public.study_entries
    where user_id = p_user_id
    order by d desc
  loop
    if v_prev_date is null then
      -- ancora: streak vivo somente se a atividade mais recente foi hoje ou ontem
      if v_entry_date >= v_today - 1 then
        v_current_streak := 1;
        v_prev_date := v_entry_date;
      else
        exit;
      end if;
    elsif v_prev_date - v_entry_date = 1 then
      v_current_streak := v_current_streak + 1;
      v_prev_date := v_entry_date;
    else
      exit;
    end if;
  end loop;

  -- LONGEST STREAK (recorde): maior sequencia de dias consecutivos (SP), historico completo
  v_longest_streak := 0;
  v_streak_count := 0;
  v_prev_date := null;

  for v_entry_date in
    select distinct (studied_at at time zone 'America/Sao_Paulo')::date as d
    from public.study_entries
    where user_id = p_user_id
    order by d asc
  loop
    if v_prev_date is null or v_entry_date - v_prev_date = 1 then
      v_streak_count := v_streak_count + 1;
    else
      v_streak_count := 1;
    end if;
    if v_streak_count > v_longest_streak then
      v_longest_streak := v_streak_count;
    end if;
    v_prev_date := v_entry_date;
  end loop;

  return jsonb_build_object(
    'total_minutes',  v_total_minutes,
    'days_studied',   v_days_studied,
    'current_streak', v_current_streak,
    'longest_streak', v_longest_streak
  );
end;
$$;
