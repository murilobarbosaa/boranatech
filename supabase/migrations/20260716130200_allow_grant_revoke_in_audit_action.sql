-- Amplia a CHECK de content_audit_logs.action para aceitar 'grant' e 'revoke',
-- usados ao registrar concessao e revogacao de acesso de influencer no admin.
-- Conceder/revogar acesso vitalicio a features pagas precisa de rastro proprio:
-- nao e 'create' nem 'update' de conteudo (seria um log mentindo sobre o que
-- aconteceu). Mesmo padrao da 20260714170000 (que adicionou 'reveal').
--
-- GUARDA: todos os valores antigos (create, update, delete, publish, unpublish,
-- reveal) continuam permitidos. O conjunto novo contem 100% do antigo; nenhuma
-- linha de audit existente fica invalida.
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
        'revoke'::"text"
    ])));

COMMIT;
