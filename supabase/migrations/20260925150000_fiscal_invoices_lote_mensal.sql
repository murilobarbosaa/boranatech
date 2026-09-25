-- Regras de emissao do contador (lote FISCAL-REGRAS 01): registro imediato,
-- emissao no LOTE MENSAL, valor liquido de estornos e competencia da venda.
--
-- NAO ALTERA NEM REMOVE DADO. Troca o CHECK de `status` por um conjunto que
-- CONTEM o anterior (acrescenta 'awaiting_batch' e 'skipped'), acrescenta
-- colunas nullable ou com default e agenda um cron. Toda linha que existir hoje
-- continua valida sob o CHECK novo, entao a validacao do ADD nao tem o que
-- recusar. Isenta da janela de migration destrutiva; o rollback e o drop das
-- colunas, a volta do CHECK antigo (so possivel sem linhas nos estados novos) e
-- o unschedule do job.
--
-- ORDEM DE DEPLOY: codigo ANTES desta migration (CLAUDE.md). O codigo novo grava
-- 'awaiting_batch' e as colunas novas; aplicado antes dela, o insert falharia no
-- CHECK. Com NFSE_ENABLED desligado nenhum escritor roda, e a janela nao tem
-- quem insira linha.
--
-- POR QUE UM STATUS NOVO E NAO 'pending'. 'pending' ja significa "pronta para a
-- fila", e a reconciliacao REENFILEIRA toda linha 'pending' parada ha mais de
-- 6 horas (varredura C em server/lib/fiscalReconcile.ts). Reusar 'pending' para
-- "aguardando o lote" faria a rede de seguranca emitir no dia seguinte a venda,
-- que e exatamente a regra R2 quebrada sem nenhum erro. Estado proprio:
--
--   awaiting_batch : registrada no pagamento, esperando o lote do fim do mes.
--                    NINGUEM enfileira a partir daqui, exceto o lote.
--   skipped        : o lote decidiu NAO emitir (estorno integral antes do lote).
--                    TERMINAL. O motivo fica em error_code.

begin;

alter table public.fiscal_invoices
  drop constraint if exists fiscal_invoices_status_check;
alter table public.fiscal_invoices
  add constraint fiscal_invoices_status_check check (
    status in (
      'awaiting_batch', 'pending', 'processing', 'issued', 'failed',
      'canceled', 'blocked_missing_data', 'skipped'
    )
  );

-- COMPETENCIA: dia civil de Brasilia da VENDA (R6), calculado UMA vez no
-- registro pela fonte unica (shared/brasiliaDay.ts). `date` e nao timestamptz:
-- e um dia civil, e guardar instante reabriria a pergunta de fuso em cada
-- leitor. E ela que decide em qual lote a nota entra e a data que vai na nota;
-- o dia em que o lote rodou nao aparece em lugar nenhum.
alter table public.fiscal_invoices
  add column if not exists competencia date;

-- MEIO DE PAGAMENTO da cobranca (R1), como a nota o classificou. Registro, nao
-- filtro: cobranca de meio fora de NFSE_MEIOS_EMISSAO nem chega a virar linha.
alter table public.fiscal_invoices
  add column if not exists meio_pagamento text;
alter table public.fiscal_invoices
  drop constraint if exists fiscal_invoices_meio_pagamento_check;
alter table public.fiscal_invoices
  add constraint fiscal_invoices_meio_pagamento_check
  check (meio_pagamento in ('cartao', 'pix', 'boleto'));

-- ESTORNADO ATE AGORA, acumulado, em centavos positivos (R5). Mantido pelo
-- funil unico de estorno (server/lib/fiscalRefund.ts) enquanto a nota NAO foi
-- emitida. So cresce: o funil grava o maior acumulado ja visto.
alter table public.fiscal_invoices
  add column if not exists refunded_cents bigint not null default 0;
alter table public.fiscal_invoices
  drop constraint if exists fiscal_invoices_refunded_cents_check;
alter table public.fiscal_invoices
  add constraint fiscal_invoices_refunded_cents_check
  check (refunded_cents >= 0);

-- VALOR QUE FOI PARA A NOTA, congelado na emissao junto com o tomador. O bruto
-- continua em amount_cents; as duas colunas lado a lado respondem "quanto foi
-- estornado antes da nota" sem reconsultar nada.
alter table public.fiscal_invoices
  add column if not exists valor_liquido_cents bigint;

-- Linha esperando o lote SEM competencia nunca seria selecionada por lote
-- nenhum (o filtro e por competencia), e ficaria parada em silencio. O banco
-- recusa esse estado em vez de deixar o codigo lembrar.
alter table public.fiscal_invoices
  drop constraint if exists fiscal_invoices_awaiting_batch_competencia_check;
alter table public.fiscal_invoices
  add constraint fiscal_invoices_awaiting_batch_competencia_check
  check (status <> 'awaiting_batch' or competencia is not null);

create index if not exists fiscal_invoices_status_competencia_idx
  on public.fiscal_invoices (status, competencia);

comment on column public.fiscal_invoices.competencia is
  'Dia civil de Brasilia da venda (nao do lote). Decide o lote e vai na nota.';
comment on column public.fiscal_invoices.meio_pagamento is
  'cartao | pix | boleto. Classificado no registro; ver NFSE_MEIOS_EMISSAO.';
comment on column public.fiscal_invoices.refunded_cents is
  'Acumulado estornado antes da emissao, centavos positivos. So cresce.';
comment on column public.fiscal_invoices.valor_liquido_cents is
  'Valor enviado na nota (bruto menos estornos), congelado na emissao.';

-- LOTE MENSAL. pg_cron nao expressa "ultimo dia do mes", entao o job roda TODO
-- DIA e o handler decide pelo dia de Brasilia (server/lib/fiscalRegras.ts).
--
-- 02:00 UTC = 23:00 de Brasilia com o offset de hoje (UTC-3, sem horario de
-- verao). O handler NAO usa este horario para decidir o mes: ele le o dia
-- civil de Brasilia do instante em que roda, e e por isso que 02:00Z de 01/11
-- dispara o lote de OUTUBRO. Se o horario de verao voltar, 02:00Z vira 00:00 do
-- dia seguinte e o lote do mes deixa de disparar sozinho: o acionamento manual
-- (?mes=AAAA-MM) cobre, e o horario precisa ser revisto aqui.
select cron.unschedule(jobid)
from cron.job
where jobname = 'fiscal-monthly-batch';

select cron.schedule(
  'fiscal-monthly-batch',
  '0 2 * * *',
  $$SELECT public.call_cron_endpoint('/api/cron/fiscal-monthly-batch')$$
);

commit;
