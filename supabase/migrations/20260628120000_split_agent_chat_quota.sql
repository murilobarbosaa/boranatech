-- Separa a quota do agente conversacional da quota das ferramentas de IA.
--
-- Contexto: o agente loga em ai_usage_logs sob tool = 'agent-chat'. O contador
-- legado get_ai_usage_today soma TODAS as tools do dia, entao essas linhas
-- inflariam a quota das ferramentas Pro do usuario (free e so 5/dia). A correcao
-- tem duas partes:
--  (a) excluir 'agent-chat' da contagem de get_ai_usage_today, usando
--      `is distinct from` (nao `<>`) para que linhas com tool nulo continuem
--      contando como antes.
--  (b) criar get_ai_usage_today_by_tool, contador dedicado por ferramenta, que da
--      ao agente um teto proprio (chamado por checkAgentDailyLimit com
--      p_tool = 'agent-chat').
--
-- Corpo de get_ai_usage_today identico ao original (migration
-- 20260517231011_remote_schema.sql), exceto pela unica linha nova no where.

CREATE OR REPLACE FUNCTION "public"."get_ai_usage_today"("p_user_id" "uuid") RETURNS integer
    LANGUAGE "sql" STABLE SECURITY DEFINER
    AS $$
  select count(*)::integer
  from public.ai_usage_logs
  where user_id = p_user_id
    and status = 'success'
    and tool is distinct from 'agent-chat'
    and created_at >= date_trunc('day', now() at time zone 'America/Sao_Paulo');
$$;

CREATE OR REPLACE FUNCTION "public"."get_ai_usage_today_by_tool"("p_user_id" "uuid", "p_tool" "text") RETURNS integer
    LANGUAGE "sql" STABLE SECURITY DEFINER
    AS $$
  select count(*)::integer
  from public.ai_usage_logs
  where user_id = p_user_id
    and tool = p_tool
    and status = 'success'
    and created_at >= date_trunc('day', now() at time zone 'America/Sao_Paulo');
$$;

ALTER FUNCTION "public"."get_ai_usage_today_by_tool"("p_user_id" "uuid", "p_tool" "text") OWNER TO "postgres";

-- GRANTs espelhando exatamente os da get_ai_usage_today original (anon,
-- authenticated, service_role), para as duas funcoes.
GRANT ALL ON FUNCTION "public"."get_ai_usage_today"("p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_ai_usage_today"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_ai_usage_today"("p_user_id" "uuid") TO "service_role";

GRANT ALL ON FUNCTION "public"."get_ai_usage_today_by_tool"("p_user_id" "uuid", "p_tool" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_ai_usage_today_by_tool"("p_user_id" "uuid", "p_tool" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_ai_usage_today_by_tool"("p_user_id" "uuid", "p_tool" "text") TO "service_role";
