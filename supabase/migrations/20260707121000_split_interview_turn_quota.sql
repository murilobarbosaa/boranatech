-- Separa a quota de turnos de entrevista ('interview-turn') da quota global das
-- ferramentas de IA, espelhando o mecanismo do agente conversacional (migration
-- 20260628120000_split_agent_chat_quota.sql):
--
--  (a) get_ai_usage_today passa a excluir tambem 'interview-turn' (alem de
--      'agent-chat'), com `is distinct from` para que linhas com tool nulo
--      continuem contando como antes. A criacao de sessao ('interview-session')
--      segue contando na quota global, de proposito: e 1 unidade global por
--      sessao, como as demais ferramentas.
--
--  (b) a contagem diaria de 'interview-turn' NAO precisa de funcao nova: reusa
--      a RPC generica get_ai_usage_today_by_tool(p_user_id, p_tool) criada na
--      migration do agente, chamada pelo server com p_tool = 'interview-turn'.
--      Mesma janela (dia corrente em America/Sao_Paulo) e mesmo criterio
--      (status = 'success').
--
-- CREATE OR REPLACE reseta o proconfig e nao reaplica sozinho o hardening de
-- 20260702130000_security_hardening_rpc_grants.sql, entao o search_path fixo e
-- os grants restritos ao service_role sao reaplicados aqui.

CREATE OR REPLACE FUNCTION "public"."get_ai_usage_today"("p_user_id" "uuid") RETURNS integer
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" = 'pg_catalog', 'public'
    AS $$
  select count(*)::integer
  from public.ai_usage_logs
  where user_id = p_user_id
    and status = 'success'
    and tool is distinct from 'agent-chat'
    and tool is distinct from 'interview-turn'
    and created_at >= date_trunc('day', now() at time zone 'America/Sao_Paulo');
$$;

-- Hardening reaplicado (mesmo criterio de 20260702130000).
revoke all on function public.get_ai_usage_today(uuid) from public, anon, authenticated;
grant execute on function public.get_ai_usage_today(uuid) to service_role;
