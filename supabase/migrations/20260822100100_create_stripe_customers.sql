-- Mapeamento user_id -> Stripe Customer, para PARAR de criar um Customer novo a
-- cada tentativa de pagamento.
--
-- Medido em 2026-07-28: 69 Customers para 61 e-mails distintos, 8 excedentes, 6
-- e-mails com mais de um. `createCheckout` passava `customer_email` e nunca
-- `customer`, e o Stripe Checkout cria um Customer NOVO em cada sessao em que a
-- pessoa submete dados. Consequencias reais: o painel fica com clusters de
-- Customer com spend R$ 0,00 (foi o que abriu a investigacao, lido como fraude), e
-- o Radar avalia risco pelo HISTORICO DO CUSTOMER -- entao toda retentativa
-- nascia sem historico bom nenhum, o que e o pior estado possivel para quem
-- acabou de ter um cartao recusado e esta tentando de novo.
--
-- POR QUE NAO reusar subscriptions.provider_customer_id: essa coluna so existe
-- para quem JA tem linha em subscriptions, e o dano e exatamente de quem FALHOU e
-- por isso nao tem linha. A fonte estaria vazia justamente para a populacao que
-- precisa dela. (E a unica linha de boleto tem provider_customer_id NULL, porque
-- mode:payment com customer_creation 'if_required' nao cria Customer.)
--
-- POR QUE NAO buscar por e-mail no caminho do checkout: `customer.search` usa
-- indice EVENTUALMENTE CONSISTENTE (atraso de ate ~1 min). O caso real e
-- retentativa em segundos (laurapdsz20 tentou 22:22, 22:28, 22:29), entao a busca
-- devolveria "nao achei" e criaria o duplicado de novo -- falhando exatamente na
-- janela que ela existiria para cobrir. Busca por e-mail fica so no BACKFILL.
--
-- (user_id, livemode) UNIQUE, nao user_id sozinho
-- ---------------------------------------------------------------------------
-- `livemode` nao e zelo: o `.env` de DESENVOLVIMENTO aponta para ESTE MESMO
-- projeto Supabase (vlcvaanlkqyxemrxsxzn) e hoje usa uma chave sk_live. No dia em
-- que alguem trocar para sk_test_ para testar com 4242 (o que ja foi sugerido em
-- rodadas anteriores), o `cus_` de TESTE seria gravado nesta tabela de PRODUCAO,
-- e producao passaria a resolver um Customer que nao existe em live. Com a chave
-- composta e o filtro por modo, os dois mundos coexistem sem se contaminar.
-- O valor vem de `customer.livemode` do proprio objeto da Stripe, nao do prefixo
-- da chave: quem afirma o modo e a API, nao a nossa leitura da string.
--
-- stripe_customer_id UNIQUE (global, sem o modo): um mesmo `cus_` nunca pode
-- pertencer a dois usuarios. E a barreira que impede o pior caso de cobranca no
-- Customer errado de ser representavel no banco.
--
-- PURAMENTE ADITIVA (tabela nova e vazia): isenta da janela destrutiva; rollback
-- e DROP TABLE. RLS deny-all (padrao de 20260611120000): so o backend via service
-- role le e escreve. O usuario NUNCA precisa ver seu id de Customer.

BEGIN;

CREATE TABLE IF NOT EXISTS public.stripe_customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_customer_id text NOT NULL,
  livemode boolean NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT stripe_customers_user_mode_key UNIQUE (user_id, livemode),
  CONSTRAINT stripe_customers_customer_key UNIQUE (stripe_customer_id)
);

-- set_updated_at ja e usado por 24 triggers nesta base; sem ele o updated_at
-- mentiria depois do primeiro UPDATE (o caso de Customer recriado).
DROP TRIGGER IF EXISTS stripe_customers_updated_at ON public.stripe_customers;
CREATE TRIGGER stripe_customers_updated_at
  BEFORE UPDATE ON public.stripe_customers
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.stripe_customers ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.stripe_customers FROM PUBLIC, anon, authenticated;

COMMIT;
