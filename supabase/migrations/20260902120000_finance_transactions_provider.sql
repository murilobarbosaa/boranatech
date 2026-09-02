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
-- Aplicada manualmente no SQL Editor pela Ana. Idempotente.
--
-- ATENCAO, JANELA DE MIGRATION DESTRUTIVA. Esta migration NAO e puramente
-- aditiva: o ultimo statement e um `update` de backfill em billing_events, e o
-- CLAUDE.md poe `update` de backfill na mesma classe de `drop column` e
-- `rename`. Entao ela roda entre 05h e 09h de Brasilia, na janela imediatamente
-- posterior ao backup diario, com o backup da noite anterior confirmado
-- COMPLETED, e o commit ou o PR registra `janela: <hora>, backup de <data>
-- confirmado COMPLETED`.
--
-- O reparo E reversivel por aritmetica (subtrair as mesmas 3 horas do mesmo
-- conjunto), e mesmo assim a janela vale: a reversao depende de a guarda de
-- intervalo ainda casar depois do UPDATE, e ela nao casa (a diferenca vira
-- zero). Ou seja, ler a linha errada duas vezes nao se desfaz sozinho.
--
-- SE A JANELA FOR UM PROBLEMA PARA A ORDEM DO DEPLOY, o corte natural e separar
-- o UPDATE final num arquivo proprio: tudo acima dele e aditivo e isento, e so
-- o reparo das 6 linhas espera pela janela. Nao foi feito aqui porque a
-- sequencia de deploy do lote trata os dois como um passo so.

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

-- Corrige o desvio de 3h das linhas Asaas ja gravadas em billing_events:
-- raw.dateCreated vem em horario de Brasilia sem offset e foi persistido como
-- UTC. A guarda pela diferenca contra received_at protege linhas entregues com
-- atraso real. Esperado em 2026-09-02: 6 linhas.
update public.billing_events
  set event_created_at = event_created_at + interval '3 hours'
  where provider = 'asaas'
    and event_created_at is not null
    and received_at - event_created_at
        between interval '2 hours 55 minutes' and interval '3 hours 5 minutes';

commit;
