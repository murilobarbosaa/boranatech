-- Lista CANONICA de tools excluidas da cota global de IA, em UMA funcao.
--
-- PROBLEMA. A lista de exclusoes existia DUPLICADA em duas funcoes, mantida a
-- mao nas duas:
--
--   get_ai_usage_today      (contador do dia)
--   reserve_ai_usage_slot   (reserva atomica de vaga)
--
-- Duas listas mantidas a mao divergem, e divergiram. Pior: divergiram de um
-- jeito que nenhum instrumento acusou. A migration
-- 20260713160000_split_roadmap_intake_chat_quota.sql acrescentou
-- 'roadmap-intake-chat' a lista de get_ai_usage_today, mas **nunca foi aplicada
-- em producao** (verificado em 2026-07-30 com pg_get_functiondef: o corpo vivo
-- tinha 3 exclusoes, nao 4). E a 20260727150000_reserve_ai_usage_slot.sql
-- copiou a lista de 3 elementos afirmando no comentario ser "mesmo criterio de
-- get_ai_usage_today", que ja era falso no repositorio.
--
-- Efeito para quem usa o produto: cada turno de conversa do chat de intake do
-- Roadmap com IA consumia UMA vaga da cota global diaria (50 para Pro), apesar
-- de o chat ter cota dedicada propria (get_ai_usage_today_by_tool). Uma conversa
-- de 20 turnos comia 40% da cota de IA do dia da pessoa. Cobranca dupla pelo
-- mesmo uso.
--
-- Por que o guard nao viu: scripts/checkMigrationsApplied.mts verifica funcao
-- por NOME, via enumeracao do OpenAPI do PostgREST. get_ai_usage_today existia,
-- entao o guard ficava verde. Corpo de funcao nao era verificado por nada. A
-- contramedida vai junto desta migration: ai_usage_excluded_tools() e chamavel
-- por RPC e o guard passa a AFIRMAR O CONTEUDO dela (assercao comportamental),
-- nao a existencia. Ver a secao "Asseercoes comportamentais" naquele script.
--
-- SOLUCAO. Uma funcao IMMUTABLE devolve a lista; as duas consumidoras chamam
-- essa funcao. Depois disto, divergir e estruturalmente impossivel: nao existem
-- mais duas listas.
--
-- ADITIVA: cria uma funcao e substitui o CORPO de duas existentes. Nao altera
-- nem remove dado. Isenta da janela de migration destrutiva (CLAUDE.md).
--
-- EFEITO RETROATIVO, deliberado: as duas consumidoras sao calculadas na hora da
-- chamada sobre as linhas que ja existem, entao quem gastou cota global com
-- turnos de chat hoje recupera essas vagas assim que esta migration roda. Nenhum
-- dado e reescrito; reverter e reaplicar a definicao anterior.
--
-- Idempotente: pode rodar mais de uma vez sem efeito colateral.

-- LISTA CANONICA. Cada entrada aqui tem cota DEDICADA propria e por isso nao
-- pode consumir tambem a global. Na ordem em que foram separadas:
--   1. 'agent-chat'          (20260628120000)
--   2. 'interview-turn'      (20260707121000)
--   3. 'career-plan-chat'    (20260713150000)
--   4. 'roadmap-intake-chat' (20260713160000, nunca aplicada; entra aqui)
--
-- NAO incluir tool sem cota dedicada: sair da global sem ter teto proprio e uso
-- de IA sem teto nenhum.
CREATE OR REPLACE FUNCTION "public"."ai_usage_excluded_tools"()
RETURNS "text"[]
LANGUAGE "sql" IMMUTABLE
SET "search_path" = 'pg_catalog', 'public'
AS $$
  SELECT ARRAY[
    'agent-chat',
    'interview-turn',
    'career-plan-chat',
    'roadmap-intake-chat'
  ]::text[];
$$;

-- Contador do dia, agora consumindo a lista canonica.
--
-- ATENCAO ao NULL: a versao anterior usava uma cadeia de `tool is distinct from`,
-- que faz linha com tool NULO **contar** (NULL e distinto de qualquer literal).
-- `not (tool = any(...))` NAO preserva isso (daria NULL, e a linha sairia da
-- contagem). Por isso o predicado e `tool is null or tool <> all(...)`, que e
-- equivalente termo a termo a cadeia antiga.
CREATE OR REPLACE FUNCTION "public"."get_ai_usage_today"("p_user_id" "uuid") RETURNS integer
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" = 'pg_catalog', 'public'
    AS $$
  select count(*)::integer
  from public.ai_usage_logs
  where user_id = p_user_id
    and status = 'success'
    and (tool is null or tool <> all(public.ai_usage_excluded_tools()))
    and created_at >= date_trunc('day', now() at time zone 'America/Sao_Paulo');
$$;

-- Reserva atomica, agora consumindo a MESMA lista. O resto do corpo (advisory
-- lock por usuario, expiracao de reserva orfa em 10 minutos, insert da vaga)
-- fica identico a 20260727150000.
CREATE OR REPLACE FUNCTION "public"."reserve_ai_usage_slot"(
  "p_user_id" "uuid",
  "p_tool" "text",
  "p_limit" integer
)
RETURNS TABLE("allowed" boolean, "usage_count" integer, "reservation_id" "uuid")
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

  -- Mesmo criterio de get_ai_usage_today, agora de verdade: as duas leem a
  -- MESMA funcao. Mais as vagas reservadas em voo.
  SELECT count(*)::integer INTO v_count
  FROM public.ai_usage_logs
  WHERE user_id = p_user_id
    AND status IN ('success', 'reserved')
    AND (tool IS NULL OR tool <> ALL(public.ai_usage_excluded_tools()))
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

-- Hardening. CREATE OR REPLACE reseta os grants, entao os tres sao reaplicados
-- aqui (mesmo criterio de 20260702130000_security_hardening_rpc_grants.sql).
--
-- ai_usage_excluded_tools tambem fica so no service_role: e essa a chave com que
-- scripts/checkMigrationsApplied.mts fala com o PostgREST, e nao ha motivo para
-- ampliar a superficie alem do necessario.
REVOKE ALL ON FUNCTION public.ai_usage_excluded_tools()
  FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.ai_usage_excluded_tools() TO service_role;

REVOKE ALL ON FUNCTION public.get_ai_usage_today(uuid)
  FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_ai_usage_today(uuid) TO service_role;

REVOKE ALL ON FUNCTION public.reserve_ai_usage_slot(uuid, text, integer)
  FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.reserve_ai_usage_slot(uuid, text, integer)
  TO service_role;
