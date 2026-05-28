-- Versiona as 3 linhas de plano Pro (pro_monthly, pro_semiannual, pro_annual).
-- Idempotente via ON CONFLICT (code). Permite recriar o banco do zero.
-- pro_monthly ja existe em prod e nao sera atualizada por esta migration
-- (ON CONFLICT DO NOTHING). Ajuste de name em prod e feito manualmente
-- via UPDATE separado (fora desta migration, intencional).

insert into public.plans (code, name, description, price_cents, currency, interval, provider, provider_price_id, is_active, features)
values
  ('pro_monthly',    'Pro Mensal',    'Acesso completo com ferramentas de IA', 2490,  'BRL', 'month',      'asaas', null, true, '{}'::jsonb),
  ('pro_semiannual', 'Pro Semestral', 'Acesso completo com ferramentas de IA', 11940, 'BRL', 'semiannual', 'asaas', null, true, '{}'::jsonb),
  ('pro_annual',     'Pro Anual',     'Acesso completo com ferramentas de IA', 17990, 'BRL', 'year',       'asaas', null, true, '{}'::jsonb)
on conflict (code) do nothing;
