-- =============================================================================
-- BACKFILL: public.subscriptions.payment_method
--
-- NÃO EXECUTADO. Contagens medidas contra produção em 2026-07-30.
--
-- ARQUIVO SEPARADO de docs/backfill-donos-finance-transactions.sql, e o motivo
-- não é organização: aquele arquivo tem uma cabeça própria ("donos de linhas em
-- finance_transactions"), três blocos que se conferem juntos e uma consulta
-- final que soma os três. Este backfill é de outra tabela, outra coluna e outra
-- pergunta, e enfiá-lo lá tornaria a conferência final daquele arquivo mentirosa
-- (ela afirma um estado de finance_transactions, não de subscriptions). Um
-- arquivo por asserção.
--
-- CONTEXTO: `payment_method` nunca foi escrito no caminho de cartão. Os dois
-- únicos writes gravavam o literal 'boleto' (server/providers/stripe.ts), então
-- 54 das 59 linhas ficaram nulas e o modal mostrava "Não informado" para todo
-- assinante de cartão. A escrita já foi corrigida (patchDeMeioDePagamento em
-- server/lib/paymentMethod.ts), então linha NOVA resolve sozinha. Isto é para as
-- 54 já gravadas.
--
-- O QUE ESTE BACKFILL NÃO FAZ: deduzir. Não existe aqui nenhum "não é boleto,
-- logo é cartão". Cada linha é resolvida a partir do que a PRÓPRIA Stripe
-- declarou no evento guardado em `raw_provider_payload`, e o que não estiver
-- declarado fica NULO. Valor inventado é pior que ausência, porque no dia
-- seguinte ninguém distingue um do outro.
--
-- JANELA: é UPDATE de dado existente, então vale a janela destrutiva do
-- CLAUDE.md (05h-09h de Brasília, com backup COMPLETED confirmado).
--
-- IDEMPOTENTE: os dois blocos filtram por `payment_method is null` e ATRIBUEM
-- (SET = valor), nunca incrementam. Rodar duas vezes não muda nada na segunda.
--
-- ATENÇÃO no SQL Editor do Supabase: cada statement roda em sessão diferente.
-- Rode um bloco por vez e confira a contagem antes de seguir.
-- =============================================================================


-- -----------------------------------------------------------------------------
-- (A) Pelo payment_method_types da CHECKOUT SESSION           AFETA HOJE: 31
-- -----------------------------------------------------------------------------
-- Payload de `checkout.session.completed`. `payment_method_types` é a lista de
-- meios que aquele checkout aceitava. Com UM elemento a leitura é conclusiva:
-- só havia um meio possível.
--
-- O `array_length = 1` não é zelo: 1 linha da base tem ['card','boleto'], e nela
-- a lista diz o que foi OFERECIDO, não o que foi USADO. Essa fica nula.
--
-- O `in ('card','pix','boleto')` casa com o CHECK da coluna (migration
-- 20260714160000). Medido: 0 linhas trazem valor fora desse conjunto, mas o
-- filtro fica porque a Stripe tem dezenas de outros tipos e um deles chegando
-- aqui derrubaria o UPDATE inteiro.
--
-- Conferir antes de rodar (espera-se 31):
--   select count(*) from public.subscriptions
--    where payment_method is null
--      and raw_provider_payload->'data'->'object'->'payment_method_types' is not null
--      and jsonb_array_length(raw_provider_payload->'data'->'object'->'payment_method_types') = 1
--      and raw_provider_payload->'data'->'object'->'payment_method_types'->>0
--          in ('card','pix','boleto');

update public.subscriptions
   set payment_method =
         raw_provider_payload->'data'->'object'->'payment_method_types'->>0
 where payment_method is null
   and jsonb_typeof(raw_provider_payload->'data'->'object'->'payment_method_types')
       = 'array'
   and jsonb_array_length(
         raw_provider_payload->'data'->'object'->'payment_method_types'
       ) = 1
   and raw_provider_payload->'data'->'object'->'payment_method_types'->>0
       in ('card', 'pix', 'boleto');


-- -----------------------------------------------------------------------------
-- (B) Pelo payment_settings da SUBSCRIPTION                   AFETA HOJE: 17
-- -----------------------------------------------------------------------------
-- Payload de `customer.subscription.updated` (9) e `invoice.paid` (13): esses
-- eventos não trazem `payment_method_types` no topo, mas trazem
-- `payment_settings.payment_method_types`, que é a configuração de meios da
-- assinatura. Mesma regra de um elemento só.
--
-- Rodar DEPOIS do bloco A: 5 das 22 linhas desta classe já são resolvidas lá
-- (o payload mais recente venceu), e o filtro `payment_method is null` faz o
-- bloco B pegar só o que sobrou. Por isso 17 e não 22.
--
-- Conferir antes de rodar (espera-se 17, DEPOIS do bloco A):
--   select count(*) from public.subscriptions
--    where payment_method is null
--      and jsonb_typeof(raw_provider_payload->'data'->'object'->'payment_settings'->'payment_method_types') = 'array'
--      and jsonb_array_length(raw_provider_payload->'data'->'object'->'payment_settings'->'payment_method_types') = 1;

update public.subscriptions
   set payment_method =
         raw_provider_payload->'data'->'object'->'payment_settings'
           ->'payment_method_types'->>0
 where payment_method is null
   and jsonb_typeof(
         raw_provider_payload->'data'->'object'->'payment_settings'
           ->'payment_method_types'
       ) = 'array'
   and jsonb_array_length(
         raw_provider_payload->'data'->'object'->'payment_settings'
           ->'payment_method_types'
       ) = 1
   and raw_provider_payload->'data'->'object'->'payment_settings'
         ->'payment_method_types'->>0 in ('card', 'pix', 'boleto');


-- -----------------------------------------------------------------------------
-- O QUE FICA NULO, E POR QUÊ                                  6 LINHAS
-- -----------------------------------------------------------------------------
--   1 linha  payment_method_types = ['card','boleto'] (ambígua: dois meios
--            oferecidos, e o payload não diz por qual a pessoa pagou).
--   5 linhas nenhuma das duas fontes presente no payload guardado.
--
-- Elas ficam nulas de propósito. Para resolvê-las seria preciso consultar a
-- Stripe linha a linha (expandir o PaymentIntent ou o Charge e ler
-- payment_method_details.type), o que é rede, chave de produção e 6 chamadas
-- para um campo informativo. Se algum dia valer a pena, o caminho é esse; até
-- lá, "Não informado" é a resposta correta, porque é o que sabemos.
--
-- CONFERÊNCIA FINAL (rodar depois dos dois blocos):
--   select payment_method, count(*)
--     from public.subscriptions
--    group by payment_method
--    order by 2 desc;
--
-- Esperado: card 48, boleto 5, (null) 6.
