-- Amplia a CHECK de content_audit_logs.action para aceitar o valor de LEITURA
-- 'reveal', usado ao registrar a revelacao de CPF de um usuario no admin.
-- 'reveal' e uma acao de leitura auditada (quem revelou o CPF de quem, quando):
-- nao e um 'update' e nao pode ser logada como tal (seria um log mentindo sobre
-- o que aconteceu).
--
-- GUARDA: todos os valores antigos (create, update, delete, publish, unpublish)
-- continuam permitidos. O conjunto novo e o antigo MAIS 'reveal'; o antigo esta
-- 100% contido. Nenhuma linha de audit existente fica invalida.
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
        'reveal'::"text"
    ])));

COMMIT;
