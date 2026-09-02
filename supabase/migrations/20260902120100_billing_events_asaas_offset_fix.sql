-- Corrige o desvio de 3h das linhas Asaas ja gravadas em billing_events:
-- raw.dateCreated vem em horario de Brasilia sem offset e foi persistido como
-- UTC (medido em 2026-09-02: event_created_at 10:11:33+00, received_at
-- 13:11:33+00). O codigo corrige todo evento novo desde o deploy do lote 1;
-- esta migration so acerta o historico. Nao e pre-requisito de deploy.
--
-- UPDATE de dados: aplicar na janela 05h-09h com backup COMPLETED, conforme
-- CLAUDE.md. Esperado em 2026-09-02: 6 linhas. A guarda pela diferenca contra
-- received_at protege linhas entregues com atraso real.

begin;

update public.billing_events
  set event_created_at = event_created_at + interval '3 hours'
  where provider = 'asaas'
    and event_created_at is not null
    and received_at - event_created_at
        between interval '2 hours 55 minutes' and interval '3 hours 5 minutes';

commit;
