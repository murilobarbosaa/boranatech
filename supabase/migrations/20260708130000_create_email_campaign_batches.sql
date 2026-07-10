-- Lotes de envio das campanhas de e-mail (agendamento e selecao de
-- destinatarios). Postgres e a fonte de verdade do agendamento: o job atrasado
-- no Redis e so o gatilho, e a reconciliacao no boot recria gatilhos perdidos
-- a partir dos batches pending desta tabela.
--
-- Ajustes de dados exigidos pelo modelo por lote (alem das duas tabelas novas):
--
-- 1. email_campaign_recipients ganha batch_id (nullable): recipients agora sao
--    inseridos por lote no dispatch, nao mais num seed unico da campanha.
--    Rastreia qual lote inseriu cada recipient (linhas antigas ficam null) e
--    da pra funcao de insercao contar o que realmente entrou.
-- 2. Nova funcao email_campaign_add_recipients: insercao atomica dos
--    destinatarios de um lote. total_recipients agora CRESCE por lote, entao o
--    incremento, a atribuicao de position e a transicao draft -> sending
--    precisam acontecer na mesma transacao, serializadas pelo lock da linha da
--    campanha (dois dispatches concorrentes nao duplicam contadores).
-- 3. Nova funcao email_campaign_try_complete e email_campaign_record_result
--    atualizada: a campanha so vira completed quando sent + failed >=
--    total_recipients E nao existe batch pending (um lote agendado pro futuro
--    mantem a campanha em sending). try_complete tambem e chamada pelo backend
--    apos dispatch sem insercao e apos cancelamento de lote, casos em que
--    nenhum record_result novo vai disparar o fechamento.

BEGIN;

CREATE TABLE IF NOT EXISTS "public"."email_campaign_batches" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "campaign_id" "uuid" NOT NULL,
    "mode" "text" NOT NULL,
    "batch_limit" integer,
    "scheduled_for" timestamp with time zone,
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "dispatched_at" timestamp with time zone,
    "created_by" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "email_campaign_batches_mode_check" CHECK (("mode" = ANY (ARRAY['next'::"text", 'selected'::"text"]))),
    CONSTRAINT "email_campaign_batches_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'dispatched'::"text", 'canceled'::"text"])))
);

ALTER TABLE "public"."email_campaign_batches" OWNER TO "postgres";

ALTER TABLE ONLY "public"."email_campaign_batches"
    ADD CONSTRAINT "email_campaign_batches_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."email_campaign_batches"
    ADD CONSTRAINT "email_campaign_batches_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "public"."email_campaigns"("id");

ALTER TABLE ONLY "public"."email_campaign_batches"
    ADD CONSTRAINT "email_campaign_batches_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");

-- Consulta da reconciliacao no boot: batches pending por horario.
CREATE INDEX "email_campaign_batches_status_scheduled_idx"
    ON "public"."email_campaign_batches" USING "btree" ("status", "scheduled_for");

-- Listagem de lotes no detalhe da campanha.
CREATE INDEX "email_campaign_batches_campaign_idx"
    ON "public"."email_campaign_batches" USING "btree" ("campaign_id", "created_at");

-- E-mails escolhidos a dedo (somente mode = 'selected').
CREATE TABLE IF NOT EXISTS "public"."email_campaign_batch_recipients" (
    "batch_id" "uuid" NOT NULL,
    "email" "text" NOT NULL
);

ALTER TABLE "public"."email_campaign_batch_recipients" OWNER TO "postgres";

ALTER TABLE ONLY "public"."email_campaign_batch_recipients"
    ADD CONSTRAINT "email_campaign_batch_recipients_pkey" PRIMARY KEY ("batch_id", "email");

ALTER TABLE ONLY "public"."email_campaign_batch_recipients"
    ADD CONSTRAINT "email_campaign_batch_recipients_batch_id_fkey" FOREIGN KEY ("batch_id") REFERENCES "public"."email_campaign_batches"("id");

-- Ajuste 1: de qual lote cada recipient veio. Linhas antigas ficam null.
ALTER TABLE "public"."email_campaign_recipients"
    ADD COLUMN IF NOT EXISTS "batch_id" "uuid";

ALTER TABLE ONLY "public"."email_campaign_recipients"
    ADD CONSTRAINT "email_campaign_recipients_batch_id_fkey" FOREIGN KEY ("batch_id") REFERENCES "public"."email_campaign_batches"("id");

ALTER TABLE "public"."email_campaign_batches" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."email_campaign_batch_recipients" ENABLE ROW LEVEL SECURITY;

-- Sem policy: acesso apenas pelo service_role (supabaseAdmin), que faz bypass
-- de RLS. anon e authenticated nao recebem grant, logo deny-all.
GRANT ALL ON TABLE "public"."email_campaign_batches" TO "service_role";
GRANT ALL ON TABLE "public"."email_campaign_batch_recipients" TO "service_role";

COMMENT ON TABLE "public"."email_campaign_batches" IS 'Lotes de envio (imediatos ou agendados) das campanhas. Fonte de verdade do agendamento; o Redis so guarda o gatilho.';
COMMENT ON TABLE "public"."email_campaign_batch_recipients" IS 'E-mails escolhidos a dedo para lotes mode=selected. Acesso apenas via service_role.';

-- Ajuste 2: insercao atomica dos destinatarios de um lote. Lock na linha da
-- campanha serializa dispatches concorrentes (position e total_recipients
-- consistentes). ON CONFLICT DO NOTHING descarta quem ja e recipient da
-- campanha; so o que realmente entrou conta no total. Retorna os inseridos
-- para o backend enfileirar um job por recipient.
CREATE OR REPLACE FUNCTION public.email_campaign_add_recipients(
  p_campaign_id uuid,
  p_batch_id uuid,
  p_emails text[]
)
  RETURNS TABLE (recipient_id uuid, recipient_email text)
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = public
AS $$
DECLARE
  v_base_position integer;
  v_inserted integer;
BEGIN
  PERFORM 1 FROM public.email_campaigns c WHERE c.id = p_campaign_id FOR UPDATE;

  SELECT COALESCE(MAX(r.position), 0) INTO v_base_position
  FROM public.email_campaign_recipients r
  WHERE r.campaign_id = p_campaign_id;

  RETURN QUERY
  WITH ordered AS (
    SELECT t.email_value, t.ord
    FROM unnest(p_emails) WITH ORDINALITY AS t(email_value, ord)
  ),
  ins AS (
    INSERT INTO public.email_campaign_recipients (campaign_id, email, position, batch_id)
    SELECT p_campaign_id, o.email_value, v_base_position + o.ord::integer, p_batch_id
    FROM ordered o
    ON CONFLICT (campaign_id, email) DO NOTHING
    RETURNING email_campaign_recipients.id, email_campaign_recipients.email
  )
  SELECT ins.id, ins.email FROM ins;

  SELECT COUNT(*)::integer INTO v_inserted
  FROM public.email_campaign_recipients r
  WHERE r.batch_id = p_batch_id;

  IF v_inserted > 0 THEN
    UPDATE public.email_campaigns
    SET total_recipients = COALESCE(total_recipients, 0) + v_inserted,
        status = CASE WHEN status = 'draft' THEN 'sending' ELSE status END,
        started_at = COALESCE(started_at, now())
    WHERE id = p_campaign_id;
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.email_campaign_add_recipients(uuid, uuid, text[]) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.email_campaign_add_recipients(uuid, uuid, text[]) TO service_role;

-- Ajuste 3: fechamento da campanha considerando lotes. Um batch pending
-- (agendado pro futuro) segura a campanha em sending mesmo com todos os
-- recipients atuais resolvidos.
CREATE OR REPLACE FUNCTION public.email_campaign_try_complete(p_campaign_id uuid)
  RETURNS void
  LANGUAGE sql
  SECURITY DEFINER
  SET search_path = public
AS $$
  UPDATE public.email_campaigns
  SET status = CASE WHEN sent_count = 0 THEN 'failed' ELSE 'completed' END,
      completed_at = now()
  WHERE id = p_campaign_id
    AND status = 'sending'
    AND total_recipients IS NOT NULL
    AND sent_count + failed_count >= total_recipients
    AND NOT EXISTS (
      SELECT 1
      FROM public.email_campaign_batches b
      WHERE b.campaign_id = p_campaign_id
        AND b.status = 'pending'
    );
$$;

REVOKE ALL ON FUNCTION public.email_campaign_try_complete(uuid) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.email_campaign_try_complete(uuid) TO service_role;

-- record_result mantem o registro atomico por recipient e delega o fechamento
-- pra try_complete (mesma regra em um lugar so). Substitui a versao de
-- 20260708120000, que fechava sem olhar os batches.
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

  PERFORM public.email_campaign_try_complete(v_campaign_id);
END;
$$;

REVOKE ALL ON FUNCTION public.email_campaign_record_result(uuid, boolean, text) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.email_campaign_record_result(uuid, boolean, text) TO service_role;

COMMIT;
