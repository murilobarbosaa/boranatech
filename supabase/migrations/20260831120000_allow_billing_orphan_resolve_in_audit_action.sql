-- Amplia a CHECK de content_audit_logs.action para aceitar
-- 'billing_orphan_resolve', gravada por POST /api/admin/billing/orphan-payments/
-- :id/resolve (server/routes/admin.ts:1651). Mesmo padrao da 20260714170000
-- ('reveal'), da 20260716130200 ('grant'/'revoke'), da 20260730090000
-- ('update_profile'), da 20260730100000 ('update_email'), da 20260730140000
-- ('cancel_subscription'), da 20260730160000 ('refund'/'refund_external') e da
-- 20260730190000 ('revoke_pro').
--
-- 'update' NAO serve: a resolucao de um pagamento orfao nao e edicao de
-- conteudo, e o filtro do historico precisa distinguir "alguem decidiu o que
-- fazer com um pagamento sem assinatura" de "alguem editou um curso". E a mesma
-- razao pela qual 'revoke_pro' nao virou 'revoke' na 20260730190000.
--
-- O DEFEITO QUE ISTO CONSERTA, medido em 2026-08-31. A rota subiu para producao
-- com a CHECK antiga no banco. A gravacao do audit ali e FAIL-CLOSED por
-- desenho (server/routes/admin.ts:1643-1646: sem rastro, nao grava), entao o
-- insert recusado pela CHECK derruba a rota inteira com 500. O botao de resolver
-- orfaos nasceu morto em producao, exatamente como a
-- 20260710120000_create_linkedin_improvement_progress. Nada acusou porque o
-- caminho so e exercitado quando um admin clica.
--
-- GUARDA: todos os catorze valores antigos (create, update, delete, publish,
-- unpublish, reveal, grant, revoke, update_profile, update_email,
-- cancel_subscription, refund, refund_external, revoke_pro) continuam
-- permitidos. O conjunto novo contem 100% do antigo; nenhuma linha de audit
-- existente fica invalida.
--
-- ADITIVA e ISENTA da janela de migration destrutiva: nao apaga, nao altera e
-- nao converte dado nenhum. O rollback e reaplicar a CHECK anterior.
--
-- ORDEM DE DEPLOY: esta e o caso invertido descrito na 20260730090000, e aqui
-- ele ja se materializou. O codigo JA esta em producao e NAO tolera o schema
-- antigo; o schema novo e tolerado por qualquer codigo. Aplicar assim que
-- possivel, sem esperar deploy nenhum.
--
-- Idempotente: DROP CONSTRAINT IF EXISTS antes de recriar. Nao toca em dados.

BEGIN;

ALTER TABLE "public"."content_audit_logs"
    DROP CONSTRAINT IF EXISTS "content_audit_logs_action_check";

ALTER TABLE "public"."content_audit_logs"
    ADD CONSTRAINT "content_audit_logs_action_check"
    CHECK (("action" = ANY (ARRAY[
        'create'::"text",
        'update'::"text",
        'delete'::"text",
        'publish'::"text",
        'unpublish'::"text",
        'reveal'::"text",
        'grant'::"text",
        'revoke'::"text",
        'update_profile'::"text",
        'update_email'::"text",
        'cancel_subscription'::"text",
        'refund'::"text",
        'refund_external'::"text",
        'revoke_pro'::"text",
        'billing_orphan_resolve'::"text"
    ])));

COMMIT;
