-- Despesas lancadas manualmente pelo admin. Moeda estrangeira trava o cambio na
-- data do lancamento (PTAX do Banco Central): amount_brl_cents fica CONGELADO.
-- Tudo em centavos (bigint). Nunca float para dinheiro.

create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  description text not null,
  -- infra | ia | email | marketing | juridico | contabil | ferramentas | dominio | outros
  category text not null check (
    category in (
      'infra', 'ia', 'email', 'marketing', 'juridico',
      'contabil', 'ferramentas', 'dominio', 'outros'
    )
  ),
  vendor text, -- Railway, Vercel, OpenAI, Meta Ads, etc
  kind text not null check (kind in ('recurring', 'one_off')),
  amount_cents bigint not null,           -- valor na moeda original
  currency text not null default 'BRL',
  amount_brl_cents bigint not null,       -- convertido e CONGELADO no lancamento
  fx_rate numeric,                        -- PTAX usada (null se ja era BRL)
  fx_date date,                           -- data da cotacao PTAX usada
  incurred_on date not null,              -- competencia do gasto (one_off)
  recurrence_start date,                  -- inicio (recurring)
  recurrence_end date,                    -- null = ainda ativa
  recurrence_interval text check (
    recurrence_interval in ('monthly', 'yearly')
  ),
  notes text,
  created_by uuid references auth.users(id) not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists expenses_incurred_on_idx
  on public.expenses (incurred_on);
create index if not exists expenses_category_idx on public.expenses (category);
create index if not exists expenses_kind_idx on public.expenses (kind);

-- updated_at automatico (reusa a funcao ja existente em remote_schema).
create trigger expenses_set_updated_at
  before update on public.expenses
  for each row execute function public.set_updated_at();

-- RLS: sem NENHUMA policy, nega tudo por padrao. So o service role (supabaseAdmin)
-- le e escreve. Nenhum acesso via anon/authenticated.
alter table public.expenses enable row level security;
