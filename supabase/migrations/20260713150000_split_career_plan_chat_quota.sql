-- Separa a quota do chat de intake do plano de carreira ('career-plan-chat') da
-- quota global das ferramentas de IA, espelhando o mecanismo do agente
-- conversacional (20260628120000_split_agent_chat_quota.sql) e dos turnos de
-- entrevista (20260707121000_split_interview_turn_quota.sql):
--
--  (a) get_ai_usage_today passa a excluir tambem 'career-plan-chat' (alem de
--      'agent-chat' e 'interview-turn'), com `is distinct from` para que linhas
--      com tool nulo continuem contando como antes. Os turnos do chat de intake
--      NAO devem inflar a quota global das ferramentas Pro do usuario. A geracao
--      do plano ('career-plan') segue contando na quota global, de proposito.
--
--  (b) a contagem diaria de 'career-plan-chat' NAO precisa de funcao nova: reusa
--      a RPC generica get_ai_usage_today_by_tool(p_user_id, p_tool) criada na
--      migration do agente, chamada pelo server (checkCareerPlanChatDailyLimit)
--      com p_tool = 'career-plan-chat'. Mesma janela (dia corrente em
--      America/Sao_Paulo) e mesmo criterio (status = 'success').
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
    and tool is distinct from 'career-plan-chat'
    and created_at >= date_trunc('day', now() at time zone 'America/Sao_Paulo');
$$;

-- Hardening reaplicado (mesmo criterio de 20260702130000).
revoke all on function public.get_ai_usage_today(uuid) from public, anon, authenticated;
grant execute on function public.get_ai_usage_today(uuid) to service_role;
