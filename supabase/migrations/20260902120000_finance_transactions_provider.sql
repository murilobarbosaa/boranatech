-- finance_transactions passa a ser o ledger de TODOS os provedores.
--
-- Ate aqui a tabela era Stripe por construcao: stripe_balance_transaction_id
-- NOT NULL UNIQUE era a identidade da linha, e o Asaas (Pix, em producao desde
-- 2026-09-01) nunca escrevia aqui. Resultado: "Receita no periodo", a aba
-- Financeiro, o detector de cobranca sem dono e "Valor pago" por usuario nao
-- enxergavam Pix, enquanto "Assinantes Pro" e MRR (que leem subscriptions)
-- enxergavam. Dois cards na mesma tela descrevendo negocios diferentes.
--
-- FASE EXPAND. provider_transaction_id fica NULLABLE nesta migration: o codigo
-- em producao no momento da aplicacao ainda nao o envia, e um NOT NULL agora
-- derrubaria o cron de sync da Stripe das 04:20 e o botao manual. O NOT NULL
-- vem numa migration de contract depois do deploy, quando nao houver nulo.
--
-- ADITIVA E ISENTA DA JANELA de migration destrutiva: cria colunas, AFROUXA uma
-- restricao (NOT NULL sai), acrescenta CHECK e cria indice. Nao apaga e nao
-- altera dado existente, entao o rollback e o `drop` do que acabou de nascer.
--
-- O `update` da linha 40 NAO e excecao a isso: ele preenche uma coluna criada
-- NESTA MESMA TRANSACAO, ou seja, escreve onde so havia NULL. Se algum dia
-- alguem acrescentar aqui um `update` sobre coluna PREEXISTENTE, a isencao cai
-- junto, e o arquivo passa a exigir janela.
--
-- O reparo do desvio de 3h em billing_events, que morava aqui, saiu para
-- `20260902120100_billing_events_asaas_offset_fix.sql` justamente por isso: ele
-- e UPDATE sobre dado antigo, exige janela, e prende-lo a este arquivo
-- prenderia o deploy inteiro a uma janela de madrugada. Este e pre-requisito do
-- deploy; aquele nao e.
--
-- Aplicada manualmente no SQL Editor pela Ana. Idempotente.

begin;

alter table public.finance_transactions
  add column if not exists provider text not null default 'stripe';

alter table public.finance_transactions
  add column if not exists provider_transaction_id text;

update public.finance_transactions
  set provider_transaction_id = stripe_balance_transaction_id
  where provider_transaction_id is null;

alter table public.finance_transactions
  alter column stripe_balance_transaction_id drop not null;

alter table public.finance_transactions
  drop constraint if exists finance_transactions_provider_check;
alter table public.finance_transactions
  add constraint finance_transactions_provider_check
  check (provider in ('stripe', 'asaas'));

-- Linha da Stripe continua exigindo o id de balance transaction.
alter table public.finance_transactions
  drop constraint if exists finance_transactions_stripe_bt_required_check;
alter table public.finance_transactions
  add constraint finance_transactions_stripe_bt_required_check
  check (provider <> 'stripe' or stripe_balance_transaction_id is not null);

-- Identidade multi-provedor. Indice COMPLETO, nao parcial: o PostgREST so
-- infere ON CONFLICT em indice unico sem WHERE. NULL nao colide com NULL, entao
-- linhas antigas da Stripe sem provider_transaction_id (janela de deploy) nao
-- violam nada e sao preenchidas pelo proximo upsert do sync.
create unique index if not exists finance_transactions_provider_tx_key
  on public.finance_transactions (provider, provider_transaction_id);

create index if not exists finance_transactions_provider_occurred_idx
  on public.finance_transactions (provider, occurred_at);

comment on column public.finance_transactions.provider is
  'stripe | asaas. Quem cobrou. Ver finance_transactions_provider_check.';
comment on column public.finance_transactions.provider_transaction_id is
  'Id da transacao no provedor: balance transaction (Stripe) ou payment id (Asaas charge) ou event id (Asaas refund).';

commit;
