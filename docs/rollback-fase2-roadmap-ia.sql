-- ROLLBACK da Fase 2 do Roadmap com IA (migrations 20260730170000 e 20260730180000).
--
-- QUANDO USAR. Só se, depois de aplicar as migrations da Fase 2, for preciso
-- devolver o banco ao estado anterior. Não é parte do deploy: é o desfazer dele.
--
-- Este arquivo NÃO é uma migration e NÃO pode morar em supabase/migrations/. O
-- guard (scripts/checkMigrationsApplied.mts) lê aquele diretório e monta dali o
-- conjunto DECLARADO de tabelas e funções; um `drop function` lá dentro
-- removeria ai_usage_excluded_tools do conjunto declarado e quebraria a asserção
-- comportamental do Q1.a. Fica em docs/, no mesmo lugar de
-- docs/backfill-payment-method-subscriptions.sql.
--
-- OS CORPOS ABAIXO NÃO FORAM DIGITADOS. Foram capturados de PRODUÇÃO em
-- 2026-07-31 04:46 UTC com pg_get_functiondef e gravados verbatim, justamente
-- para não dependerem de alguém transcrever certo. Recapturar antes de usar, se
-- tiver passado muito tempo:
--
--   select pg_get_functiondef(p.oid) from pg_proc p
--     join pg_namespace n on n.oid = p.pronamespace
--    where n.nspname = 'public'
--      and p.proname in ('get_ai_usage_today', 'reserve_ai_usage_slot');
--
-- ORDEM IMPORTA. As duas funções abaixo passam a NÃO depender mais de
-- ai_usage_excluded_tools(); só depois disso o drop dela é possível. Rodar o
-- arquivo inteiro, de uma vez, resolve.
--
-- EFEITO RETROATIVO, e é o ponto: as três funções são calculadas na hora da
-- chamada, então o rollback volta a contar 'roadmap-intake-chat' na cota global
-- imediatamente. Ou seja, ele RESTAURA a cobrança dupla. Isso é o esperado de um
-- rollback, e é o motivo de ele não ser a primeira opção diante de um problema.
--
-- NÃO DESTRUTIVO: nenhuma linha é reescrita, nenhum dado é apagado. O que muda é
-- definição de função e existência de índice.

BEGIN;

-- ---------------------------------------------------------------------------
-- 1. Corpos anteriores, verbatim de produção (3 exclusões, cadeia is distinct
--    from, que é NULL-safe: linha com tool nulo CONTA, e continua contando).
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.get_ai_usage_today(p_user_id uuid)
 RETURNS integer
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public'
AS $function$
  select count(*)::integer
  from public.ai_usage_logs
  where user_id = p_user_id
    and status = 'success'
    and tool is distinct from 'agent-chat'
    and tool is distinct from 'interview-turn'
    and tool is distinct from 'career-plan-chat'
    and created_at >= date_trunc('day', now() at time zone 'America/Sao_Paulo');
$function$;

CREATE OR REPLACE FUNCTION public.reserve_ai_usage_slot(p_user_id uuid, p_tool text, p_limit integer)
 RETURNS TABLE(allowed boolean, usage_count integer, reservation_id uuid)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public'
AS $function$
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
$function$;

-- ---------------------------------------------------------------------------
-- 2. Grants. CREATE OR REPLACE RESETA o acl, então reaplicar é obrigatório.
--    Estado conferido em produção em 2026-07-31: as duas têm
--    `postgres=X/postgres | service_role=X/postgres`, ou seja, execução apenas
--    para postgres e service_role. Os REVOKE abaixo reproduzem exatamente isso.
-- ---------------------------------------------------------------------------

REVOKE ALL ON FUNCTION public.get_ai_usage_today(uuid)
  FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_ai_usage_today(uuid) TO service_role;

REVOKE ALL ON FUNCTION public.reserve_ai_usage_slot(uuid, text, integer)
  FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.reserve_ai_usage_slot(uuid, text, integer)
  TO service_role;

-- ---------------------------------------------------------------------------
-- 3. Só agora a lista canônica pode sair: ninguém mais a chama.
-- ---------------------------------------------------------------------------

DROP FUNCTION IF EXISTS public.ai_usage_excluded_tools();

-- ---------------------------------------------------------------------------
-- 4. Rollback da 20260730180000. Índice não guarda dado: dropar não perde nada,
--    e recriar é a própria migration. Depois disto, dois cliques no botão voltam
--    a poder criar duas gerações concorrentes.
-- ---------------------------------------------------------------------------

DROP INDEX IF EXISTS public.ai_roadmaps_one_generating_per_user;

COMMIT;

-- ---------------------------------------------------------------------------
-- VERIFICAÇÃO pós-rollback. O esperado é o estado de 2026-07-31:
--
--   select count(*) from pg_proc p join pg_namespace n on n.oid = p.pronamespace
--    where n.nspname = 'public' and p.proname = 'ai_usage_excluded_tools';
--   -- esperado: 0
--
--   select indexname from pg_indexes where schemaname = 'public'
--     and indexname = 'ai_roadmaps_one_generating_per_user';
--   -- esperado: 0 linhas
--
--   select pg_get_functiondef(p.oid) from pg_proc p
--     join pg_namespace n on n.oid = p.pronamespace
--    where n.nspname = 'public' and p.proname = 'get_ai_usage_today';
--   -- esperado: 3 linhas `tool is distinct from`, SEM roadmap-intake-chat
--
-- E `pnpm check:migrations` volta a ficar VERMELHO, acusando
-- ai_usage_excluded_tools ausente. Isso é correto: o repositório declara a
-- função e o banco não a tem mais. Reverter o banco sem reverter o código deixa
-- o guard vermelho de propósito.
-- ---------------------------------------------------------------------------
