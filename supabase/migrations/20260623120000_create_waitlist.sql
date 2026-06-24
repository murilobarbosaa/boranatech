-- Cria a tabela waitlist para a lista de espera de lancamento.
-- Inserts acontecem pelo service_role (supabaseAdmin) via POST /api/waitlist,
-- que faz bypass de RLS. anon e authenticated ficam em deny-all: sem grant e
-- sem policy. Padrao alinhado com public.cron_run_logs e o fix consolidado de
-- 20260611120000_fix_rls_affiliates_content_policies.sql (service_role-only).

BEGIN;

CREATE TABLE IF NOT EXISTS "public"."waitlist" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "email" "text" NOT NULL,
    "source" "text" DEFAULT 'landing-lancamento'::"text" NOT NULL,
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "notified_at" timestamp with time zone,
    "unsubscribed_at" timestamp with time zone,
    CONSTRAINT "waitlist_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'notified'::"text", 'unsubscribed'::"text"])))
);

ALTER TABLE "public"."waitlist" OWNER TO "postgres";

ALTER TABLE ONLY "public"."waitlist"
    ADD CONSTRAINT "waitlist_pkey" PRIMARY KEY ("id");

-- Dedup case-insensitive: um cadastro por e-mail, ignorando caixa.
CREATE UNIQUE INDEX "waitlist_email_lower_idx"
    ON "public"."waitlist" USING "btree" ("lower"("email"));

CREATE INDEX "waitlist_created_at_idx"
    ON "public"."waitlist" USING "btree" ("created_at" DESC);

ALTER TABLE "public"."waitlist" ENABLE ROW LEVEL SECURITY;

-- Sem policy: INSERT e SELECT acontecem apenas pelo service_role (supabaseAdmin),
-- que faz bypass de RLS. anon e authenticated nao recebem grant, logo deny-all.
GRANT ALL ON TABLE "public"."waitlist" TO "service_role";

COMMENT ON TABLE "public"."waitlist" IS 'Lista de espera de lancamento. Escrita apenas via service_role (POST /api/waitlist).';

COMMIT;
