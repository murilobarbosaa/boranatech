-- Corpo em HTML customizado nas campanhas de e-mail.
--
-- email_campaigns.body_is_html: quando false (default), o corpo passa por
-- renderCampaignBodyHtml (escapa e converte paragrafos), comportamento atual.
-- Quando true, o corpo JA e HTML estilizado colado pelo admin e e injetado direto
-- no template (sem escapar), so com {nome} aplicado. O header, a imagem (hero) e o
-- rodape de compliance continuam automaticos nos dois casos. Linhas historicas
-- ficam false (comportamento inalterado).

BEGIN;

ALTER TABLE "public"."email_campaigns"
    ADD COLUMN IF NOT EXISTS "body_is_html" boolean DEFAULT false NOT NULL;

COMMENT ON COLUMN "public"."email_campaigns"."body_is_html" IS 'true: o corpo e HTML customizado injetado direto (sem escapar); false: texto processado por renderCampaignBodyHtml.';

COMMIT;
