-- Revisão monotônica por análise para invalidar mutações de sessões antigas.
--
-- A revisão vive na própria análise. Abrir/reabrir o checklist incrementa a
-- revisão; todo PUT precisa apresentar o valor recebido nessa abertura. As
-- duas funções abaixo serializam pelo lock da linha de linkedin_analyses, de
-- modo que comparação e escrita nunca formam um SELECT + UPSERT com TOCTOU.
alter table public.linkedin_analyses
  add column if not exists progress_revision bigint not null default 0;

do $$
begin
  alter table public.linkedin_analyses
    add constraint linkedin_analyses_progress_revision_nonnegative
    check (progress_revision >= 0);
exception
  when duplicate_object then null;
end
$$;

create or replace function public.linkedin_begin_progress_session(
  p_user_id uuid,
  p_analysis_id uuid
)
returns table(status text, revision bigint)
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_revision bigint;
begin
  if p_user_id is null or p_analysis_id is null then
    return query select 'not_found'::text, null::bigint;
    return;
  end if;

  update public.linkedin_analyses as analysis
  set progress_revision = analysis.progress_revision + 1
  where analysis.id = p_analysis_id
    and analysis.user_id = p_user_id
  returning analysis.progress_revision into v_revision;

  if not found then
    return query select 'not_found'::text, null::bigint;
    return;
  end if;

  return query select 'started'::text, v_revision;
end;
$$;

create or replace function public.linkedin_set_improvement_progress(
  p_user_id uuid,
  p_analysis_id uuid,
  p_improvement_index integer,
  p_done boolean,
  p_revision bigint
)
returns text
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_revision bigint;
  v_result jsonb;
  v_improvements jsonb;
begin
  if p_user_id is null
    or p_analysis_id is null
    or p_improvement_index is null
    or p_improvement_index < 0
    or p_done is null
    or p_revision is null
    or p_revision < 1 then
    return 'invalid_improvement_index';
  end if;

  -- FOR UPDATE é a primitive de atomicidade: uma abertura nova e este PUT
  -- disputam a mesma linha. Depois do lock, a revisão lida não pode mudar até
  -- o upsert terminar.
  select analysis.progress_revision, analysis.result
  into v_revision, v_result
  from public.linkedin_analyses as analysis
  where analysis.id = p_analysis_id
    and analysis.user_id = p_user_id
  for update;

  if not found then
    return 'not_found';
  end if;

  if v_revision <> p_revision then
    return 'stale_progress_revision';
  end if;

  v_improvements := v_result #> '{qualitative,melhorias}';
  if jsonb_typeof(v_improvements) is distinct from 'array' then
    return 'invalid_improvement_index';
  end if;
  if p_improvement_index >= jsonb_array_length(v_improvements) then
    return 'invalid_improvement_index';
  end if;

  insert into public.linkedin_improvement_progress (
    user_id,
    analysis_id,
    improvement_index,
    done
  ) values (
    p_user_id,
    p_analysis_id,
    p_improvement_index,
    p_done
  )
  on conflict (user_id, analysis_id, improvement_index)
  do update set done = excluded.done;

  return 'saved';
end;
$$;

-- Só o backend com service role pode iniciar sessão ou mutar. As funções ainda
-- filtram user_id + analysis_id explicitamente e nunca retornam dados alheios.
revoke all on function public.linkedin_begin_progress_session(uuid, uuid)
  from public, anon, authenticated;
revoke all on function public.linkedin_set_improvement_progress(
  uuid,
  uuid,
  integer,
  boolean,
  bigint
) from public, anon, authenticated;

grant execute on function public.linkedin_begin_progress_session(uuid, uuid)
  to service_role;
grant execute on function public.linkedin_set_improvement_progress(
  uuid,
  uuid,
  integer,
  boolean,
  bigint
) to service_role;

comment on function public.linkedin_begin_progress_session(uuid, uuid) is
  'Inicia uma sessão monotônica de progresso para uma análise do próprio usuário.';
comment on function public.linkedin_set_improvement_progress(
  uuid,
  uuid,
  integer,
  boolean,
  bigint
) is
  'Grava progresso somente se a revisão ainda for atual; serializa pela análise.';
