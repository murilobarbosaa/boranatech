-- Origens de destinatarios (audiencias) e supressao global de e-mails.
--
-- 1. email_suppressions: lista global de e-mails que NUNCA recebem campanha,
--    de qualquer origem. reason: unsubscribed (fluxo de descadastro de
--    campanha), bounced (retorno rigido), manual (insercao do admin).
--    O descadastro da NEWSLETTER nao grava aqui de proposito: o consentimento
--    dela e de escopo newsletter, e a origem newsletter das campanhas ja
--    seleciona apenas status confirmed.
--    Normalizacao: email sempre em minusculas, garantida por CHECK, com
--    UNIQUE na coluna (e nao em expressao) para o upsert via PostgREST
--    (on_conflict) funcionar.
-- 2. email_campaign_batches.source: audiencia do lote (waitlist, newsletter,
--    custom = lista avulsa colada, users). 'users' existe no CHECK mas fica
--    desabilitada na UI ate existir consentimento de marketing em profiles
--    (proposta registrada: profiles.marketing_opt_in boolean not null default
--    false + marketing_opt_in_at timestamptz, capturado em onboarding/perfil;
--    NAO implementado agora).
-- 3. Seed: teste3@gmail.com como bounced (bounce real da campanha inicial,
--    cadastro fake de teste).

BEGIN;

CREATE TABLE IF NOT EXISTS "public"."email_suppressions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "email" "text" NOT NULL,
    "reason" "text" NOT NULL,
    "source" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "email_suppressions_reason_check" CHECK (("reason" = ANY (ARRAY['unsubscribed'::"text", 'bounced'::"text", 'manual'::"text"]))),
    CONSTRAINT "email_suppressions_email_lower_check" CHECK (("email" = "lower"("email")))
);

ALTER TABLE "public"."email_suppressions" OWNER TO "postgres";

ALTER TABLE ONLY "public"."email_suppressions"
    ADD CONSTRAINT "email_suppressions_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."email_suppressions"
    ADD CONSTRAINT "email_suppressions_email_key" UNIQUE ("email");

ALTER TABLE "public"."email_suppressions" ENABLE ROW LEVEL SECURITY;

-- Sem policy: acesso apenas pelo service_role (supabaseAdmin), que faz bypass
-- de RLS. anon e authenticated nao recebem grant, logo deny-all.
GRANT ALL ON TABLE "public"."email_suppressions" TO "service_role";

COMMENT ON TABLE "public"."email_suppressions" IS 'Supressao global de e-mails de campanha (todas as origens). Escrita apenas via service_role.';

INSERT INTO "public"."email_suppressions" ("email", "reason", "source")
VALUES ('teste3@gmail.com', 'bounced', 'admin')
ON CONFLICT ("email") DO NOTHING;

ALTER TABLE "public"."email_campaign_batches"
    ADD COLUMN IF NOT EXISTS "source" "text" DEFAULT 'waitlist'::"text" NOT NULL;

ALTER TABLE "public"."email_campaign_batches"
    ADD CONSTRAINT "email_campaign_batches_source_check" CHECK (("source" = ANY (ARRAY['waitlist'::"text", 'newsletter'::"text", 'custom'::"text", 'users'::"text"])));

COMMENT ON COLUMN "public"."email_campaign_batches"."source" IS 'Audiencia do lote: waitlist, newsletter, custom (lista avulsa) ou users (desabilitada ate existir opt-in).';

COMMIT;
