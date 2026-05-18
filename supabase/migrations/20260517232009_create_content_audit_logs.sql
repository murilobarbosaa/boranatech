-- Cria a tabela content_audit_logs referenciada pelo server
-- (server/lib/audit.ts e server/routes/admin.ts).
-- Schema inferido a partir do payload do logAudit() e dos selects no admin.
-- Padrão alinhado com public.ai_usage_logs (append-only, admin-visible).

BEGIN;

CREATE TABLE IF NOT EXISTS "public"."content_audit_logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "actor_user_id" "uuid",
    "action" "text" NOT NULL,
    "resource_type" "text" NOT NULL,
    "resource_id" "text",
    "resource_slug" "text",
    "before_json" "jsonb",
    "after_json" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "content_audit_logs_action_check" CHECK (("action" = ANY (ARRAY['create'::"text", 'update'::"text", 'delete'::"text", 'publish'::"text", 'unpublish'::"text"])))
);

ALTER TABLE "public"."content_audit_logs" OWNER TO "postgres";

ALTER TABLE ONLY "public"."content_audit_logs"
    ADD CONSTRAINT "content_audit_logs_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."content_audit_logs"
    ADD CONSTRAINT "content_audit_logs_actor_user_id_fkey"
    FOREIGN KEY ("actor_user_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL;

CREATE INDEX "content_audit_logs_created_at_idx"
    ON "public"."content_audit_logs" USING "btree" ("created_at" DESC);

CREATE INDEX "content_audit_logs_resource_type_idx"
    ON "public"."content_audit_logs" USING "btree" ("resource_type");

CREATE INDEX "content_audit_logs_actor_user_id_idx"
    ON "public"."content_audit_logs" USING "btree" ("actor_user_id");

ALTER TABLE "public"."content_audit_logs" ENABLE ROW LEVEL SECURITY;

-- Apenas admins (existem em public.admin_roles) podem ler audit logs.
-- INSERTs acontecem pelo service_role (supabaseAdmin), que faz bypass de RLS,
-- então não há policy de INSERT/UPDATE/DELETE.
CREATE POLICY "content_audit_logs_select_admin"
    ON "public"."content_audit_logs"
    FOR SELECT
    USING ("public"."is_user_admin"("auth"."uid"()));

GRANT ALL ON TABLE "public"."content_audit_logs" TO "anon";
GRANT ALL ON TABLE "public"."content_audit_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."content_audit_logs" TO "service_role";

COMMIT;
