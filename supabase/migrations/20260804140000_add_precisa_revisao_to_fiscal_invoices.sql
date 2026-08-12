-- Marcador de REVISAO HUMANA em notas fiscais (Fase 4 da NFS-e).
--
-- ADITIVA: coluna nova, nullable com default, nenhum dado tocado. Isenta da
-- janela de migration destrutiva; o rollback e o drop da coluna.
--
-- POR QUE UMA COLUNA E NAO UM STATUS NOVO. Os estados de `status` descrevem
-- onde a nota esta no PIPELINE (pending, processing, issued, failed, canceled,
-- blocked_missing_data), e sao mutuamente exclusivos. "Precisa de revisao" e
-- ortogonal a isso: uma nota EMITIDA com reembolso parcial precisa de revisao e
-- continua emitida; uma nota cujo cancelamento a prefeitura recusou precisa de
-- revisao e TAMBEM continua emitida. Espremer isso em `status` obrigaria a
-- escolher entre perder o estado do pipeline e inventar estados combinados
-- ('issued_precisa_revisao'), que multiplicam a cada motivo novo.
--
-- Os dois casos que ligam a flag hoje, ambos em server/lib/fiscalRefund.ts:
--   1. reembolso PARCIAL de uma nota emitida (substituicao de nota e decisao
--      caso a caso, e automatizar isso erraria em silencio);
--   2. cancelamento RECUSADO pela prefeitura (tipicamente fora do prazo
--      municipal), onde a nota continua valendo e alguem precisa resolver.

alter table public.fiscal_invoices
  add column if not exists precisa_revisao boolean not null default false;

-- Indice PARCIAL: a consulta do admin pergunta "quais precisam de revisao?", e
-- essas sao poucas por construcao. Um indice sobre a coluna inteira gastaria
-- espaco indexando milhares de `false` que ninguem consulta.
create index if not exists fiscal_invoices_precisa_revisao_idx
  on public.fiscal_invoices (precisa_revisao)
  where precisa_revisao;

comment on column public.fiscal_invoices.precisa_revisao is
  'Exige decisao humana (reembolso parcial, cancelamento recusado). Ortogonal ao status.';
