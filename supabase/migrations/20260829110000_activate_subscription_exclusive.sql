-- Ativacao de assinatura com exclusividade, numa transacao so.
--
-- Ordem de aplicacao: esta funcao, depois o codigo que a usa (Lote 1a), depois
-- o indice unico de 20260829120000. O nome deste arquivo ordena antes do indice
-- de proposito, para que a ordem no diretorio seja a ordem de aplicacao.
--
-- REVISAO DO ARQUITETO EM 29/08/2026, duas emendas sobre o rascunho original:
--   1. v_activated deixa de ser setado por intencao: GET DIAGNOSTICS no UPDATE
--      de ativacao, e zero linhas lanca serialization_failure (40001). O
--      rollback desfaz o supersede junto e a reentrega da Stripe converge
--      sobre o estado novo. Sucesso reportado sem escrita e a classe de defeito
--      que este projeto nao aceita.
--   2. Periodo nulo no ramo de ativacao lanca antes de qualquer escrita. Funcao
--      SECURITY DEFINER de acesso pago nao confia no chamador.
--
-- PROBLEMA. onBoletoAsyncPaymentSucceeded (server/providers/stripe.ts) ativa
-- uma renovacao de boleto em DUAS escritas separadas, sem transacao: primeiro
-- flip da linha nova para 'active', depois supersede das antigas. Entre as
-- duas, o usuario tem duas linhas ativas por construcao, o que impede o indice
-- unico parcial de 20260829120000 e, com ele aplicado, viraria laco permanente
-- de reentrega com renovacao JA PAGA sem conceder acesso. Alem disso o
-- supersede atual e best-effort (erro so loga): linha ativa orfa sobrevive,
-- infla MRR e dispara lembrete espurio.
--
-- SOLUCAO. Uma funcao: o corpo roda numa unica transacao, supersede e ativacao
-- sao atomicos, e a ordem interna e SUPERSEDE PRIMEIRO, ATIVACAO DEPOIS, a
-- unica que convive com o indice.
--
-- CONJUNTO ATIVO = ('active', 'trialing'). E o conjunto que concede acesso Pro;
-- sitios que concordam: is_user_pro
-- (20260716130100_add_influencer_to_is_user_pro.sql:28), isProStatus()
-- (server/providers/stripe.ts:121), guard de checkout, ancora do boleto,
-- aposentadoria. 'past_due' fica de fora: is_user_pro nega past_due, e cobranca
-- em recuperacao ao lado de assinatura nova e estado real, nao defeito. O
-- predicado aqui e o MESMO do indice de 20260829120000; se um mudar, o outro
-- muda no mesmo commit.
--
-- IDEMPOTENTE, requisito e nao cortesia: a Stripe reentrega. Chamada de novo
-- com a linha ja 'active', devolve activated=false, nao reescreve periodo, nao
-- dispara efeito no chamador. O supersede roda nos dois ramos de proposito
-- (auto-cura de residuo do best-effort antigo).
--
-- TRAVA POR USUARIO via pg_advisory_xact_lock no user_id, padrao de
-- reserve_ai_usage_slot (20260727150000). FOR UPDATE na linha alvo nao
-- serviria: o supersede toca OUTRAS linhas. A trava cai no fim da transacao.
--
-- PREFIXO out_ NOS NOMES DE SAIDA: RETURNS TABLE cria variaveis homonimas de
-- colunas de public.subscriptions (user_id, plan_id, affiliate_code,
-- coupon_code); sem o prefixo, "column reference is ambiguous" em runtime.
--
-- STATUS INESPERADO LANCA, paridade com o codigo atual ("Boleto pago nao
-- ativou a assinatura"): ativar linha 'canceled' seria conceder acesso a
-- partir de estado que alguem encerrou.
--
-- ADITIVA: cria funcao, nao altera nem remove dado. Rollback e DROP FUNCTION.
-- Idempotente como migration (CREATE OR REPLACE).

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
  v_rows integer := 0;
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

  -- Emenda 2: periodo nulo nao ativa. Antes de qualquer escrita.
  IF v_status = 'pending'
     AND (p_period_start IS NULL OR p_period_end IS NULL) THEN
    RAISE EXCEPTION
      'ativacao da assinatura % exige periodo completo',
      p_subscription_id
      USING ERRCODE = 'null_value_not_allowed';
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
    GET DIAGNOSTICS v_rows = ROW_COUNT;

    -- Emenda 1: sucesso so com escrita. Zero linhas significa mutacao
    -- concorrente fora da trava; lancar desfaz o supersede no rollback e deixa
    -- a reentrega convergir sobre o estado novo.
    IF v_rows = 0 THEN
      RAISE EXCEPTION
        'assinatura % mudou de estado durante a ativacao',
        p_subscription_id
        USING ERRCODE = 'serialization_failure';
    END IF;

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
