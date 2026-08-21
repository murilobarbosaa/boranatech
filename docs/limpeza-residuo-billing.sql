-- =============================================================================
-- LIMPEZA DE RESÍDUO EM subscription_cancellations
--
-- NÃO EXECUTADO. Contagens medidas contra produção em 2026-07-31.
--
-- Arquivo SEPARADO dos backfills (docs/backfill-donos-finance-transactions.sql,
-- docs/backfill-payment-method-subscriptions.sql) de propósito: aqueles são
-- UPDATE idempotente e reexecutável; este é DELETE de linha de auditoria
-- financeira, que não tem desfazer nem reexecução. Misturar os dois num arquivo
-- só convida a rodar tudo de uma vez.
--
-- JANELA: DELETE remove dado existente, então vale a janela destrutiva do
-- CLAUDE.md (05h-09h de Brasília) com o backup da madrugada confirmado
-- COMPLETED. Sem backup válido a janela não protege nada.
--
-- UM STATEMENT POR VEZ. No SQL Editor do Supabase cada statement roda em sessão
-- diferente; rode o SELECT, confira o número contra o esperado escrito no
-- comentário, e só então rode o DELETE.
-- =============================================================================


-- -----------------------------------------------------------------------------
-- O QUE A MEDIÇÃO ENCONTROU
-- -----------------------------------------------------------------------------
-- A varredura por formato de id (Asaas: `sub_/pay_/cus_` + minúsculas curtas;
-- teste: qualquer coisa com `_test_`) cobriu as seis tabelas de billing:
--
--   subscriptions              63 linhas   limpo
--   subscription_cancellations 13 linhas   2 Asaas + 1 teste
--   billing_events            225 linhas   limpo
--   finance_transactions       64 linhas   limpo
--   admin_refunds               1 linha    limpo
--   billing_orphan_payments     0 linhas   limpo
--
-- Também conferido: `select count(*) from subscriptions where provider='asaas'`
-- devolve 0. O resíduo está SÓ em subscription_cancellations.
--
-- E as três órfãs NÃO são a mesma coisa. É o motivo de só uma ser apagada aqui.


-- -----------------------------------------------------------------------------
-- (1) CONFERÊNCIA — rode ANTES, e leia o resultado                ESPERADO: 3
-- -----------------------------------------------------------------------------
-- Órfã = linha de cancelamento cujo `provider_subscription_id` não existe mais
-- em `subscriptions`. As três devem aparecer, e nenhuma outra.

select c.id,
       c.provider_subscription_id,
       c.status,
       c.reason_code,
       c.canceled_at,
       c.user_id,
       exists (
         select 1 from public.subscriptions s where s.user_id = c.user_id
       ) as dono_ainda_e_cliente
  from public.subscription_cancellations c
 where not exists (
         select 1
           from public.subscriptions s
          where s.provider_subscription_id = c.provider_subscription_id
       )
 order by c.canceled_at;

-- Saída esperada (3 linhas):
--
--   sub_d658ndm843tcl3lw   reverted   expensive  2026-06-28   dono_ainda_e_cliente = true
--   sub_d658ndm843tcl3lw   completed  unused     2026-06-28   dono_ainda_e_cliente = true
--   cs_test_a1Wh7H2K...    scheduled  paused     2026-07-16   dono_ainda_e_cliente = false
--
-- Se vier número diferente de 3, PARE: apareceu resíduo novo, e o DELETE abaixo
-- foi escrito para um conjunto que mudou.


-- -----------------------------------------------------------------------------
-- (2) DELETE — só a linha de TESTE                      AFETA: exatamente 1
-- -----------------------------------------------------------------------------
-- `cs_test_...` é um Checkout Session em MODO DE TESTE da Stripe. O
-- `user_id` (2767db54-...) não tem NENHUMA assinatura em `subscriptions`, nem
-- hoje nem nunca. É resíduo que jamais representou cliente, e é o único dos três
-- que se encaixa nesse critério.
--
-- Ela não é inofensiva: `GET /admin/cancellation-reasons` agrega por
-- `reason_code` filtrando `status in ('scheduled','completed')` SEM excluir
-- órfãs, então esta linha entra hoje na aba Retenção como um cancelamento
-- `paused` de verdade. Apagá-la corrige uma métrica de produto, não só um
-- contador de órfãs.
--
-- Filtro por PREFIXO de teste, não pelo id inteiro: um id de sessão tem 66
-- caracteres e transcrevê-lo à mão é como o comando erra. `like 'cs_test_%'`
-- casa exatamente a classe que se quer remover, e o SELECT acima já provou que
-- ela tem uma linha só.

delete from public.subscription_cancellations
 where provider_subscription_id like 'cs\_test\_%';

-- Confira o "DELETE 1" na resposta. Diferente de 1, algo mudou desde a medição.


-- -----------------------------------------------------------------------------
-- (3) AS DUAS LINHAS ASAAS: **NÃO APAGAR**
-- -----------------------------------------------------------------------------
-- Elas parecem resíduo pelo formato do id, e não são.
--
-- O `user_id` c1a7198b-... é CLIENTE HOJE: tem assinatura Stripe ativa
-- (`sub_1TssikQ6lxIhx7VyDRrh1hPR`) criada em 2026-07-13. As duas linhas
-- registram que essa pessoa cancelou a assinatura Asaas em 28/06 (motivos
-- `expensive` e `unused`), uma delas foi revertida, e duas semanas depois ela
-- voltou pela Stripe.
--
-- Ou seja: é o histórico de churn-and-return de um cliente atual, e ainda por
-- cima o único que a base tem. O critério declarado para apagar era "resíduo que
-- nunca representou cliente", e estas representaram — representam.
--
-- O que a assinatura antiga ter sumido de `subscriptions` significa é que a
-- migração de gateway não trouxe as linhas do Asaas (0 linhas com
-- provider='asaas'). A ausência é da assinatura, não do cancelamento.
--
-- NÃO PRECISAM DE COLUNA DE ARQUIVO. O código já as trata como o que são:
-- `getChurnSnapshot` (server/lib/billingMetrics.ts) as exclui do numerador,
-- porque o denominador vem de `subscriptions` e misturar populações daria uma
-- razão sem significado, e as devolve contadas em `orphanCancellations`. Depois
-- do DELETE de (2), esse campo passa a valer 2, e 2 é a resposta certa para
-- "quantos cancelamentos são do gateway anterior".
--
-- Uma coluna `archived_at` seria mecanismo novo para um estado que o código já
-- representa, e o CLAUDE.md pede o contrário: não introduzir camada que a tarefa
-- não pediu.
--
-- PENDÊNCIA REAL, essa sim: a linha `completed` com reason_code `unused` ENTRA
-- hoje no agregado da aba Retenção (mesmo caminho descrito em (2)). Ela é de um
-- cancelamento verdadeiro, então contar não é errado; mas contar um
-- cancelamento do gateway anterior junto com os da Stripe, sem distinção, é uma
-- decisão de produto que ninguém tomou. Fica registrado para você decidir, não
-- resolvido aqui.


-- -----------------------------------------------------------------------------
-- (4) CONFERÊNCIA FINAL — rode DEPOIS                             ESPERADO: 2
-- -----------------------------------------------------------------------------
-- Devem sobrar as duas linhas Asaas, e nenhuma com `_test_`.

select count(*) filter (where provider_subscription_id like '%\_test\_%')::int
         as ainda_ha_teste,          -- esperado 0
       count(*)::int as orfas_restantes  -- esperado 2
  from public.subscription_cancellations c
 where not exists (
         select 1
           from public.subscriptions s
          where s.provider_subscription_id = c.provider_subscription_id
       );

-- O painel deve passar a mostrar `orphanCancellations = 2` e um `paused` a menos
-- na aba Retenção. Se qualquer um dos dois não bater, investigue antes de
-- concluir que deu certo.
