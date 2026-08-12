-- Notas fiscais de servico (NFS-e) por cobranca da Stripe. FASE 1: fundacao.
-- Nada e emitido de verdade ainda (o adapter do provedor real entra na Fase 3) e
-- todo o caminho vive atras do kill-switch NFSE_ENABLED, desligado por padrao.
--
-- ADITIVA: tabela nova e vazia, nenhuma coluna alterada, nenhum dado tocado.
-- Isenta da janela de migration destrutiva (CLAUDE.md); o rollback e o drop dela.
--
-- CHAVE DE IDEMPOTENCIA E DE JUNCAO: stripe_charge_id, unique. E a MESMA coluna
-- de finance_transactions.stripe_charge_id, entao "quanto entrou" e "que nota
-- saiu" se encontram sem tabela de ligacao, e sem depender de ordem: o
-- syncBalanceTransactions e o pipeline fiscal escrevem em tempos diferentes e
-- nenhum dos dois espera pelo outro. O unique e o que torna reentrega de webhook
-- um no-op em vez de nota duplicada, que e um problema fiscal, nao um bug de UI.
--
-- O TOMADOR E SNAPSHOT, NUNCA FK. Nota fiscal e documento: se a pessoa corrigir
-- o nome ou o CPF em profiles depois, a nota ja emitida NAO pode mudar junto.
-- Por isso os campos tomador_* sao copiados no instante da emissao e nunca mais
-- relidos de profiles.
--
-- user_id e subscription_id sao referencias LOGICAS, sem FK, e de proposito:
-- obrigacao fiscal sobrevive ao cadastro. Um `on delete cascade` aqui apagaria a
-- nota junto com a conta, e um `on delete set null` deixaria a nota sem dono
-- rastreavel. Nenhum dos dois e aceitavel para documento fiscal, entao a
-- integridade fica no codigo, que e onde a decisao pode ser tomada caso a caso.

create table if not exists public.fiscal_invoices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  subscription_id uuid,

  -- Origem do dinheiro na Stripe. O charge e a chave; invoice e payment intent
  -- entram para diagnostico e para reconciliacao futura (Fase 4).
  stripe_charge_id text not null unique,
  stripe_invoice_id text,
  stripe_payment_intent_id text,

  -- 'mock' na Fase 1; 'focus_nfe' quando o adapter real entrar. Fica null ate a
  -- primeira tentativa: antes disso nenhum provedor foi escolhido, e gravar um
  -- default seria afirmar algo que nao aconteceu.
  provider text,
  provider_invoice_id text,

  -- pending              : registrada, ainda nao processada.
  -- processing           : entregue ao provedor, aguardando retorno.
  -- issued               : nota emitida (estado TERMINAL).
  -- failed               : falha definitiva, nao retentavel.
  -- canceled             : nota cancelada (estado TERMINAL).
  -- blocked_missing_data : falta CPF/CNPJ ou nome do tomador. NAO e falha de
  --                        emissao: e falta de cadastro, e o tempo nao resolve
  --                        sozinho. Estado proprio para que "nao emitiu" nunca
  --                        se confunda com "emitiu", que e a classe de silencio
  --                        que este projeto ja pagou caro.
  status text not null default 'pending' check (
    status in (
      'pending', 'processing', 'issued', 'failed', 'canceled',
      'blocked_missing_data'
    )
  ),

  -- Valor BRUTO pago pelo cliente. A taxa da Stripe e despesa NOSSA e nao deduz
  -- da base da nota: quem contratou o servico pagou o bruto. Por isso este campo
  -- NAO deriva de finance_transactions.net_cents.
  --
  -- bigint, e nao integer, para casar com finance_transactions.gross_cents: as
  -- duas colunas guardam a mesma grandeza e sao lidas lado a lado na
  -- reconciliacao. Tipo diferente para o mesmo dado e convite a uma conversao
  -- implicita em algum join futuro.
  amount_cents bigint not null,
  plan_code text,
  service_description text,

  -- Identificacao da nota no municipio, preenchida pelo retorno do provedor.
  numero text,
  serie text,
  codigo_verificacao text,

  -- Caminhos no Supabase Storage (bucket privado), nao URLs: URL assinada expira
  -- e guardar uma seria guardar algo que deixa de valer. Preenchidos na Fase 3.
  pdf_path text,
  xml_path text,

  error_code text,
  error_message text,
  attempts integer not null default 0,
  issued_at timestamptz,

  -- Snapshot do tomador, congelado na emissao. Ver o bloco de comentario acima.
  tomador_nome text,
  -- So digitos, CPF ou CNPJ. Sem unique: uma pessoa pode ter mais de uma conta,
  -- e mais de uma nota, pelo mesmo motivo que profiles.cpf nao tem unique.
  tomador_documento text,
  tomador_tipo_documento text check (tomador_tipo_documento in ('cpf', 'cnpj')),
  tomador_email text,
  tomador_endereco jsonb,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists fiscal_invoices_user_id_idx
  on public.fiscal_invoices (user_id);
create index if not exists fiscal_invoices_status_idx
  on public.fiscal_invoices (status);
create index if not exists fiscal_invoices_created_at_idx
  on public.fiscal_invoices (created_at);

-- updated_at automatico (reusa a funcao ja existente em remote_schema).
create trigger fiscal_invoices_set_updated_at
  before update on public.fiscal_invoices
  for each row execute function public.set_updated_at();

-- RLS: sem NENHUMA policy, nega tudo por padrao. So o service role (supabaseAdmin)
-- le e escreve. Nenhum acesso via anon/authenticated. Mesmo padrao de
-- finance_transactions, e aqui e mais forte: a tabela guarda CPF.
alter table public.fiscal_invoices enable row level security;
