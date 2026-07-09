-- Categoria de campanha, opt-in de marketing e segmentos de usuarios.
--
-- 1. email_campaigns.category: declarada pelo admin na criacao (nada de
--    classificacao automatica). 'product' = comunicacao de produto, seleciona
--    qualquer usuario nao suprimido (legitimo interesse, opt-out).
--    'promotional' = apenas usuarios com marketing_opt_in = true. A regra e
--    imposta no backend na selecao da origem users. O DEFAULT 'product' existe
--    so para carimbar as linhas historicas e e removido em seguida: insercoes
--    novas exigem categoria explicita.
-- 2. profiles.marketing_opt_in + marketing_opt_in_at: consentimento de
--    comunicacao promocional, DESMARCADO por default, capturado no onboarding
--    e editavel no perfil. O carimbo e gravado pelo server no PATCH /api/me.
--    Camada independente da supressao global (email_suppressions), que segue
--    valendo acima de tudo.
-- 3. email_campaign_batches.user_segment: segmento da origem users (all,
--    never_pro, active_pro, ex_pro), derivado de subscriptions + plans na hora
--    do dispatch. Obrigatorio quando source = 'users', proibido nas demais
--    origens (CHECK pareado; linhas historicas passam por serem null).
--    Semantica: active_pro = condicao do is_user_pro; ex_pro = teve plano pago
--    e hoje nao esta nem ativo nem past_due; past_due (recuperacao de
--    pagamento) fica fora de ambos e entra apenas no segmento all.

BEGIN;

ALTER TABLE "public"."email_campaigns"
    ADD COLUMN IF NOT EXISTS "category" "text" DEFAULT 'product'::"text" NOT NULL;

ALTER TABLE "public"."email_campaigns"
    ADD CONSTRAINT "email_campaigns_category_check" CHECK (("category" = ANY (ARRAY['product'::"text", 'promotional'::"text"])));

ALTER TABLE "public"."email_campaigns"
    ALTER COLUMN "category" DROP DEFAULT;

COMMENT ON COLUMN "public"."email_campaigns"."category" IS 'Categoria declarada pelo admin: product (opt-out) ou promotional (exige marketing_opt_in na origem users).';

ALTER TABLE "public"."profiles"
    ADD COLUMN IF NOT EXISTS "marketing_opt_in" boolean DEFAULT false NOT NULL;

ALTER TABLE "public"."profiles"
    ADD COLUMN IF NOT EXISTS "marketing_opt_in_at" timestamp with time zone;

COMMENT ON COLUMN "public"."profiles"."marketing_opt_in" IS 'Consentimento de comunicacao promocional. Default false; carimbo em marketing_opt_in_at gravado pelo server.';

ALTER TABLE "public"."email_campaign_batches"
    ADD COLUMN IF NOT EXISTS "user_segment" "text";

ALTER TABLE "public"."email_campaign_batches"
    ADD CONSTRAINT "email_campaign_batches_user_segment_check" CHECK (("user_segment" IS NULL OR "user_segment" = ANY (ARRAY['all'::"text", 'never_pro'::"text", 'active_pro'::"text", 'ex_pro'::"text"])));

ALTER TABLE "public"."email_campaign_batches"
    ADD CONSTRAINT "email_campaign_batches_user_segment_source_check" CHECK ((("source" = 'users'::"text" AND "user_segment" IS NOT NULL) OR ("source" <> 'users'::"text" AND "user_segment" IS NULL)));

COMMENT ON COLUMN "public"."email_campaign_batches"."user_segment" IS 'Segmento da origem users. past_due fica fora de active_pro e ex_pro (cliente em recuperacao de pagamento), entrando apenas em all.';

COMMIT;
