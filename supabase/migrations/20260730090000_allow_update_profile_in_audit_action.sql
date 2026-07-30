-- Amplia a CHECK de content_audit_logs.action para aceitar 'update_profile',
-- usado ao registrar a edicao de cadastro de um usuario pelo admin (PATCH
-- /api/admin/users/:id). Nao e 'update' de conteudo: o recurso e o perfil de
-- uma PESSOA, e um log dizendo 'update' de 'profile' misturado com edicao de
-- curso seria um log mentindo sobre o que aconteceu. Mesmo padrao da
-- 20260714170000 ('reveal') e da 20260716130200 ('grant'/'revoke').
--
-- GUARDA: todos os valores antigos (create, update, delete, publish,
-- unpublish, reveal, grant, revoke) continuam permitidos. O conjunto novo
-- contem 100% do antigo; nenhuma linha de audit existente fica invalida.
--
-- ADITIVA e ISENTA da janela de migration destrutiva: nao apaga, nao altera e
-- nao converte dado nenhum. O rollback e reaplicar a CHECK anterior.
--
-- ORDEM DE DEPLOY: esta migration vai ANTES do codigo, invertendo a ordem
-- padrao do CLAUDE.md, e de proposito. A regra de la ("migration so DEPOIS do
-- codigo") se justifica por "codigo novo tolera schema antigo; schema novo NAO
-- e tolerado por codigo antigo". Aqui as duas metades se invertem:
--   - o codigo novo NAO tolera o schema antigo: o audit e fail-closed, entao
--     gravar action='update_profile' contra a CHECK velha faz o insert falhar
--     e a edicao inteira responder 500 audit_failed;
--   - o schema novo E tolerado pelo codigo antigo: ninguem escreve
--     'update_profile' hoje, e ampliar uma CHECK nao muda nada para quem ja
--     roda.
-- Aplicar esta antes deixa a CHECK ociosa ate o deploy; aplicar depois deixa a
-- edicao morta em producao, que e a forma do incidente da
-- 20260710120000_create_linkedin_improvement_progress.
--
-- Custo do lock: content_audit_logs tem 133 linhas e 200 kB (medido em
-- 2026-07-29). A revalidacao do ADD CONSTRAINT varre a tabela inteira, o que
-- aqui e instantaneo.
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
        'update_profile'::"text"
    ])));

COMMIT;
