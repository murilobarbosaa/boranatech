-- Campanhas de e-mail em massa para a waitlist (aba Emails do admin).
-- email_campaigns: uma linha por campanha, com contadores de progresso.
-- email_campaign_recipients: snapshot dos destinatarios no momento do disparo,
-- um por e-mail elegivel da waitlist (status pending/notified, nunca
-- unsubscribed). A coluna position preserva a ordem por created_at da waitlist
-- para o envio parcial (enviar N agora, o restante depois) ser deterministico.
--
-- RLS: padrao do projeto (mesmo de public.waitlist e public.cron_run_logs).
-- ENABLE ROW LEVEL SECURITY sem nenhuma policy + GRANT apenas para
-- service_role: anon e authenticated ficam deny-all. Todo acesso passa pelo
-- backend via supabaseAdmin, atras do gate de admin.

BEGIN;

CREATE TABLE IF NOT EXISTS "public"."email_campaigns" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "subject" "text" NOT NULL,
    "body" "text" NOT NULL,
    "image_url" "text",
    "status" "text" DEFAULT 'draft'::"text" NOT NULL,
    "total_recipients" integer,
    "sent_count" integer DEFAULT 0 NOT NULL,
    "failed_count" integer DEFAULT 0 NOT NULL,
    "created_by" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "started_at" timestamp with time zone,
    "completed_at" timestamp with time zone,
    CONSTRAINT "email_campaigns_status_check" CHECK (("status" = ANY (ARRAY['draft'::"text", 'sending'::"text", 'completed'::"text", 'failed'::"text"])))
);

ALTER TABLE "public"."email_campaigns" OWNER TO "postgres";

ALTER TABLE ONLY "public"."email_campaigns"
    ADD CONSTRAINT "email_campaigns_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."email_campaigns"
    ADD CONSTRAINT "email_campaigns_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");

CREATE INDEX "email_campaigns_created_at_idx"
    ON "public"."email_campaigns" USING "btree" ("created_at" DESC);

CREATE TABLE IF NOT EXISTS "public"."email_campaign_recipients" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "campaign_id" "uuid" NOT NULL,
    "email" "text" NOT NULL,
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "error" "text",
    "sent_at" timestamp with time zone,
    "position" integer NOT NULL,
    CONSTRAINT "email_campaign_recipients_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'sent'::"text", 'failed'::"text"])))
);

ALTER TABLE "public"."email_campaign_recipients" OWNER TO "postgres";

ALTER TABLE ONLY "public"."email_campaign_recipients"
    ADD CONSTRAINT "email_campaign_recipients_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."email_campaign_recipients"
    ADD CONSTRAINT "email_campaign_recipients_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "public"."email_campaigns"("id");

ALTER TABLE ONLY "public"."email_campaign_recipients"
    ADD CONSTRAINT "email_campaign_recipients_campaign_email_key" UNIQUE ("campaign_id", "email");

-- Consulta quente do envio parcial: proximos pending por posicao.
CREATE INDEX "email_campaign_recipients_pending_idx"
    ON "public"."email_campaign_recipients" USING "btree" ("campaign_id", "status", "position");

ALTER TABLE "public"."email_campaigns" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."email_campaign_recipients" ENABLE ROW LEVEL SECURITY;

-- Sem policy: acesso apenas pelo service_role (supabaseAdmin), que faz bypass
-- de RLS. anon e authenticated nao recebem grant, logo deny-all.
GRANT ALL ON TABLE "public"."email_campaigns" TO "service_role";
GRANT ALL ON TABLE "public"."email_campaign_recipients" TO "service_role";

COMMENT ON TABLE "public"."email_campaigns" IS 'Campanhas de e-mail em massa para a waitlist. Acesso apenas via service_role (rotas /api/admin/email-campaigns).';
COMMENT ON TABLE "public"."email_campaign_recipients" IS 'Destinatarios de cada campanha, snapshot da waitlist no disparo. Acesso apenas via service_role.';

-- Registro atomico do resultado de um envio (worker da fila email-campaign).
-- Mesmo racional do increment_affiliate_clicks: read-then-write no backend
-- perderia atualizacoes concorrentes nos contadores. O WHERE status = 'pending'
-- garante idempotencia (job reprocessado nao conta duas vezes) e o terceiro
-- UPDATE fecha a campanha quando todos os destinatarios foram resolvidos:
-- completed se ao menos um enviou, failed se todos falharam.
CREATE OR REPLACE FUNCTION public.email_campaign_record_result(
  p_recipient_id uuid,
  p_success boolean,
  p_error text DEFAULT NULL
)
  RETURNS void
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = public
AS $$
DECLARE
  v_campaign_id uuid;
BEGIN
  UPDATE public.email_campaign_recipients
  SET status = CASE WHEN p_success THEN 'sent' ELSE 'failed' END,
      sent_at = CASE WHEN p_success THEN now() ELSE NULL END,
      error = CASE WHEN p_success THEN NULL ELSE p_error END
  WHERE id = p_recipient_id
    AND status = 'pending'
  RETURNING campaign_id INTO v_campaign_id;

  IF v_campaign_id IS NULL THEN
    RETURN;
  END IF;

  UPDATE public.email_campaigns
  SET sent_count = sent_count + (CASE WHEN p_success THEN 1 ELSE 0 END),
      failed_count = failed_count + (CASE WHEN p_success THEN 0 ELSE 1 END)
  WHERE id = v_campaign_id;

  UPDATE public.email_campaigns
  SET status = CASE WHEN sent_count = 0 THEN 'failed' ELSE 'completed' END,
      completed_at = now()
  WHERE id = v_campaign_id
    AND status = 'sending'
    AND total_recipients IS NOT NULL
    AND sent_count + failed_count >= total_recipients;
END;
$$;

REVOKE ALL ON FUNCTION public.email_campaign_record_result(uuid, boolean, text) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.email_campaign_record_result(uuid, boolean, text) TO service_role;

COMMIT;
