-- Ativacao de assinatura com exclusividade, numa transacao so.
--
-- RASCUNHO, NAO APLICAR AINDA. Nenhum codigo chama esta funcao neste commit; a
-- troca das duas escritas pela chamada dela e um lote separado. A ordem de
-- aplicacao pretendida e: esta funcao, depois o codigo que a usa, depois o
-- indice unico de 20260829120000. O nome deste arquivo ordena antes do indice
-- de proposito, para que a ordem no diretorio seja a ordem de aplicacao.
--
-- PROBLEMA. `onBoletoAsyncPaymentSucceeded` (server/providers/stripe.ts) ativa
-- uma renovacao de boleto em DUAS escritas separadas, sem transacao:
--
--   1. server/providers/stripe.ts:931  UPDATE ... SET status='active'
--                                      WHERE provider_subscription_id = <sessao>
--                                        AND status='pending'
--   2. server/providers/stripe.ts:965  UPDATE ... SET status='superseded'
--                                      WHERE user_id = <dono>
--                                        AND status IN ('active','trialing')
--                                        AND id <> <linha nova>
--
-- Entre (1) e (2) o usuario tem DUAS linhas ativas, por construcao, no caminho
-- feliz. Isso e o que hoje impede a criacao do indice unico parcial de
-- 20260829120000: com o indice no lugar, a escrita (1) levantaria 23505, o
-- handler lancaria, a compensacao apagaria o billing_event, a Stripe
-- reentregaria, encontraria o mesmo estado e falharia de novo. Laco permanente,
-- com uma renovacao JA PAGA sem conceder acesso.
--
-- Alem disso a escrita (2) e best-effort no codigo atual: se ela falhar, so
-- loga. Uma linha ativa orfa sobrevive, infla o MRR e dispara lembrete espurio.
--
-- SOLUCAO. Uma funcao. O corpo de uma funcao Postgres roda numa unica
-- transacao, entao supersede e ativacao passam a ser atomicos: ou os dois
-- acontecem, ou nenhum. E a ordem interna e SUPERSEDE PRIMEIRO, ATIVACAO
-- DEPOIS, que e a unica ordem que convive com o indice unico parcial: quando a
-- linha nova vira 'active', nenhuma outra do usuario ainda esta.
--
-- CONJUNTO ATIVO = ('active', 'trialing'). Nao e suposicao: e o conjunto que
-- concede acesso Pro, e cinco sitios independentes concordam com ele.
--
--   is_user_pro           20260716130100_add_influencer_to_is_user_pro.sql:28
--   isProStatus()         server/providers/stripe.ts:121
--   guard de checkout     server/providers/stripe.ts (guard 409 de duplicada)
--   ancora do boleto      server/providers/stripe.ts (renovacao)
--   aposentadoria         server/providers/stripe.ts (superseded)
--
-- 'past_due' fica de fora: is_user_pro nega past_due, e uma cobranca em
-- recuperacao ao lado de uma assinatura nova e estado real, nao defeito. O
-- predicado aqui e o MESMO do indice de 20260829120000, e os dois precisam
-- continuar iguais: se um mudar, o outro muda no mesmo commit.
--
-- IDEMPOTENTE, e isto e requisito e nao cortesia: a Stripe reentrega. Chamada
-- de novo com a linha ja 'active', a funcao devolve activated=false, nao
-- reescreve periodo e nao dispara efeito nenhum no chamador. A reentrega
-- CONVERGE em vez de entrar em laco, que e exatamente o que o indice sozinho
-- nao daria.
--
-- O supersede roda nos DOIS ramos de proposito (linha 'pending' e linha ja
-- 'active'). Isso da auto-cura: uma linha antiga que sobreviveu ao best-effort
-- do codigo atual e limpa na primeira reentrega, sem passo manual.
--
-- TRAVA POR USUARIO, nao por linha: `pg_advisory_xact_lock` no user_id, mesmo
-- padrao de `reserve_ai_usage_slot` (20260727150000). Um `FOR UPDATE` na linha
-- alvo nao serviria: o supersede toca OUTRAS linhas, e sao elas que precisam
-- estar estaveis durante a operacao. Duas pessoas diferentes nunca se bloqueiam;
-- a trava cai sozinha no fim da transacao.
--
-- PREFIXO out_ NOS NOMES DE SAIDA. `RETURNS TABLE` cria variaveis plpgsql com o
-- nome de cada coluna de saida, e `user_id`, `plan_id`, `affiliate_code` e
-- `coupon_code` sao TAMBEM nomes de coluna de public.subscriptions. Sem o
-- prefixo, cada referencia a essas colunas viraria "column reference is
-- ambiguous" em TEMPO DE EXECUCAO, que e o pior momento possivel para descobrir
-- isso numa funcao que mexe em acesso pago.
--
-- STATUS INESPERADO LANCA, e e paridade deliberada com o codigo atual, que ja
-- faz `throw` quando a linha do boleto nao esta nem 'pending' nem 'active'
-- (server/providers/stripe.ts, "Boleto pago nao ativou a assinatura"). Ativar
-- uma linha 'canceled' seria conceder acesso a partir de um estado que alguem
-- encerrou.
--
-- ADITIVA e ISENTA da janela destrutiva: cria funcao nova, nao altera nem
-- remove dado. Rollback e DROP FUNCTION.
--
-- Idempotente como migration (CREATE OR REPLACE): pode rodar mais de uma vez.

BEGIN;

CREATE OR REPLACE FUNCTION public.activate_subscription_exclusive(
  p_subscription_id uuid,
  p_user_id uuid,
  p_period_start timestamptz,
  p_period_end timestamptz,
  p_last_event_at timestamptz,
  p_raw_payload jsonb DEFAULT NULL
)
RETURNS TABLE (
  out_activated boolean,
  out_superseded_count integer,
  out_user_id uuid,
  out_plan_id uuid,
  out_affiliate_code text,
  out_coupon_code text
)
LANGUAGE plpgsql VOLATILE SECURITY DEFINER
SET search_path = 'pg_catalog', 'public'
AS $func$
DECLARE
  v_status text;
  v_superseded integer := 0;
  v_activated boolean := false;
BEGIN
  -- Serializa as ativacoes concorrentes DO MESMO usuario.
  PERFORM pg_advisory_xact_lock(hashtextextended(p_user_id::text, 0));

  -- A linha precisa existir E pertencer ao usuario. As duas condicoes juntas:
  -- um id valido de outra pessoa nao pode aposentar as assinaturas dela.
  SELECT s.status INTO v_status
  FROM public.subscriptions s
  WHERE s.id = p_subscription_id
    AND s.user_id = p_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION
      'assinatura % nao existe ou nao pertence ao usuario %',
      p_subscription_id, p_user_id
      USING ERRCODE = 'no_data_found';
  END IF;

  IF v_status NOT IN ('pending', 'active') THEN
    RAISE EXCEPTION
      'assinatura % esta em % e nao pode ser ativada',
      p_subscription_id, v_status
      USING ERRCODE = 'invalid_parameter_value';
  END IF;

  -- (1) SUPERSEDE PRIMEIRO. Roda tambem quando a linha alvo ja esta ativa: e o
  -- que limpa residuo deixado pelo best-effort do codigo antigo.
  UPDATE public.subscriptions
  SET status = 'superseded'
  WHERE subscriptions.user_id = p_user_id
    AND subscriptions.id <> p_subscription_id
    AND subscriptions.status IN ('active', 'trialing');
  GET DIAGNOSTICS v_superseded = ROW_COUNT;

  -- (2) ATIVACAO DEPOIS, e so quando havia o que ativar. Condicional em
  -- 'pending' pela mesma razao do UPDATE que ela substitui: reentrega nao soma
  -- periodo duas vezes.
  IF v_status = 'pending' THEN
    UPDATE public.subscriptions
    SET status = 'active',
        current_period_start = p_period_start,
        current_period_end = p_period_end,
        last_event_at = p_last_event_at,
        raw_provider_payload =
          COALESCE(p_raw_payload, subscriptions.raw_provider_payload)
    WHERE subscriptions.id = p_subscription_id
      AND subscriptions.status = 'pending';

    v_activated := true;
  END IF;

  RETURN QUERY
  SELECT
    v_activated,
    v_superseded,
    s.user_id,
    s.plan_id,
    s.affiliate_code,
    s.coupon_code
  FROM public.subscriptions s
  WHERE s.id = p_subscription_id;
END;
$func$;

-- Mesmo hardening das demais RPCs de escrita: so o service_role executa. O
-- backend fala por service role; anon e authenticated nao tem o que fazer aqui.
REVOKE ALL ON FUNCTION public.activate_subscription_exclusive(
  uuid, uuid, timestamptz, timestamptz, timestamptz, jsonb
) FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.activate_subscription_exclusive(
  uuid, uuid, timestamptz, timestamptz, timestamptz, jsonb
) TO service_role;

COMMIT;
