-- admin_refunds passa a registrar devolucao de QUALQUER provedor.
--
-- A tabela nasceu Stripe por construcao: `stripe_charge_id text NOT NULL` era a
-- ligacao com a cobranca, e `settlement` so admitia os tres caminhos da Stripe.
-- Com o Pix estornado pela API do Asaas (lote 2a), a devolucao precisa de um
-- registro com a mesma forca do da Stripe: quem pediu, quanto, por que, e o id
-- que o provedor devolveu.
--
-- MESMO DESENHO DA 20260902120000, que fez isso com finance_transactions:
-- colunas neutras ao lado das da Stripe, CHECK exigindo a coluna antiga so de
-- quem e da Stripe, e o par (provider, provider_refund_id) como identidade.
--
-- FASE EXPAND. `provider_transaction_id` e `provider_refund_id` ficam NULLABLE:
-- no instante da aplicacao o codigo em producao ainda nao os envia, e um NOT
-- NULL agora derrubaria a rota de reembolso da Stripe, que e a que funciona. O
-- contract vem depois do deploy, quando nao houver nulo.
--
-- ADITIVA E ISENTA DA JANELA de migration destrutiva: cria colunas, AFROUXA um
-- NOT NULL, amplia um CHECK e cria indice. Nao apaga e nao altera dado
-- preexistente.
--
-- Os tres `update` NAO sao excecao a isso: preenchem colunas criadas NESTA
-- MESMA TRANSACAO, ou seja, escrevem onde so havia NULL. Se alguem acrescentar
-- aqui um `update` sobre coluna preexistente, a isencao cai junto e o arquivo
-- passa a exigir janela.
--
-- O CHECK de `settlement` e AMPLIADO, nunca substituido por um mais frouxo: os
-- tres valores antigos continuam listados, e `asaas_api` entra ao lado. Trocar
-- por um CHECK que aceite qualquer texto abriria a porta para um settlement
-- digitado errado entrar sem ninguem ver.
--
-- Aplicada manualmente no SQL Editor pela Ana. Idempotente.

begin;

alter table public.admin_refunds
  add column if not exists provider text not null default 'stripe';

alter table public.admin_refunds
  add column if not exists provider_transaction_id text;

alter table public.admin_refunds
  add column if not exists provider_refund_id text;

alter table public.admin_refunds
  add column if not exists provider_status text;

update public.admin_refunds
  set provider_transaction_id = stripe_charge_id
  where provider_transaction_id is null;

update public.admin_refunds
  set provider_refund_id = stripe_refund_id
  where provider_refund_id is null and stripe_refund_id is not null;

update public.admin_refunds
  set provider_status = stripe_status
  where provider_status is null and stripe_status is not null;

alter table public.admin_refunds
  alter column stripe_charge_id drop not null;

alter table public.admin_refunds
  drop constraint if exists admin_refunds_provider_check;
alter table public.admin_refunds
  add constraint admin_refunds_provider_check
  check (provider in ('stripe', 'asaas'));

-- Linha da Stripe continua exigindo o id da cobranca dela.
alter table public.admin_refunds
  drop constraint if exists admin_refunds_stripe_charge_required_check;
alter table public.admin_refunds
  add constraint admin_refunds_stripe_charge_required_check
  check (provider <> 'stripe' or stripe_charge_id is not null);

alter table public.admin_refunds
  drop constraint if exists admin_refunds_settlement_check;
alter table public.admin_refunds
  add constraint admin_refunds_settlement_check
  check (settlement in ('stripe_api', 'stripe_dashboard', 'external', 'asaas_api'));

-- Identidade da DEVOLUCAO no provedor. Indice COMPLETO, nao parcial, pelo mesmo
-- motivo da 20260902120000: o PostgREST so infere ON CONFLICT em indice unico
-- sem WHERE. NULL nao colide com NULL, entao a linha `external` (que nao tem id
-- de estorno em provedor nenhum) e as linhas gravadas na janela de deploy nao
-- violam nada.
--
-- E ELE QUE PROTEGE DA CORRIDA no estorno de Pix: o id do estorno do Asaas e o
-- proprio payment id (um estorno integral por cobranca), entao dois pedidos
-- simultaneos para a mesma cobranca colidem aqui, no banco, e nao dependem da
-- pre-checagem da rota, que so cobre o duplo clique sequencial.
create unique index if not exists admin_refunds_provider_refund_key
  on public.admin_refunds (provider, provider_refund_id);

create index if not exists admin_refunds_provider_tx_idx
  on public.admin_refunds (provider, provider_transaction_id);

comment on column public.admin_refunds.provider_transaction_id is
  'Id da cobranca no provedor: charge id (Stripe) ou payment id (Asaas).';
comment on column public.admin_refunds.provider_refund_id is
  'Id do estorno no provedor. Stripe: refund id. Asaas estorno integral: o proprio payment id (um por cobranca).';
comment on column public.admin_refunds.provider_status is
  'Status devolvido pelo provedor no momento do pedido. Stripe: stripe_status. Asaas: REFUNDED, REFUND_REQUESTED ou REFUND_IN_PROGRESS.';

commit;
