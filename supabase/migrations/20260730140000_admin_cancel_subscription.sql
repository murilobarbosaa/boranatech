-- Suporte ao CANCELAMENTO DE ASSINATURA PELO ADMIN (Fatia 6). Três mudanças
-- aditivas, todas no mesmo commit porque as três são pré-requisito do mesmo
-- código.
--
-- ORDEM DE DEPLOY: ANTES do código, pelo mesmo raciocínio invertido das
-- 20260730090000 e 20260730100000, e aqui há um motivo A MAIS.
--
--   (a) audit fail-closed: gravar action='cancel_subscription' contra a CHECK
--       velha faz o insert falhar e a rota responder 500 antes de tocar a
--       Stripe;
--   (b) NOVO nesta migration: o código escreve a coluna `canceled_by`. Código
--       que escreve coluna INEXISTENTE falha na hora, não degrada. Isso reforça
--       a ordem em vez de mudá-la: a migration continua tendo de vir antes, e
--       agora por duas razões independentes.
--
-- O schema novo continua sendo tolerado pelo código antigo: ninguém escreve
-- 'cancel_subscription' nem 'admin' hoje, e uma coluna nullable a mais não
-- muda nada para quem já roda.
--
-- ADITIVA e ISENTA da janela destrutiva: cria coluna nullable e amplia dois
-- CHECKs. Não apaga, não altera e não converte dado nenhum.

BEGIN;

-- (1) Auditoria da ação. Valor próprio, não 'update': cancelar assinatura não é
-- editar cadastro, e poder filtrar cancelamentos administrativos sem varrer
-- edição de bio é o ponto de ter action própria.
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
        'cancel_subscription'::"text"
    ])));

-- (2) reason_code 'admin'. Os cinco valores antigos são motivos que o PRÓPRIO
-- usuário escolhe numa lista; cancelamento administrativo não é nenhum deles, e
-- jogá-lo em 'other' contaminaria a agregação de motivos da aba Retenção com
-- eventos que não são decisão do cliente.
--
-- A UI degrada sozinha: reasonLabel() em CancellationReasonsDashboard.tsx já
-- tem fallback (`REASON_LABELS[code] ?? code`), então um código novo aparece
-- cru em vez de quebrar.
ALTER TABLE "public"."subscription_cancellations"
    DROP CONSTRAINT IF EXISTS "subscription_cancellations_reason_code_check";

ALTER TABLE "public"."subscription_cancellations"
    ADD CONSTRAINT "subscription_cancellations_reason_code_check"
    CHECK (("reason_code" = ANY (ARRAY[
        'expensive'::"text",
        'unused'::"text",
        'missing_feature'::"text",
        'paused'::"text",
        'other'::"text",
        'admin'::"text"
    ])));

-- (3) Quem cancelou. NULLABLE porque as 13 linhas já existentes não têm essa
-- informação e inventá-la seria pior que a ausência.
--
-- A partir daqui o campo é preenchido nos DOIS caminhos, inclusive no
-- cancelamento do próprio usuário (onde o ator é ele mesmo). A alternativa
-- ("null significa que foi a própria pessoa") transformaria ausência de dado em
-- afirmação, e não distinguiria "foi ela" de "não sabemos". Com o ator sempre
-- preenchido, `canceled_by <> user_id` é a leitura precisa de "um admin fez
-- isso".
ALTER TABLE "public"."subscription_cancellations"
    ADD COLUMN IF NOT EXISTS "canceled_by" uuid REFERENCES auth.users(id);

COMMENT ON COLUMN "public"."subscription_cancellations"."canceled_by" IS
    'Quem executou o cancelamento. Igual a user_id quando foi o próprio usuário; diferente quando foi um admin. NULL apenas nas linhas anteriores a 2026-07-30.';

COMMIT;
