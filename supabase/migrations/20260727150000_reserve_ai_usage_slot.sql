-- Reserva ATOMICA de vaga no limite diario de IA.
--
-- PROBLEMA (achado P0 da rodada 1 da auditoria). O limite era TOCTOU:
-- `checkAiDailyLimit` contava as linhas do dia ANTES da chamada da OpenAI, e a
-- rota inseria a linha em `ai_usage_logs` DEPOIS. Entre a leitura e a escrita
-- cabe qualquer numero de requisicoes do mesmo usuario: todas leem o mesmo
-- contador, todas veem vaga, todas passam. Com limite 5, dez requisicoes
-- paralelas produziam dez chamadas pagas.
--
-- SOLUCAO. Contar e inserir na MESMA transacao, serializada por advisory lock
-- por usuario. A rota deixa de inserir e passa a CONFIRMAR (update) a linha que
-- esta funcao ja criou, ou a devolver a vaga (delete) quando a chamada falha.
--
-- Status novo: 'reserved'. Ele conta no limite do dia (a vaga esta ocupada
-- enquanto a chamada acontece) mas nao conta como uso bem-sucedido em nenhum
-- painel, porque os paineis filtram por 'success'.
--
-- ADITIVA: cria funcao, nao altera nem remove dado. Isenta da janela de
-- migration destrutiva (CLAUDE.md).
--
-- Idempotente: pode rodar mais de uma vez sem efeito colateral.

CREATE OR REPLACE FUNCTION "public"."reserve_ai_usage_slot"(
  "p_user_id" "uuid",
  "p_tool" "text",
  "p_limit" integer
)
RETURNS TABLE ("allowed" boolean, "usage_count" integer, "reservation_id" "uuid")
LANGUAGE "plpgsql" VOLATILE SECURITY DEFINER
SET "search_path" = 'pg_catalog', 'public'
AS $$
DECLARE
  v_count integer;
  v_id uuid;
BEGIN
  -- Serializa as concorrentes DO MESMO usuario. Duas pessoas diferentes nao se
  -- bloqueiam; a trava cai sozinha no fim da transacao.
  PERFORM pg_advisory_xact_lock(hashtextextended(p_user_id::text, 0));

  -- Mesmo criterio de get_ai_usage_today (mesmas exclusoes de tool, mesmo
  -- fuso), mais as vagas reservadas em voo.
  SELECT count(*)::integer INTO v_count
  FROM public.ai_usage_logs
  WHERE user_id = p_user_id
    AND status IN ('success', 'reserved')
    AND tool IS DISTINCT FROM 'agent-chat'
    AND tool IS DISTINCT FROM 'interview-turn'
    AND tool IS DISTINCT FROM 'career-plan-chat'
    AND created_at >= date_trunc('day', now() AT TIME ZONE 'America/Sao_Paulo')
    -- Reserva orfa (processo morreu entre reservar e confirmar) expira em 10
    -- minutos em vez de ocupar vaga ate a virada do dia. Auto-cura: sem isso,
    -- um crash custaria uma chamada da cota da pessoa por horas.
    AND (status <> 'reserved' OR created_at > now() - interval '10 minutes');

  IF v_count >= p_limit THEN
    RETURN QUERY SELECT false, v_count, NULL::uuid;
    RETURN;
  END IF;

  INSERT INTO public.ai_usage_logs (user_id, tool, status)
  VALUES (p_user_id, p_tool, 'reserved')
  RETURNING id INTO v_id;

  RETURN QUERY SELECT true, v_count + 1, v_id;
END;
$$;

-- Mesmo hardening das outras RPCs de uso: so o service_role executa.
REVOKE ALL ON FUNCTION public.reserve_ai_usage_slot(uuid, text, integer)
  FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.reserve_ai_usage_slot(uuid, text, integer)
  TO service_role;
