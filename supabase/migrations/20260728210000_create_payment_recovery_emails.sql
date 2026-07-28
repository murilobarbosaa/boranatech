-- Log APPEND-ONLY dos e-mails de recuperacao de pagamento recusado.
--
-- A regua (aprovada em 2026-07-28): debounce de 30 min de silencio, no maximo 2
-- por episodio (o segundo em +72h), teto de 1 por pessoa por 72h, e nunca para
-- quem converteu / esta em email_suppressions / tem e-mail invalido.
--
-- POR QUE UM LOG E NAO CONTADORES na billing_failed_payments
-- ---------------------------------------------------------------------------
-- 1. A regua e por PESSOA, nao por tentativa. helenadesouza22 fez 10 tentativas
--    em 1 hora: sao 10 linhas em billing_failed_payments e deve sair UM e-mail.
--    Contador por linha nao consegue expressar isso.
-- 2. Contador agregado mutavel e a forma que JA falhou nesta base: um backfill
--    incrementou em vez de recalcular por atribuicao e dobrou o valor na execucao
--    real. Log append-only nao tem esse modo de falha: a resposta vem de um
--    count() sobre fatos, e reprocessar nao soma duas vezes.
--
-- UNIQUE (email, stage): torna o envio IDEMPOTENTE. Se o cron rodar duas vezes na
-- mesma janela (ou dois workers pegarem a mesma pessoa), o segundo INSERT
-- conflita e o e-mail nao sai. A guarda de "ja mandei" e o banco, nao a memoria
-- do processo.
--
-- email e a chave, nao user_id: a recusa pode chegar sem supabase_user_id no
-- metadata (foi o caso em varias das 53 medidas), e nesse caso o e-mail do
-- billing_details e a unica forma de alcancar a pessoa. user_id fica como
-- referencia quando existir.
--
-- PURAMENTE ADITIVA (tabela nova e vazia): isenta da janela destrutiva; rollback e
-- DROP TABLE. RLS deny-all: so o backend via service role le e escreve.

BEGIN;

CREATE TABLE IF NOT EXISTS public.payment_recovery_emails (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  supabase_user_id text,
  -- 1 = primeiro aviso (apos o debounce); 2 = ultimo lembrete (+72h).
  stage smallint NOT NULL,
  -- Qual recusa motivou, para o texto poder variar por motivo.
  failed_payment_id uuid REFERENCES public.billing_failed_payments(id) ON DELETE SET NULL,
  reason_bucket text,
  sent_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT payment_recovery_emails_stage_check CHECK (stage IN (1, 2)),
  CONSTRAINT payment_recovery_emails_email_stage_key UNIQUE (email, stage)
);

CREATE INDEX IF NOT EXISTS payment_recovery_emails_email_idx
  ON public.payment_recovery_emails(email, sent_at DESC);

ALTER TABLE public.payment_recovery_emails ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.payment_recovery_emails
  FROM PUBLIC, anon, authenticated;

COMMIT;
