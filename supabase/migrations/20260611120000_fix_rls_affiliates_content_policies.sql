-- Fecha a RLS de affiliates, content_sources e content_sync_logs.
-- O dump 20260517231011 versionou policies permissivas demais:
--   - affiliates_admin_all: FOR ALL com USING (true) WITH CHECK (true), sem TO,
--     valia para anon e authenticated em SELECT/INSERT/UPDATE/DELETE. Como a
--     anon key esta no bundle publico, qualquer um lia/escrevia via PostgREST
--     (inclusive zerar discount_percent de cupom, aplicado no checkout).
--   - content_sources_select_public / content_sync_logs_select_public: SELECT
--     publico, expondo telemetria interna de sync.
-- Estas tabelas so sao acessadas pelo backend via service role (supabaseAdmin),
-- que faz bypass de RLS. Logo, remover as policies e revogar os grants amplos
-- nao quebra o backend e deixa anon/authenticated em deny-all.
-- Padrao alinhado com public.cron_run_logs (service_role-only, sem policy).
-- Ja aplicado e validado em producao via SQL Editor; esta migration apenas
-- versiona o mesmo SQL para reproduzir o estado correto em db reset / instancia nova.
-- Idempotente.

BEGIN;

DROP POLICY IF EXISTS "affiliates_admin_all" ON "public"."affiliates";
DROP POLICY IF EXISTS "content_sources_select_public" ON "public"."content_sources";
DROP POLICY IF EXISTS "content_sync_logs_select_public" ON "public"."content_sync_logs";

ALTER TABLE "public"."affiliates" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."content_sources" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."content_sync_logs" ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE "public"."affiliates" FROM "anon", "authenticated";
REVOKE ALL ON TABLE "public"."content_sources" FROM "anon", "authenticated";
REVOKE ALL ON TABLE "public"."content_sync_logs" FROM "anon", "authenticated";

COMMIT;
