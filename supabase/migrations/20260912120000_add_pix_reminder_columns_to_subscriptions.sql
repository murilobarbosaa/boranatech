-- Vencimento e fatura da cobranca Pix, e a idempotencia do lembrete de Pix
-- pendente.
--
-- O POST /payments do Asaas devolve `dueDate` e `invoiceUrl`, e ate aqui os dois
-- so viajavam na resposta HTTP do checkout: nenhuma escrita os guardava. Sem eles
-- o cron de lembrete nao sabe quando a cobranca vence nem tem a fatura para
-- oferecer como segundo caminho de pagamento, e o card do perfil cai no prazo do
-- QR, medido um ano alem do vencimento.
--
-- `raw_provider_payload` NAO serve para isso: o evento de fechamento
-- (PAYMENT_OVERDUE, PAYMENT_DELETED) sobrescreve a coluna inteira, e o dado
-- sumiria justamente quando a linha morre.
--
-- `pix_reminders_sent` e SEPARADO de `renewal_reminders_sent`. A linha ativada
-- herda aquele array para a regua de renovacao; um codigo de lembrete de compra
-- gravado nele poderia silenciar um lembrete de renovacao meses depois.
--
-- ADITIVA E ISENTA DA JANELA de migration destrutiva: tres colunas novas, duas
-- nulas e uma com default. Nao altera nem apaga dado existente e nao tem
-- backfill: as linhas criadas antes desta migration ficam com as duas primeiras
-- nulas.
--
-- ORDEM DE DEPLOY: o codigo que grava estas colunas sobe ANTES e tolera a
-- ausencia delas (update separado e best-effort em createCheckout).
--
-- Aplicada manualmente no SQL Editor pela Ana. Idempotente.

BEGIN;

ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS pix_due_date date;

ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS pix_invoice_url text;

ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS pix_reminders_sent text[] NOT NULL DEFAULT '{}';

COMMENT ON COLUMN public.subscriptions.pix_due_date IS
  'Vencimento da cobranca Pix, como o Asaas devolve em POST /payments (YYYY-MM-DD). Tipo date e nao timestamptz de proposito: o Asaas manda so a data e a cobranca vale o dia inteiro em Brasilia, e guardar um instante inventaria uma hora que o provedor nunca informou. Nulo nas linhas anteriores a esta coluna.';

COMMENT ON COLUMN public.subscriptions.pix_invoice_url IS
  'Fatura hospedada da cobranca Pix (invoiceUrl de POST /payments). Segundo caminho de pagamento no lembrete, para quem estiver sem sessao. Nulo nas linhas anteriores a esta coluna.';

COMMENT ON COLUMN public.subscriptions.pix_reminders_sent IS
  'Codigos dos estagios do lembrete de Pix pendente ja enviados. Idempotencia do cron de lembrete, separada de renewal_reminders_sent porque a linha ativada herda aquele array para a regua de renovacao.';

COMMIT;
