-- Permite source='contact_list' em email_campaign_batches (Frente C: listas
-- importadas). Recria a CHECK de source incluindo contact_list, mantendo TODOS
-- os valores antigos. So a constraint muda; nenhum dado e tocado.

begin;

-- (a) Remove a constraint atual (idempotente).
alter table public.email_campaign_batches
  drop constraint if exists email_campaign_batches_source_check;

-- (b) Recria com o conjunto COMPLETO de BATCH_SOURCES do codigo. Todos os valores
--     antigos (waitlist, newsletter, custom, users) continuam permitidos; so
--     contact_list e adicionado. Como as linhas existentes so usam os valores
--     antigos (todos presentes aqui), a validacao da constraint nao falha.
alter table public.email_campaign_batches
  add constraint email_campaign_batches_source_check
  check (
    source = any (
      array[
        'waitlist'::text,
        'newsletter'::text,
        'custom'::text,
        'users'::text,
        'contact_list'::text
      ]
    )
  );

comment on column public.email_campaign_batches.source is
  'Audiencia do lote: waitlist, newsletter, custom (lista avulsa), users ou contact_list (lista importada).';

commit;
