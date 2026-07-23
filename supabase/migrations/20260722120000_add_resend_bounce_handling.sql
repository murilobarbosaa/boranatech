-- Etapa 1 do tratamento de bounces do Resend. Tudo aditivo: colunas nullable,
-- nova tabela de eventos (idempotencia/auditoria/buffer) e expansao do CHECK de
-- reason. NAO altera o CHECK de email_campaign_recipients.status
-- (pending|sent|failed), que segue significando "aceite no hand-off ao Resend".

begin;

-- 1a. Recipients: id do provedor (correlacao com o webhook) e status de entrega
-- assincrono (alimentado so pelo webhook). O status de aceite fica intocado.
alter table public.email_campaign_recipients
  add column if not exists provider_message_id text,
  add column if not exists delivery_status text,
  add column if not exists delivery_updated_at timestamptz;

-- delivery_status ja aceita delivered/delayed p/ o v2 (o v1 so grava
-- bounced/complained), sem precisar de nova migracao depois.
alter table public.email_campaign_recipients
  drop constraint if exists email_campaign_recipients_delivery_status_check;
alter table public.email_campaign_recipients
  add constraint email_campaign_recipients_delivery_status_check
  check (
    delivery_status is null
    or delivery_status = any (array[
      'delivered', 'bounced', 'complained', 'delayed'
    ]::text[])
  );

-- Lookup do webhook por message-id. Parcial: so linhas ja enviadas tem id.
create index if not exists email_campaign_recipients_provider_message_id_idx
  on public.email_campaign_recipients (provider_message_id)
  where provider_message_id is not null;

-- 1c. Contadores agregados por campanha, mantidos pelo apply do webhook. Sem
-- delivered_count: "entregues" e derivado (sent - bounced - complained) no v1,
-- que nao ingere email.delivered (decisao de volume).
alter table public.email_campaigns
  add column if not exists bounced_count integer not null default 0,
  add column if not exists complained_count integer not null default 0;

-- 1b. Eventos do Resend: idempotencia (pk = svix-id), auditoria e buffer da
-- race (webhook antes do commit do sent). Espelha billing_events.
-- email guardado em lower para casar com email_suppressions/recipients.
create table if not exists public.resend_events (
  id text primary key,               -- svix-id (id unico da entrega do evento)
  event_type text not null,          -- email.bounced, email.complained, ...
  message_id text,                   -- data.email_id do payload
  email text,                        -- destinatario, normalizado em lower
  bounce_type text,                  -- data.bounce.type (Permanent/Transient)
  payload jsonb,
  received_at timestamptz not null default now(),
  applied boolean not null default false
);

create index if not exists resend_events_message_id_idx
  on public.resend_events (message_id);

-- Sweep de orfaos (applied=false, mais antigos primeiro): o predicado parcial
-- filtra pela flag e received_at ordena o reprocessamento.
create index if not exists resend_events_unapplied_idx
  on public.resend_events (applied, received_at)
  where applied = false;

-- So o backend (service role) acessa. RLS on sem policies bloqueia a Data API
-- para anon/authenticated, mesmo padrao de billing_events.
alter table public.resend_events enable row level security;

-- 1d. Complaint (marcou como spam) e semanticamente diferente de bounce: entra
-- como novo valor no CHECK de reason. Nao mexe no CHECK de email lowercase.
alter table public.email_suppressions
  drop constraint if exists email_suppressions_reason_check;
alter table public.email_suppressions
  add constraint email_suppressions_reason_check
  check (reason = any (array[
    'unsubscribed', 'bounced', 'manual', 'complained'
  ]::text[]));

commit;
