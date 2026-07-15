-- Adiciona contact_lists.footer_reason: a frase de rodape que o DESTINATARIO le
-- no e-mail de campanha desta lista (ex: "Voce esta recebendo este e-mail porque
-- baixou nosso ebook."). E diferente de lgpd_note, que e nota INTERNA de origem
-- do consentimento e nunca e exibida a ninguem de fora.
--
-- Nullable de proposito: a lista Ebook-1 ja existe sem essa frase; o envio usa um
-- fallback neutro e honesto quando a coluna esta vazia. Nenhuma outra coluna e
-- tocada; nenhum dado e alterado.

begin;

alter table public.contact_lists
  add column if not exists footer_reason text;

comment on column public.contact_lists.footer_reason is
  'Frase de rodape exibida ao DESTINATARIO no e-mail de campanha desta lista. Diferente de lgpd_note (nota interna de origem). Nullable: o envio usa fallback neutro quando vazia.';

commit;
