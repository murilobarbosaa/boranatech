-- Declaracao retroativa. Esta tabela foi criada direto em producao em
-- 2026-08-11 por uma rotina agendada (Cowork, coleta diaria de eventos), que
-- registrou esta versao em supabase_migrations.schema_migrations mas nao
-- commitou o arquivo. Este DDL espelha o schema real lido de producao em
-- 2026-08-23. Em producao a versao ja consta como aplicada e este arquivo
-- nunca executa; ele existe para reproducibilidade de ambiente.

create table if not exists public.external_events (
  id uuid primary key default gen_random_uuid(),
  external_id text,
  source text not null,
  title text not null,
  description text,
  organizer text,
  event_type text,
  tags jsonb default '[]'::jsonb,
  area_slug text,
  url text not null,
  calendar_url text,
  price_type text,
  price_label text,
  starts_on date,
  ends_on date,
  date_label text,
  time_label text,
  date_status text not null default 'confirmada',
  recurrence text not null default 'unico',
  modality text,
  city text,
  state text,
  uf text,
  country text default 'Brasil',
  location_label text,
  language text default 'pt-BR',
  verified_source_url text,
  verified_at timestamptz,
  fetched_at timestamptz default now(),
  last_seen_at timestamptz,
  published_at timestamptz,
  is_published boolean default true,
  featured boolean not null default false,
  featured_until timestamptz,
  created_by uuid,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  deleted_at timestamptz,
  deleted_reason text,
  constraint external_events_date_status_chk
    check (date_status = any (array['confirmada'::text, 'a_confirmar'::text])),
  constraint external_events_modality_chk
    check (modality is null or modality = any (array['Presencial'::text, 'Online'::text, 'Híbrido'::text])),
  constraint external_events_price_type_chk
    check (price_type is null or price_type = any (array['gratuito'::text, 'pago'::text, 'misto'::text])),
  constraint external_events_date_coerency_chk
    check (((date_status = 'a_confirmar'::text) or (starts_on is not null))
      and ((ends_on is null) or (starts_on is null) or (ends_on >= starts_on)))
);

create unique index if not exists external_events_url_uidx
  on public.external_events using btree (lower(url));

create unique index if not exists external_events_source_extid_uidx
  on public.external_events using btree (source, external_id)
  where (external_id is not null);

create unique index if not exists external_events_edicao_uidx
  on public.external_events using btree
  (lower(title), lower(coalesce(city, ''::text)), date_trunc('month'::text, (starts_on)::timestamp without time zone))
  where (starts_on is not null);

create index if not exists external_events_agenda_idx
  on public.external_events using btree (starts_on)
  where (is_published and (deleted_at is null));

create index if not exists external_events_source_idx
  on public.external_events using btree (source);

create index if not exists external_events_modality_idx
  on public.external_events using btree (modality);

create index if not exists external_events_uf_idx
  on public.external_events using btree (uf);

create or replace function public.external_events_bloqueia_delete()
returns trigger
language plpgsql
as $function$
begin
  raise exception using
    errcode = 'P0001',
    message = 'external_events nao aceita DELETE.',
    hint    = 'Use soft delete: update public.external_events set deleted_at = now(), deleted_reason = ''...'' where id = ''...'';';
end $function$;

create or replace function public.external_events_touch()
returns trigger
language plpgsql
as $function$
begin new.updated_at := now(); return new; end $function$;

drop trigger if exists external_events_no_delete on public.external_events;
create trigger external_events_no_delete
  before delete on public.external_events
  for each row execute function public.external_events_bloqueia_delete();

drop trigger if exists external_events_touch on public.external_events;
create trigger external_events_touch
  before update on public.external_events
  for each row execute function public.external_events_touch();

alter table public.external_events enable row level security;

drop policy if exists external_events_select_published on public.external_events;
create policy external_events_select_published on public.external_events
  for select using ((is_published = true) and (deleted_at is null));

insert into public.content_sources (code, name, type, status, config)
select
  'eventos_agent',
  'Eventos de tecnologia (agente diario)',
  'events-api',
  'active',
  '{"destino":"public.external_events","cadencia":"diaria 06:00 America/Sao_Paulo","regra":"somente insert; nunca delete; nunca sobrescrever registro existente"}'::jsonb
where not exists (select 1 from public.content_sources where code = 'eventos_agent');
