-- =============================================================================
-- BACKFILL CONSOLIDADO: donos de linhas em public.finance_transactions
--
-- NÃO EXECUTADO. Contagens medidas contra produção em 2026-07-30.
--
-- Contexto: finance_transactions.user_id é o que liga dinheiro a pessoa. Linha
-- sem dono não aparece no extrato de ninguém (GET /users/:id/transactions
-- filtra por user_id) e não será reembolsável pela UI da Fatia 7. É dinheiro
-- real invisível.
--
-- Os três blocos abaixo são independentes e idempotentes: rodar duas vezes não
-- muda nada na segunda, porque todos filtram por `user_id is null` e ATRIBUEM
-- (SET = valor), nunca incrementam. Nenhum apaga linha.
--
-- JANELA: os três ALTERAM dado existente (UPDATE), então pela regra do
-- CLAUDE.md valem a janela de 05h-09h de Brasília, com backup COMPLETED
-- confirmado. Não são aditivos.
--
-- ATENÇÃO ao rodar no SQL Editor do Supabase: cada statement roda em sessão
-- diferente. Rode um bloco por vez e confira a contagem antes de seguir.
-- =============================================================================


-- -----------------------------------------------------------------------------
-- (A) REFUND e DISPUTE pela cobrança-mãe                       AFETA HOJE: 0
-- -----------------------------------------------------------------------------
-- Origem: Fatia 0. A ingestão só resolvia customer para source.object='charge',
-- então refund e dispute entravam sem dono e o "Valor pago (total)" nunca
-- descontava devolução. A ingestão já foi corrigida (resolveOwnerFromParentCharge
-- em server/lib/stripeSync.ts); isto é para linhas gravadas ANTES da correção.
--
-- Zero linhas hoje porque não existe nenhum refund nem dispute em produção. O
-- bloco fica aqui para o dia em que existir e alguém precisar reprocessar.
--
-- Conferir antes de rodar:
--   select count(*) from public.finance_transactions ft
--     join public.finance_transactions mae
--       on mae.type='charge' and mae.stripe_charge_id = ft.stripe_charge_id
--      and mae.user_id is not null
--    where ft.type in ('refund','dispute') and ft.user_id is null
--      and ft.stripe_charge_id is not null;

update public.finance_transactions ft
   set user_id   = mae.user_id,
       plan_code = coalesce(ft.plan_code, mae.plan_code)
  from public.finance_transactions mae
 where ft.type in ('refund', 'dispute')
   and ft.user_id is null
   and ft.stripe_charge_id is not null
   and mae.type = 'charge'
   and mae.stripe_charge_id = ft.stripe_charge_id
   and mae.user_id is not null;


-- -----------------------------------------------------------------------------
-- (B) CHARGE com customer no payload mas sem dono              AFETA HOJE: 0
-- -----------------------------------------------------------------------------
-- Origem: Fatia 0. É a classe TRANSITÓRIA: a balance transaction foi ingerida
-- antes de subscriptions.provider_customer_id existir, e o upsert do sync
-- (idempotente por bt id) reresolve na passada seguinte dentro da janela.
--
-- Medido em 2026-07-30: 0 linhas. Na Fatia 4 havia 1 (ch_3TyhQB), e ela
-- desapareceu sozinha entre duas consultas — a auto-cura foi observada, não
-- suposta. Este bloco só é necessário se uma linha desta classe ficar mais
-- velha que a janela do sync (2 dias) sem ter sido reresolvida.
--
-- Conferir antes de rodar:
--   select count(*) from public.finance_transactions ft
--     join public.subscriptions s
--       on s.provider_customer_id = ft.raw_payload->'source'->>'customer'
--    where ft.type='charge' and ft.user_id is null;

update public.finance_transactions ft
   set user_id   = s.user_id,
       plan_code = coalesce(ft.plan_code, p.code)
  from public.subscriptions s
  left join public.plans p on p.id = s.plan_id
 where ft.type = 'charge'
   and ft.user_id is null
   and s.provider_customer_id = ft.raw_payload->'source'->>'customer'
   and s.user_id is not null;


-- -----------------------------------------------------------------------------
-- (C) BOLETO pelo payment intent                               AFETA HOJE: 4
-- -----------------------------------------------------------------------------
-- Origem: esta mini-fatia. É a classe PERMANENTE: boleto em `mode: payment` não
-- anexa customer à charge, então o campo nunca vai aparecer e nenhum sync
-- futuro resolve sozinho. Total parado: R$ 450,03 (4 linhas).
--
-- É SQL PURO, sem chamar a Stripe. Isso contraria a suposição registrada na
-- Fatia 4 ("provavelmente precisa da Stripe"): o vínculo já está no banco,
-- porque subscriptions.raw_provider_payload guarda o EVENTO
-- checkout.session.completed inteiro, e a sessão (data.object) carrega o
-- payment_intent da cobrança.
--
-- FONTE DA VERDADE: subscriptions.user_id, coluna que o próprio webhook escreve
-- depois de resolver a pessoa. O metadata.supabase_user_id da sessão entra
-- apenas como CORROBORAÇÃO no WHERE: se existir e divergir, a linha NÃO é
-- atribuída. Medido: 0 divergências hoje, e as 4 linhas têm as duas fontes
-- concordando.
--
-- A ingestão já foi corrigida (resolveOwnerFromPaymentIntent), então boleto
-- novo a partir do deploy resolve sozinho. Isto é para as 4 já gravadas.
--
-- Conferir antes de rodar:
--   select ft.stripe_charge_id, ft.gross_cents, s.user_id
--     from public.finance_transactions ft
--     join public.subscriptions s
--       on s.raw_provider_payload->'data'->'object'->>'payment_intent'
--          = ft.raw_payload->'source'->>'payment_intent'
--    where ft.type='charge' and ft.user_id is null and s.user_id is not null;

update public.finance_transactions ft
   set user_id   = s.user_id,
       plan_code = coalesce(ft.plan_code, p.code)
  from public.subscriptions s
  left join public.plans p on p.id = s.plan_id
 where ft.type = 'charge'
   and ft.user_id is null
   and s.raw_provider_payload->'data'->'object'->>'payment_intent'
       = ft.raw_payload->'source'->>'payment_intent'
   and s.user_id is not null
   -- Corroboração: metadata ausente passa; metadata divergente NÃO.
   and coalesce(
         s.raw_provider_payload->'data'->'object'->'metadata'->>'supabase_user_id',
         s.user_id::text
       ) = s.user_id::text;


-- -----------------------------------------------------------------------------
-- CONFERÊNCIA FINAL (rodar depois dos três)
-- -----------------------------------------------------------------------------
-- Espera-se 0 em charges_sem_dono. Se sobrar alguma, ela não tem nem customer
-- nem sessão casável, e aí é investigação caso a caso — NÃO force atribuição.
--
--   select
--     count(*) filter (where type='charge'  and user_id is null)::int as charges_sem_dono,
--     count(*) filter (where type='refund'  and user_id is null)::int as refunds_sem_dono,
--     count(*) filter (where type='dispute' and user_id is null)::int as disputes_sem_dono,
--     count(*) filter (where type='payout')::int                      as payouts_ignorados
--   from public.finance_transactions;
--
-- payout NÃO tem dono por definição (é movimento da conta Stripe, não pagamento
-- de usuário). 1 linha hoje, e continuar sem dono é o correto.
