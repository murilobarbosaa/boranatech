-- Etapa 2 do tratamento de bounces do Resend.
--
-- A) resend_apply_event: aplica UM evento do Resend (por svix-id) de forma
--    idempotente. Fonte unica da regra de apply, chamada tanto pela RPC
--    (eventos em buffer da race) quanto pelo webhook (Etapa 4).
-- B) email_campaign_record_result ganha p_provider_message_id: estampa o
--    data.id do Resend no recipient e, no sucesso, aplica eventos que o webhook
--    ja tenha bufferizado para aquele message_id (webhook antes do commit).
--
-- sent_count/failed_count PERMANECEM inalterados. bounced_count/complained_count
-- (colunas da Etapa 1) sao mantidos so pelo apply.

begin;

-- A) Apply idempotente de um evento -----------------------------------------
-- Trava o evento (FOR UPDATE): quem pegar primeiro aplica e seta applied=true;
-- um segundo apply do mesmo evento (RPC vs webhook concorrentes, ou reentrega
-- do Svix) ve applied=true e sai sem re-contar. Supressao por e-mail independe
-- de existir recipient (pega bounce de transacional). Efeitos por-campanha
-- (delivery_status + contador) so quando o recipient e achado pelo message_id.
create or replace function public.resend_apply_event(p_event_id text)
  returns void
  language plpgsql
  security definer
  set search_path = public
as $$
declare
  v_event       public.resend_events%rowtype;
  v_new_status  text;
  v_suppress    boolean := false;
  v_supp_reason text;
  v_campaign_id uuid;
begin
  select * into v_event
  from public.resend_events
  where id = p_event_id
  for update;

  -- Inexistente ou ja aplicado: no-op idempotente.
  if not found or v_event.applied then
    return;
  end if;

  -- Mapeia tipo de evento -> efeito. Hard bounce (Permanent) e complaint
  -- suprimem; delivery_delayed (soft) so marca; delivered so marca (v2, nao
  -- ingerido no v1, mas tolerado se chegar).
  if v_event.event_type = 'email.bounced' then
    v_new_status := 'bounced';
    -- So Permanent suprime. O Resend manda soft como delivery_delayed, mas
    -- checamos o type defensivamente; null (type ausente) tratamos como hard.
    if v_event.bounce_type is null or v_event.bounce_type = 'Permanent' then
      v_suppress := true;
      v_supp_reason := 'bounced';
    end if;
  elsif v_event.event_type = 'email.complained' then
    v_new_status := 'complained';
    v_suppress := true;
    v_supp_reason := 'complained';
  elsif v_event.event_type = 'email.delivery_delayed' then
    v_new_status := 'delayed';
  elsif v_event.event_type = 'email.delivered' then
    v_new_status := 'delivered';
  else
    -- opened/clicked/sent e afins: sem efeito de entrega, so marca aplicado.
    v_new_status := null;
  end if;

  -- Supressao global por e-mail (lower; unique(email) torna idempotente).
  if v_suppress and v_event.email is not null then
    insert into public.email_suppressions (email, reason, source)
    values (lower(v_event.email), v_supp_reason, 'resend_webhook')
    on conflict (email) do nothing;
  end if;

  -- Efeitos por-campanha: so com recipient achado pelo message-id. O guard de
  -- transicao evita re-contar em evento duplicado (svix-id diferente) e impede
  -- que delivered/delayed sobrescreva um estado terminal (bounced/complained).
  if v_event.message_id is not null and v_new_status is not null then
    update public.email_campaign_recipients
    set delivery_status = v_new_status,
        delivery_updated_at = now()
    where provider_message_id = v_event.message_id
      and delivery_status is distinct from v_new_status
      and (
        v_new_status in ('bounced', 'complained')  -- terminais sempre vencem
        or delivery_status is null
        or delivery_status = 'delayed'             -- delivered/delayed so sobre nao-terminal
      )
    returning campaign_id into v_campaign_id;

    -- Incrementa so na transicao efetiva (update aconteceu) e so p/ bounce/
    -- complaint (v1 nao conta delivered).
    if found then
      if v_event.event_type = 'email.bounced' then
        update public.email_campaigns
        set bounced_count = bounced_count + 1
        where id = v_campaign_id;
      elsif v_event.event_type = 'email.complained' then
        update public.email_campaigns
        set complained_count = complained_count + 1
        where id = v_campaign_id;
      end if;
    end if;
  end if;

  -- Fecha a idempotencia. O FOR UPDATE acima serializa com o apply concorrente.
  update public.resend_events
  set applied = true
  where id = p_event_id;
end;
$$;

revoke all on function public.resend_apply_event(text) from anon, authenticated;
grant execute on function public.resend_apply_event(text) to service_role;

-- B) record_result com p_provider_message_id ---------------------------------
-- DROP explicito da versao 3-arg: (uuid,boolean,text) e (uuid,boolean,text,text)
-- sao assinaturas distintas; deixar as duas geraria sobrecarga ambigua (defaults
-- nao desambiguam no Postgres). Chamadas existentes com 3 args nomeados passam a
-- resolver para a 4-arg (p_provider_message_id assume o default null).
drop function if exists public.email_campaign_record_result(uuid, boolean, text);

create or replace function public.email_campaign_record_result(
  p_recipient_id uuid,
  p_success boolean,
  p_error text default null,
  p_provider_message_id text default null
)
  returns void
  language plpgsql
  security definer
  set search_path = public
as $$
declare
  v_campaign_id uuid;
  v_event_id text;
begin
  -- Estampa o message_id so no sucesso (falha nao tem id do Resend).
  update public.email_campaign_recipients
  set status = case when p_success then 'sent' else 'failed' end,
      sent_at = case when p_success then now() else null end,
      error = case when p_success then null else p_error end,
      provider_message_id = case when p_success then p_provider_message_id else null end
  where id = p_recipient_id
    and status = 'pending'
  returning campaign_id into v_campaign_id;

  if v_campaign_id is null then
    return;
  end if;

  -- sent_count/failed_count: INALTERADOS (mesma regra de sempre).
  update public.email_campaigns
  set sent_count = sent_count + (case when p_success then 1 else 0 end),
      failed_count = failed_count + (case when p_success then 0 else 1 end)
  where id = v_campaign_id;

  -- Resolve a race: o webhook pode ter chegado e bufferizado eventos deste
  -- message_id antes deste commit. Agora que o provider_message_id esta gravado,
  -- aplica os pendentes (apply e idempotente; se o webhook ja aplicou, no-op).
  if p_success and p_provider_message_id is not null then
    for v_event_id in
      select id
      from public.resend_events
      where message_id = p_provider_message_id
        and applied = false
    loop
      perform public.resend_apply_event(v_event_id);
    end loop;
  end if;

  perform public.email_campaign_try_complete(v_campaign_id);
end;
$$;

revoke all on function public.email_campaign_record_result(uuid, boolean, text, text) from anon, authenticated;
grant execute on function public.email_campaign_record_result(uuid, boolean, text, text) to service_role;

commit;
