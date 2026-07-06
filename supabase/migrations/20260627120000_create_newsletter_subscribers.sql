-- Cria a tabela newsletter_subscribers para a captura de assinantes da newsletter
-- com double opt-in. Inserts e updates acontecem pelo service_role (supabaseAdmin),
-- que faz bypass de RLS. anon e authenticated ficam em deny-all: sem grant e sem
-- policy. Padrao alinhado com public.waitlist (20260623120000_create_waitlist.sql).

BEGIN;

create table if not exists public.newsletter_subscribers (
    id uuid primary key default gen_random_uuid(),
    email text not null,
    source text not null default 'footer',
    status text not null default 'pending_confirmation'
      check (status in ('pending_confirmation', 'confirmed', 'unsubscribed')),
    created_at timestamptz not null default now(),
    confirmation_sent_at timestamptz,
    confirmed_at timestamptz,
    unsubscribed_at timestamptz
);

-- Dedup case-insensitive: um cadastro por e-mail, ignorando caixa.
create unique index if not exists newsletter_subscribers_email_lower_idx
    on public.newsletter_subscribers (lower(email));

create index if not exists newsletter_subscribers_status_idx
    on public.newsletter_subscribers (status);

create index if not exists newsletter_subscribers_created_at_idx
    on public.newsletter_subscribers (created_at desc);

alter table public.newsletter_subscribers enable row level security;

-- Sem policy: INSERT, SELECT e UPDATE acontecem apenas pelo service_role
-- (supabaseAdmin), que faz bypass de RLS. anon e authenticated nao recebem grant,
-- logo deny-all.
grant all on public.newsletter_subscribers to service_role;

comment on table public.newsletter_subscribers is 'Assinantes da newsletter (double opt-in). Escrita apenas via service_role (supabaseAdmin).';

COMMIT;
