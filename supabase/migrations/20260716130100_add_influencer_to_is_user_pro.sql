-- Adiciona o ramo de INFLUENCER ao is_user_pro: influencer ativo (linha em
-- public.influencers com revoked_at null) tem acesso Pro sem assinatura,
-- vitalicio. Segundo caso de Pro-sem-assinatura; o primeiro (admin) NAO vive
-- nesta funcao: e combinado em TypeScript por resolveProStatus
-- (server/middleware/auth.ts), que faz isPro = is_user_pro OR is_user_admin.
--
-- ASSINATURA PRESERVADA: is_user_pro(p_user_id uuid) returns boolean, LANGUAGE
-- sql, STABLE, SECURITY DEFINER. Identica a original (20260517231011); todos os
-- consumidores por RPC continuam funcionando sem mudanca.
--
-- search_path REDECLARADO de proposito: a hardening 20260702130000 fixou
-- search_path = pg_catalog, public via ALTER FUNCTION, e um CREATE OR REPLACE
-- sem a clausula SET apagaria essa configuracao. Os GRANTs (execute so para
-- service_role) sobrevivem ao CREATE OR REPLACE e nao precisam ser refeitos.

BEGIN;

CREATE OR REPLACE FUNCTION "public"."is_user_pro"("p_user_id" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'pg_catalog', 'public'
    AS $$
  select exists (
    select 1
    from public.subscriptions s
    join public.plans p on p.id = s.plan_id
    where s.user_id = p_user_id
      and p.code != 'free'
      and s.status in ('active', 'trialing')
      and (s.current_period_end is null or s.current_period_end > now())
  )
  or exists (
    select 1
    from public.influencers i
    where i.user_id = p_user_id
      and i.revoked_at is null
  );
$$;

ALTER FUNCTION "public"."is_user_pro"("p_user_id" "uuid") OWNER TO "postgres";

COMMIT;
