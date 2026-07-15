-- Corrige os price_cents das 3 linhas Pro para os valores REAIS cobrados pela
-- Stripe (== shared/planPricing.ts, a fonte unica de exibicao/cobranca). Os
-- valores antigos (2490/11940/17990) sao resquicio da era Asaas (migration
-- 20260528120000_add_pro_plan_rows.sql) e nunca foram atualizados quando o
-- provider migrou para a Stripe. O perfil renderiza plans.price_cents, entao o
-- card mostrava R$179,90 enquanto a Stripe cobra R$222,00.
--
-- provider_price_id permanece null DE PROPOSITO (o price id vem do env
-- STRIPE_PRICE_PRO_*). Idempotente (UPDATE para valores fixos por code); nao
-- destrutivo.

update public.plans set price_cents = 2990  where code = 'pro_monthly';
update public.plans set price_cents = 12900 where code = 'pro_semiannual';
update public.plans set price_cents = 22200 where code = 'pro_annual';
