-- processed_at em billing_events: separa "ja processei este evento" de "ja vi
-- este id".
--
-- O dedup atual trata a PRESENCA da linha como prova de processamento concluido.
-- Isso so vale porque a falha apaga a linha no catch de compensacao
-- (providers/stripe.ts). Mas esse DELETE e silencioso em dois niveis: o
-- supabase-js devolve { error } em vez de lancar (e o retorno nem era lido), e o
-- try/catch em volta so pega erro de rede. Se ele falhar, a linha sobrevive a um
-- processamento que NAO concluiu, e o retry da Stripe e descartado como
-- duplicata. Resultado: pagamento perdido em silencio.
--
-- O cenario nao e teorico e e CORRELACIONADO: banco instavel faz o processamento
-- falhar E o DELETE de compensacao falhar na mesma janela. Com os throws
-- deliberados do handler (pagamento confirmado que nao pode ser aplicado), a
-- frequencia de uso desse caminho sobe, entao este carimbo e pre-requisito
-- daquilo, nao melhoria futura.
--
-- Regra nova: linha COM processed_at = duplicata de verdade, ignora. Linha SEM
-- processed_at = processamento anterior morreu no meio, reprocessa.
--
-- ADITIVA: a coluna nao existia, nenhum dado existente e alterado ou perdido, e
-- o rollback e DROP COLUMN. O DEFAULT now() carimba as linhas que ja estao la, o
-- que e factualmente CORRETO: hoje, toda linha sobrevivente e de um evento
-- processado com sucesso (a falha apaga a linha, e o evento nao tratado tambem).
-- Sem isso, todo evento antigo viraria "reprocessavel" num resend.
-- O DEFAULT e removido logo em seguida para que as linhas NOVAS nascam nulas.

BEGIN;

ALTER TABLE public.billing_events
  ADD COLUMN IF NOT EXISTS processed_at timestamptz DEFAULT now();

ALTER TABLE public.billing_events
  ALTER COLUMN processed_at DROP DEFAULT;

COMMENT ON COLUMN public.billing_events.processed_at IS
  'Carimbo de conclusao do handler. NULL = processamento nao concluiu; o retry da Stripe deve reprocessar em vez de deduplicar.';

-- Diagnostico: "quais eventos ficaram pela metade".
CREATE INDEX IF NOT EXISTS billing_events_unfinished_idx
  ON public.billing_events(event_created_at DESC)
  WHERE processed_at IS NULL;

COMMIT;
