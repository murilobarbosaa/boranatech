-- =============================================================================
-- PARA A ANA RODAR NO SQL EDITOR. NAO EXECUTADO POR MIM.
--
-- Preenche `plan_code` das DUAS linhas de uma mesma ocorrencia em
-- public.finance_transactions: a cobranca anual de 17/08 e o estorno integral
-- dela de 29/08. Hoje as duas tem `plan_code` NULL, e R$ 222,00 de receita
-- bruta mais R$ 222,00 de devolucao ficam fora de "receita por plano".
--
-- Medido em 2026-09-03 e RECONFERIDO em 2026-09-05, contra producao: as mesmas
-- quatro linhas sem plano, as mesmas duas desta ocorrencia. Sem dado pessoal
-- aqui: so ids de pagamento, valores e datas.
--
-- JANELA OBRIGATORIA: 05h-09h de Brasilia, com o backup da madrugada
-- confirmado COMPLETED. Sao UPDATE em dado preexistente. Registre:
--   janela: HHhMM, backup de <data> confirmado COMPLETED
-- =============================================================================


-- -----------------------------------------------------------------------------
-- POR QUE 'pro_annual', e nao um chute
-- -----------------------------------------------------------------------------
-- Duas evidencias independentes, e elas concordam:
--
-- 1. O VALOR. 22200 centavos e exatamente `PLAN_PRICING.pro_annual.total`
--    (R$ 222,00) em shared/planPricing.ts. Nenhum outro plano tem esse preco, e
--    boleto cobra o valor inline cheio, sem desconto de cupom nesta linha
--    (fee_cents = 0, gross = net = 22200).
--
-- 2. A NOTA DE RESOLUCAO ja escrita na fila de orfaos, linha
--    d15199ca-8512-4353-88bc-f9d1a3014a40 de public.billing_orphan_payments,
--    cuja `stripe_charge_id` e a mesma cobranca:
--      "Reembolso integral na Stripe em 29/08/2026. Pagou pro_annual em 17/08 e
--       excluiu a propria conta 33 minutos depois, pelo fluxo do produto."
--
-- POR QUE O CAMPO FICOU NULO. A conta foi excluida, o CASCADE levou a linha de
-- public.subscriptions, e `resolveByCustomer` (server/lib/stripeSync.ts:307)
-- resolve `user_id` E `plan_code` por ali. Sem a linha, os dois saem nulos. O
-- estorno herdaria o plano da cobranca-mae por
-- `resolveOwnerFromParentCharge` (:251), mas a mae tambem esta nula: nao havia
-- o que herdar.
--
-- `user_id` CONTINUA NULO nas duas, de proposito. A conta nao existe mais, entao
-- nao ha id para preencher, e casar por e-mail seria atribuir dinheiro por
-- inferencia. O que este script conserta e so a atribuicao de PLANO, que nao
-- depende de pessoa nenhuma.


-- -----------------------------------------------------------------------------
-- POR QUE AS DUAS LINHAS, e nao so o estorno
-- -----------------------------------------------------------------------------
-- `server/lib/financeMetrics.ts` le `plan_code` de TODOS os tipos de linha
-- (`charge`, `refund`, `adjustment`, `dispute`) para montar receita por plano.
-- Preencher so o estorno colocaria em pro_annual um -R$ 222,00 sem o +R$ 222,00
-- correspondente, ou seja, trocaria "plano nao atribuido" por "plano anual com
-- receita negativa". Seria um numero plausivel e errado, que e pior que o nulo
-- de hoje.
--
-- A JANELA DO SYNC, e por que ela nao ameaca mais este script.
-- `SYNC_FINANCE_WINDOW_DAYS` e 7 (server/lib/financeSyncWindow.ts:37), e o cron
-- `sync-finance` das 04h20 REESCREVE `plan_code` de tudo que ainda esta dentro
-- dela, inclusive por cima de um backfill. As duas linhas daqui sao de 17/08 e
-- 29/08, ou seja, ambas ja saidas da janela em 2026-09-05: o valor gravado por
-- este script fica.
--
-- ISSO MUDA SE O SCRIPT DEMORAR A SER REAPROVEITADO em algo mais recente. A
-- regra geral: linha com menos de 7 dias sera recalculada, e o backfill dela so
-- persiste se a COBRANCA-MAE tambem estiver correta, porque
-- `resolveOwnerFromParentCharge` (server/lib/stripeSync.ts:251) le o plano da
-- mae por `ownerOfChargeRow` (:332, com `.eq("type","charge")`) e o PRESERVA
-- mesmo recusando o `user_id` nulo. Por isso a cobranca vem primeiro nos blocos
-- abaixo: e a ordem que continua certa nos dois cenarios.


-- -----------------------------------------------------------------------------
-- (0) ANTES. ESPERADO: 2 linhas, ambas com plan_code NULL
-- -----------------------------------------------------------------------------
-- Se qualquer uma ja vier com plan_code preenchido, PARE: o retrato mudou entre
-- a medicao e a execucao.

select id, type, occurred_at, gross_cents, plan_code, user_id
from public.finance_transactions
where id in (
  '9267c43a-4130-472c-bb6e-388896e350fb',  -- charge  17/08, +22200
  'a814615f-a2db-48eb-9411-0c1542b47e6c'   -- refund  29/08, -22200
)
order by occurred_at;


-- -----------------------------------------------------------------------------
-- (1) A COBRANCA. AFETA: 1 linha.
-- -----------------------------------------------------------------------------
-- `where id = ...` por CHAVE PRIMARIA, e nao por valor ou por data: e a unica
-- forma de o comando nao poder alcancar uma linha que nao foi conferida no
-- bloco (0). O `and plan_code is null` torna o comando idempotente e impede
-- sobrescrever um valor que alguem tenha preenchido no meio tempo.

update public.finance_transactions
   set plan_code = 'pro_annual'
 where id = '9267c43a-4130-472c-bb6e-388896e350fb'
   and plan_code is null;


-- -----------------------------------------------------------------------------
-- (2) O ESTORNO. AFETA: 1 linha.
-- -----------------------------------------------------------------------------

update public.finance_transactions
   set plan_code = 'pro_annual'
 where id = 'a814615f-a2db-48eb-9411-0c1542b47e6c'
   and plan_code is null;


-- -----------------------------------------------------------------------------
-- (3) DEPOIS. ESPERADO: 2 linhas, ambas 'pro_annual', ambas com user_id NULL
-- -----------------------------------------------------------------------------

select id, type, occurred_at, gross_cents, plan_code, user_id
from public.finance_transactions
where id in (
  '9267c43a-4130-472c-bb6e-388896e350fb',
  'a814615f-a2db-48eb-9411-0c1542b47e6c'
)
order by occurred_at;


-- -----------------------------------------------------------------------------
-- (4) CONFERENCIA AMPLA. ESPERADO: exatamente 2 linhas, e NAO zero
-- -----------------------------------------------------------------------------
-- Afirma o TOTAL, e nao so as duas que este script conhece. Medido em
-- 2026-09-03 e de novo em 2026-09-05, ANTES de rodar qualquer coisa, existem
-- QUATRO linhas de cobranca ou estorno sem plano; duas sao as deste script e
-- duas NAO sao:
--
--   53831f1a-63b4-46d3-90af-2df4f50cfa0e  charge  2026-07-24  +9030
--   be142021-0140-4ad3-818b-bd46b1fa1dc2  charge  2026-08-21  +2990
--
-- ELAS FICAM DE FORA DE PROPOSITO, e nao por esquecimento. Para as duas linhas
-- deste script existe uma segunda evidencia independente do valor (a nota de
-- resolucao dizendo "pro_annual"); para estas duas nao existe nenhuma, e o valor
-- sozinho nao decide:
--
--   - 9030 nao corresponde a preco de tabela nenhum (29,90 / 129,00 / 222,00),
--     entao e uma cobranca com desconto, e desconto nao diz de qual plano.
--   - 2990 e o preco cheio do mensal, mas tambem e um valor que um anual ou
--     semestral com cupom poderia atingir. Preencher pelo valor seria a mesma
--     inferencia que o codigo de ingestao ja recusa fazer.
--
-- Cada uma precisa da propria investigacao (sessao de checkout, cupom aplicado,
-- e-mail do pagador na Stripe), que e trabalho a parte deste script.
--
-- Depois de rodar os blocos (1) e (2), esta consulta tem de devolver EXATAMENTE
-- essas duas. Se devolver tres, um dos UPDATE nao pegou. Se devolver uma, algo
-- alem deste script escreveu no meio tempo.

select id, type, occurred_at, gross_cents, stripe_charge_id
from public.finance_transactions
where plan_code is null
  and type in ('charge', 'refund')
order by occurred_at;
