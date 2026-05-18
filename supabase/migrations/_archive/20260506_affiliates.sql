create table public.affiliates (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text,
  code text unique not null,
  discount_percent integer not null default 20 check (discount_percent between 1 and 100),
  commission_percent integer not null default 30 check (commission_percent between 1 and 100),
  status text not null default 'active' check (status in ('active', 'paused', 'inactive')),
  clicks integer not null default 0,
  trials integer not null default 0,
  sales integer not null default 0,
  revenue_cents integer not null default 0,
  commission_due_cents integer not null default 0,
  commission_paid_cents integer not null default 0,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index affiliates_code_idx on public.affiliates(code);
create index affiliates_status_idx on public.affiliates(status);

create trigger affiliates_updated_at
  before update on public.affiliates
  for each row execute function public.set_updated_at();

alter table public.affiliates enable row level security;

create policy "affiliates_admin_all"
  on public.affiliates for all
  using (true)
  with check (true);

alter table public.subscriptions
  add column if not exists affiliate_code text;

create index if not exists subscriptions_affiliate_code_idx on public.subscriptions(affiliate_code);
