-- Influencers: parceiros que divulgam a plataforma e recebem acesso Pro
-- completo sem assinar. Tabela propria (nao coluna em profiles) porque o
-- historico importa: quem concedeu, quando, por que, e quando revogou.
--
-- ATIVO = linha com revoked_at is null. Revogar NAO deleta: preenche
-- revoked_at/revoked_by e a linha vira historico. Uma pessoa pode ter varias
-- linhas revogadas (concedido, revogado, concedido de novo), mas no maximo UMA
-- ativa: o indice unico parcial abaixo garante isso no banco, nao so no app.
--
-- Ortogonal a affiliates (programa de comissao): nenhum acoplamento aqui.

BEGIN;

CREATE TABLE "public"."influencers" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "user_id" uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    "granted_by" uuid NOT NULL REFERENCES auth.users(id),
    "granted_at" timestamptz NOT NULL DEFAULT now(),
    "revoked_by" uuid REFERENCES auth.users(id),
    "revoked_at" timestamptz,
    "note" text,
    "created_at" timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX "influencers_user_id_idx" ON "public"."influencers" ("user_id");

-- No maximo uma concessao ATIVA por usuario. Sem isso, dois grants simultaneos
-- (duas abas do admin, retry de rede) criariam duas linhas ativas e a revogacao
-- de uma deixaria a outra valendo: acesso fantasma. O historico (linhas com
-- revoked_at preenchido) nao e limitado.
CREATE UNIQUE INDEX "influencers_active_user_uidx"
    ON "public"."influencers" ("user_id")
    WHERE "revoked_at" IS NULL;

-- RLS ligado SEM policy: nega tudo por padrao. So o service_role (backend) e
-- funcoes SECURITY DEFINER (is_user_pro) enxergam a tabela.
ALTER TABLE "public"."influencers" ENABLE ROW LEVEL SECURITY;

COMMIT;
