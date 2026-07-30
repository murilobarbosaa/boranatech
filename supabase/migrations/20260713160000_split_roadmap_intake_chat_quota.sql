-- ============================================================================
-- NUNCA APLICADA. SUPERADA PELA 20260730170000. NAO APLICAR.
-- ============================================================================
--
-- Constatado em 2026-07-30 lendo o corpo vivo com pg_get_functiondef via
-- Management API: get_ai_usage_today em producao excluia 3 tools, nao 4. Esta
-- migration ficou 17 dias no repositorio sem chegar ao banco, e o guard
-- (pnpm check:migrations) ficou VERDE o tempo todo, porque ele verificava
-- funcao por NOME e o nome existia. Existencia nao implica conteudo.
--
-- Efeito enquanto durou: cada turno do chat de intake do Roadmap com IA
-- consumia uma vaga da cota GLOBAL de IA, apesar de o chat ter cota dedicada
-- propria. Cobranca dupla pelo mesmo uso. Medido: 273 linhas de
-- 'roadmap-intake-chat' contadas indevidamente na global.
--
-- POR QUE NAO APLICAR AGORA: a 20260730170000_ai_usage_excluded_tools.sql
-- carrega a MESMA mudanca por um mecanismo melhor (lista canonica em uma
-- funcao, lida pelas duas consumidoras, mais assercao comportamental no guard).
-- Aplicar esta primeiro criaria o corpo antigo so para a 170000 substituir em
-- seguida: trabalho inutil com janela de risco no meio. Aplicar esta DEPOIS da
-- 170000 seria pior ainda, porque REVERTERIA a unificacao.
--
-- O arquivo fica no historico por rastreabilidade: e ele que explica de onde
-- veio a quarta entrada da lista canonica. Registrado em
-- docs/debito-ledger-migrations.md.
--
-- O conteudo original segue abaixo, intocado.
-- ============================================================================

-- Separa a quota do chat de intake do roadmap com IA ('roadmap-intake-chat') da
-- quota global das ferramentas de IA, espelhando o mecanismo do agente
-- conversacional (20260628120000_split_agent_chat_quota.sql), dos turnos de
-- entrevista (20260707121000_split_interview_turn_quota.sql) e do chat de intake
-- do plano de carreira (20260713150000_split_career_plan_chat_quota.sql):
--
--  (a) get_ai_usage_today passa a excluir tambem 'roadmap-intake-chat', com
--      `is distinct from` para que linhas com tool nulo continuem contando como
--      antes. Os turnos do chat de intake do roadmap tem quota propria e NAO
--      podem consumir o orcamento de geracao: sem esta exclusao cada turno de
--      conversa gastaria uma unidade da quota global (a mesma de
--      'roadmap-generator' e das demais ferramentas Pro), o que anularia a
--      quota dedicada. A geracao do roadmap ('roadmap-generator') segue contando
--      na quota global, de proposito.
--
--  (b) a contagem diaria de 'roadmap-intake-chat' NAO precisa de funcao nova:
--      reusa a RPC generica get_ai_usage_today_by_tool(p_user_id, p_tool) criada
--      na migration do agente, chamada pelo server
--      (checkRoadmapIntakeChatDailyLimit) com p_tool = 'roadmap-intake-chat'.
--      Mesma janela (dia corrente em America/Sao_Paulo) e mesmo criterio
--      (status = 'success').
--
-- Exclusoes do contador global, na ordem em que foram adicionadas:
--   1. 'agent-chat'          (20260628120000)
--   2. 'interview-turn'      (20260707121000)
--   3. 'career-plan-chat'    (20260713150000)
--   4. 'roadmap-intake-chat' (esta migration)
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
    and tool is distinct from 'roadmap-intake-chat'
    and created_at >= date_trunc('day', now() at time zone 'America/Sao_Paulo');
$$;

-- Hardening reaplicado (mesmo criterio de 20260702130000).
revoke all on function public.get_ai_usage_today(uuid) from public, anon, authenticated;
grant execute on function public.get_ai_usage_today(uuid) to service_role;
