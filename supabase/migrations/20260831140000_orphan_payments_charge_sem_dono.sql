-- Permite que billing_orphan_payments registre PAGAMENTO SEM SESSAO DE CHECKOUT.
--
-- O DEFEITO QUE ISTO ABRE CAMINHO PARA FECHAR, medido em 2026-08-31. O detector
-- de orfaos varre `stripe.checkout.sessions.list` e exige sessao paga
-- (server/lib/orphanPayments.ts:586-589). Dinheiro que entra por outro caminho e
-- invisivel para ele POR CONSTRUCAO. Foi o caso do Walisson: R$ 29,90 pagos em
-- 21/08 contra uma invoice avulsa criada no painel da Stripe, sem sessao
-- nenhuma, e dez dias sem Pro. A cobranca estava na nossa `finance_transactions`
-- desde o dia do pagamento, com `user_id` nulo, e nada a ligava a uma fila.
--
-- A CHAVE DEIXA DE SER SO A SESSAO. A tabela nasceu chaveada por
-- `stripe_session_id text UNIQUE NOT NULL` (migration 20260727120000), o que e
-- correto para o achado que ela registrava e impossivel para este. Em vez de
-- inventar uma sessao falsa (que mentiria sobre a origem e envenenaria toda
-- leitura futura), a coluna vira nullable e ganha uma irma:
--
--   stripe_session_id  -> achado vindo de Checkout Session (o que ja existia)
--   stripe_charge_id   -> achado vindo de finance_transactions (o novo)
--
-- O CHECK garante EXATAMENTE UMA das duas preenchida. Sem ele a tabela aceitaria
-- linha sem chave nenhuma, e uma linha sem chave e uma linha que nunca casa no
-- upsert idempotente: ela duplicaria a cada execucao do job, em silencio.
--
-- OS INDICES UNICOS, E POR QUE O NOVO **NAO** E PARCIAL.
--
-- O de `stripe_session_id` ja existe e continua valendo: o UNIQUE do Postgres
-- aceita multiplos NULL, entao as linhas de charge (que tem sessao nula) nao
-- colidem entre si nele.
--
-- O de `stripe_charge_id` e um UNIQUE SIMPLES, sem `WHERE stripe_charge_id IS
-- NOT NULL`, e essa ausencia e deliberada. A primeira versao desta migration
-- criava o indice parcial, que parece a escolha obvia (indexa so o que
-- interessa, ocupa menos). Ela QUEBRAVA o job, e o defeito foi REPRODUZIDO em
-- 2026-08-31 num PostgreSQL 17.11 isolado, nao deduzido:
--
--   create unique index t_idx on t (c) where c is not null;
--   insert into t (c) values ('ch_1');
--   insert into t (c) values ('ch_1') on conflict (c) do nothing;
--   ERROR:  there is no unique or exclusion constraint matching the
--           ON CONFLICT specification
--   SQLSTATE = 42P10
--
-- A causa: o Postgres so infere um indice PARCIAL como arbitro do ON CONFLICT
-- quando a clausula carrega o predicado dele (`ON CONFLICT (c) WHERE c IS NOT
-- NULL`, o `index_predicate` da sintaxe do INSERT). E o PostgREST NAO emite
-- isso: o `onConflict` do supabase-js vira o parametro de query
-- `on_conflict=<colunas>` (`@supabase/postgrest-js` 2.105.3, `dist/index.cjs`
-- linha 4312), uma lista de colunas seca, sem lugar para predicado.
--
-- O UNIQUE simples faz as tres coisas que o parcial faria, e isso tambem foi
-- medido no mesmo teste: os multiplos NULL das linhas de sessao convivem (3
-- inseridas, 3 aceitas), o `on conflict (stripe_charge_id) do nothing` arbitra
-- normalmente, e a duplicata de verdade continua sendo recusada com 23505.
--
-- QUEM VIER DEPOIS e achar que parcial seria melhor: a resposta e esta, e o
-- sintoma de reintroduzir o predicado nao e um erro visivel na tela. O
-- `persistir` de server/lib/chargeSemDono.ts trata a falha do upsert como
-- fail-soft (`persisted: false`), entao o job continuaria detectando, gritando
-- 'partial' todo dia, e a fila simplesmente nunca receberia linha nenhuma.
--
-- CANDIDATO POR EMAIL, e as duas colunas dizem coisas diferentes de proposito:
--   candidate_user_id     -> conta cujo email bate com o do pagamento. E
--                            CANDIDATO, nunca atribuicao: o job so detecta
--                            (cabecalho da 20260727120000, linhas 9-10).
--   candidate_checked_at  -> quando a busca por email foi FEITA. Sem ela, nulo
--                            em candidate_user_id significaria ao mesmo tempo
--                            "procurei e nao achei" e "nao procurei", que sao
--                            estados opostos: o primeiro e informacao, o segundo
--                            e ausencia dela, e confundir os dois e a classe de
--                            defeito que este projeto documenta.
--
-- ADITIVA E ISENTA da janela de migration destrutiva: acrescenta colunas, AFROUXA
-- uma restricao (NOT NULL sai) e cria indice. Nao apaga, nao altera e nao
-- converte dado nenhum. As 2 linhas existentes tem sessao e nao tem charge,
-- entao satisfazem o CHECK novo sem tocar em nada.
--
-- Idempotente: todos os passos com IF EXISTS / IF NOT EXISTS.

BEGIN;

ALTER TABLE public.billing_orphan_payments
  ALTER COLUMN stripe_session_id DROP NOT NULL;

ALTER TABLE public.billing_orphan_payments
  ADD COLUMN IF NOT EXISTS stripe_charge_id text,
  ADD COLUMN IF NOT EXISTS candidate_user_id text,
  ADD COLUMN IF NOT EXISTS candidate_checked_at timestamptz;

ALTER TABLE public.billing_orphan_payments
  DROP CONSTRAINT IF EXISTS billing_orphan_payments_uma_chave;

ALTER TABLE public.billing_orphan_payments
  ADD CONSTRAINT billing_orphan_payments_uma_chave
  CHECK (num_nonnulls(stripe_session_id, stripe_charge_id) = 1);

-- SEM `WHERE`: ver o bloco "OS INDICES UNICOS" no cabecalho. Indice parcial
-- nao e arbitravel pelo ON CONFLICT que o PostgREST emite (42P10, reproduzido).
CREATE UNIQUE INDEX IF NOT EXISTS billing_orphan_payments_charge_id_idx
  ON public.billing_orphan_payments (stripe_charge_id);

COMMIT;
