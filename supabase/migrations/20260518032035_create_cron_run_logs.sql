-- Cria a tabela cron_run_logs referenciada pelo helper recordCronRun()
-- (server/lib/cron-logs.ts), gravada pelos endpoints em server/routes/cron.ts:
-- process-cancellations, sync-news, sync-jobs.
-- Padrão alinhado com public.content_audit_logs (append-only, service_role-only).

BEGIN;

CREATE TABLE IF NOT EXISTS "public"."cron_run_logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "job_name" "text" NOT NULL,
    "status" "text" NOT NULL,
    "started_at" timestamp with time zone NOT NULL,
    "finished_at" timestamp with time zone NOT NULL,
    "duration_ms" integer GENERATED ALWAYS AS (((EXTRACT(EPOCH FROM ("finished_at" - "started_at")) * (1000)::numeric))::integer) STORED,
    "payload" "jsonb",
    "error_message" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "cron_run_logs_status_check" CHECK (("status" = ANY (ARRAY['success'::"text", 'error'::"text", 'partial'::"text"])))
);

ALTER TABLE "public"."cron_run_logs" OWNER TO "postgres";

ALTER TABLE ONLY "public"."cron_run_logs"
    ADD CONSTRAINT "cron_run_logs_pkey" PRIMARY KEY ("id");

CREATE INDEX "cron_run_logs_job_name_created_at_idx"
    ON "public"."cron_run_logs" USING "btree" ("job_name", "created_at" DESC);

CREATE INDEX "cron_run_logs_created_at_idx"
    ON "public"."cron_run_logs" USING "btree" ("created_at" DESC);

CREATE INDEX "cron_run_logs_status_idx"
    ON "public"."cron_run_logs" USING "btree" ("status");

ALTER TABLE "public"."cron_run_logs" ENABLE ROW LEVEL SECURITY;

-- Sem policies: apenas service_role (supabaseAdmin) pode ler/escrever via
-- bypass de RLS. Anon e authenticated ficam sem acesso por design.

GRANT ALL ON TABLE "public"."cron_run_logs" TO "anon";
GRANT ALL ON TABLE "public"."cron_run_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."cron_run_logs" TO "service_role";

COMMENT ON TABLE "public"."cron_run_logs" IS
    'Append-only log of cron job executions (process-cancellations, sync-news, sync-jobs). Written by recordCronRun() in server/lib/cron-logs.ts.';

COMMIT;
