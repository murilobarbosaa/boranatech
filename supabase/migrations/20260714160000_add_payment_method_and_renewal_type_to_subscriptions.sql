-- Prepara o schema para assinaturas Pix de renovacao manual nos planos anual e
-- semestral. Pix nao tem debito recorrente na Stripe, entao essas assinaturas
-- precisam de acao do usuario para renovar. Esta migration so prepara o schema;
-- nenhuma logica de checkout, webhook ou cron muda aqui.

-- payment_method: nullable de proposito. As linhas existentes vieram de cartao,
-- mas nao ha registro explicito e nao queremos backfill adivinhado.
alter table public.subscriptions
  add column if not exists payment_method text
    check (payment_method in ('card', 'pix', 'boleto'));

-- renewal_type: default 'auto' porque toda assinatura existente e cartao via
-- mode: subscription, que renova sozinha. Pix nascera como 'manual'.
alter table public.subscriptions
  add column if not exists renewal_type text not null default 'auto'
    check (renewal_type in ('auto', 'manual'));

-- renewal_reminder_sent_at: ultimo lembrete de expiracao enviado, para o cron
-- (task futura) nao reenviar. Nome e semantica definitivos agora.
alter table public.subscriptions
  add column if not exists renewal_reminder_sent_at timestamp with time zone;

-- Indice parcial para o cron de expiracao das assinaturas de renovacao manual.
create index if not exists subscriptions_manual_renewal_expiry_idx
  on public.subscriptions (current_period_end)
  where renewal_type = 'manual' and status = 'active';

-- Corrige o seed das 3 linhas Pro: o provider real e Stripe, nao Asaas (resquicio
-- de 20260528120000_add_pro_plan_rows.sql). provider_price_id fica null de proposito:
-- o price id vem do env (STRIPE_PRICE_PRO_*), sem segunda fonte da verdade.
update public.plans
  set provider = 'stripe'
  where code in ('pro_monthly', 'pro_semiannual', 'pro_annual')
    and provider = 'asaas';
