-- Status e tipo escolhido das publicacoes registradas (creators, lote 10b).
--
-- Ate o lote 10 toda publicacao registrada contava no ranking na hora. Agora
-- ela NASCE `pendente` e so vale ponto depois que o admin confere, na lista
-- "Publicacoes para conferir" da aba Creators (o lote 11 conta so as
-- confirmadas). A conferencia grava `confirmed_at` e `confirmed_by`, e e
-- auditada em content_audit_logs pela rota.
--
-- STORY E A EXCECAO, e ela mora no CODIGO, nao no banco: o time confere os
-- stories todo dia fora da plataforma, entao o servidor grava story ja
-- `confirmado`, com `confirmed_at = now()` e `confirmed_by` nulo (confirmacao
-- automatica, sem admin). A regra e `statusInicialDaPublicacao` em
-- shared/creatorPost.ts. O banco so garante que o status e um dos dois.
--
-- `kind` ganha `story` (voltou a existir) e o creator passa a ESCOLHER o tipo
-- no registro; o link tem de ser daquele tipo (regra no shared). A constraint
-- de kind foi criada INLINE na 20260916100000_creator_posts.sql, entao o nome
-- e o que o Postgres deu sozinho, `creator_posts_kind_check`, conferido em
-- producao antes desta migration.
--
-- O default `pendente` alcanca as linhas que ja existem: a unica em producao
-- (um post de teste do Murilo) fica aguardando conferencia, que e o
-- comportamento certo, e ele confere no admin.
--
-- Puramente aditiva (colunas com default, constraint mais larga, indice novo):
-- isenta da janela de migration destrutiva. Rollback: drop das tres colunas e
-- do indice, e a constraint de kind de volta aos tres valores.

BEGIN;

ALTER TABLE public.creator_posts
  ADD COLUMN status text NOT NULL DEFAULT 'pendente'
    CONSTRAINT creator_posts_status_check
    CHECK (status IN ('pendente', 'confirmado')),
  ADD COLUMN confirmed_at timestamptz NULL,
  ADD COLUMN confirmed_by uuid NULL REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE public.creator_posts DROP CONSTRAINT creator_posts_kind_check;
ALTER TABLE public.creator_posts ADD CONSTRAINT creator_posts_kind_check
  CHECK (kind IN ('post', 'reel', 'story', 'video'));

-- A lista de conferencia do admin e "todas as pendentes, mais antigas
-- primeiro", de todos os creators; o indice por dono nao serve para ela.
CREATE INDEX creator_posts_status_idx
  ON public.creator_posts (status, created_at DESC);

COMMENT ON COLUMN public.creator_posts.status IS
  'pendente ate o admin conferir; confirmado vale ponto no ranking. Story nasce confirmado (o time confere stories fora da plataforma): regra em shared/creatorPost.ts, statusInicialDaPublicacao.';
COMMENT ON COLUMN public.creator_posts.confirmed_at IS
  'Quando foi confirmada. Story: o instante do registro. Nulo enquanto pendente.';
COMMENT ON COLUMN public.creator_posts.confirmed_by IS
  'Admin que confirmou. Nulo em story (confirmacao automatica) e enquanto pendente.';

COMMIT;
