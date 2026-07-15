-- Liga um lote de campanha (source='contact_list') a lista importada de origem.
-- Sem isso, apos a criacao do lote a associacao com a lista se perde (os e-mails
-- viram recipients e o batch guarda so source='contact_list'), e o envio nao teria
-- como saber qual contact_lists.footer_reason usar no rodape.
--
-- Nullable: so lotes de contact_list preenchem; waitlist, newsletter, users e
-- custom ficam null. Nenhum dado e alterado.

begin;

alter table public.email_campaign_batches
  add column if not exists contact_list_id uuid references public.contact_lists(id);

comment on column public.email_campaign_batches.contact_list_id is
  'Lista importada de origem quando source=contact_list. Usada no envio para buscar contact_lists.footer_reason. Null para as demais origens.';

commit;
