-- Amplia a CHECK de content_audit_logs.action para aceitar 'update_email',
-- usado ao registrar a troca de e-mail de um usuario pelo admin
-- (POST /api/admin/users/:id/email).
--
-- Action PROPRIA, e nao 'update_profile', de propósito: trocar o endereco de
-- LOGIN nao e a mesma coisa que corrigir uma bio. Com valor proprio da para
-- filtrar toda troca de identidade no log sem varrer edicao de cadastro, que e
-- exatamente a pergunta que se faz quando algo dá errado com uma conta.
--
-- GUARDA: todos os valores antigos (create, update, delete, publish,
-- unpublish, reveal, grant, revoke, update_profile) continuam permitidos. O
-- conjunto novo contem 100% do antigo; nenhuma linha existente fica invalida.
--
-- ADITIVA e ISENTA da janela de migration destrutiva: nao apaga, nao altera e
-- nao converte dado nenhum.
--
-- ORDEM DE DEPLOY: ANTES do codigo, pelo MESMO raciocinio da
-- 20260730090000, e a inversao se aplica igual aqui. A regra do CLAUDE.md
-- ("migration so DEPOIS do codigo") se apoia em "codigo novo tolera schema
-- antigo; schema novo NAO e tolerado por codigo antigo". Aqui:
--   - o codigo novo NAO tolera o schema antigo: o audit e fail-closed, entao
--     gravar action='update_email' contra a CHECK velha faz o insert falhar e a
--     troca inteira responder 500 antes de tocar o Auth;
--   - o schema novo E tolerado pelo codigo antigo: ninguem escreve
--     'update_email' hoje.
-- Aplicar antes deixa a CHECK ociosa; aplicar depois deixa a troca de e-mail
-- morta em producao.
--
-- Aqui o fail-closed vale ainda mais que na 5a: sem o rastro gravado, a troca
-- de IDENTIDADE nao acontece. Uma conta mudar de dono sem registro de quem
-- mudou e o pior desfecho possivel desta rota.
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
        'update_email'::"text"
    ])));

COMMIT;
