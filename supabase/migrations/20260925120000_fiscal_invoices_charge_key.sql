-- Chave de cobranca AGNOSTICA DE PROVEDOR em fiscal_invoices, para o Pix do
-- Asaas caber no pipeline de NFS-e.
--
-- SO E APLICAVEL COM NFSE_ENABLED DESLIGADO. A migration acrescenta duas
-- colunas NOT NULL, e o codigo em producao ANTES deste lote grava a tabela sem
-- elas. Toda escrita em fiscal_invoices passa por `env.nfseEnabled` (os ganchos
-- do webhook da Stripe, a reconciliacao, o retry e o destravamento do admin e
-- do /api/me) ou por `NFSE_ENABLED=true` no guard do script de homologacao;
-- com a emissao desligada nenhum escritor antigo roda, e a janela entre esta
-- migration e o deploy do codigo nao tem quem insira linha sem a chave. Com a
-- emissao LIGADA, um insert do codigo antigo nessa janela falharia no NOT NULL,
-- e a falha seria engolida pelo gancho (nota nao registrada, acesso intacto).
--
-- POR QUE UMA CHAVE NOVA E NAO REUSAR stripe_charge_id. A cobranca Pix nao tem
-- id da Stripe; a identidade dela e o id do pagamento no Asaas, o mesmo de
-- finance_transactions.provider_transaction_id. Enfiar esse id em
-- stripe_charge_id faria a coluna mentir sobre a origem do dinheiro.
--
-- POR QUE `payment_provider` E NAO `provider`. A coluna `provider` ja existe
-- nesta tabela e significa o provedor FISCAL (focus, mock). O provedor de
-- PAGAMENTO precisa de nome proprio.
--
-- FORMATO DA CHAVE: `<payment_provider>:<id no provedor>`. O check de coerencia
-- garante que a chave e o provedor nunca discordam. Quem monta a string e UM
-- helper no servidor (server/lib/fiscalChargeKey.ts); nenhum ponto a monta na
-- mao.
--
-- stripe_charge_id passa a aceitar nulo e segue preenchido nas linhas Stripe.
-- O unique dele continua: unique do Postgres convive com varios nulos.
--
-- Hoje a tabela tem zero linhas, mas o backfill esta escrito para qualquer
-- estado: toda linha que existir antes desta migration veio da Stripe, porque
-- a tabela so aceitava cobranca com stripe_charge_id.
--
-- ALTERA DADO (backfill) e restringe coluna: fora da isencao de migration
-- aditiva. Com zero linhas nao ha o que perder, mas a regra da janela vale pela
-- classe da migration, nao pelo tamanho da tabela.

begin;

alter table public.fiscal_invoices
  add column if not exists payment_provider text;

alter table public.fiscal_invoices
  add column if not exists charge_key text;

update public.fiscal_invoices
  set payment_provider = 'stripe',
      charge_key = 'stripe:' || stripe_charge_id
  where payment_provider is null
     or charge_key is null;

alter table public.fiscal_invoices
  alter column payment_provider set not null;

alter table public.fiscal_invoices
  alter column charge_key set not null;

alter table public.fiscal_invoices
  alter column stripe_charge_id drop not null;

alter table public.fiscal_invoices
  drop constraint if exists fiscal_invoices_payment_provider_check;
alter table public.fiscal_invoices
  add constraint fiscal_invoices_payment_provider_check
  check (payment_provider in ('stripe', 'asaas'));

alter table public.fiscal_invoices
  drop constraint if exists fiscal_invoices_charge_key_coerente_check;
alter table public.fiscal_invoices
  add constraint fiscal_invoices_charge_key_coerente_check
  check (starts_with(charge_key, payment_provider || ':'));

create unique index if not exists fiscal_invoices_charge_key_key
  on public.fiscal_invoices (charge_key);

comment on column public.fiscal_invoices.payment_provider is
  'stripe | asaas. Provedor de PAGAMENTO. Nao confundir com `provider`, que e o provedor fiscal.';
comment on column public.fiscal_invoices.charge_key is
  '<payment_provider>:<id da cobranca no provedor>. Chave de idempotencia da nota e da fila fiscal.';

commit;
