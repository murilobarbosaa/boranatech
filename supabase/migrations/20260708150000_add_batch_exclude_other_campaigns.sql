-- Flag por LOTE (nao por campanha): quando true, a selecao de destinatarios
-- do lote (modos next e selected) exclui e-mails que ja constam como
-- recipient sent em QUALQUER outra campanha, alem da deduplicacao por
-- campanha que ja existe. Fica na linha do batch porque o dispatch agendado
-- precisa aplicar o MESMO comportamento escolhido no agendamento, mesmo que
-- o disparo aconteca dias depois.

BEGIN;

ALTER TABLE "public"."email_campaign_batches"
    ADD COLUMN IF NOT EXISTS "exclude_other_campaigns" boolean DEFAULT false NOT NULL;

COMMENT ON COLUMN "public"."email_campaign_batches"."exclude_other_campaigns" IS 'Quando true, o dispatch pula e-mails ja enviados (status sent) por qualquer outra campanha.';

COMMIT;
