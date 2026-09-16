-- Publicacoes registradas pelo creator (lote 09).
--
-- O creator cola o link de um post ou reel do Instagram, ou de um video do
-- TikTok, e a plataforma REGISTRA. Nao ha verificacao de conteudo nem de
-- metricas (decisao do Murilo): a contagem de publicacoes registradas e um dos
-- insumos do ranking do lote 11, e o admin ve a lista e remove o que nao for
-- sobre a Bora na Tech.
--
-- UNICO POR CREATOR, e nao por publicacao: `(user_id, network, external_id)`.
-- Dois creators podem registrar o MESMO post (collab e o caso real); o mesmo
-- creator nao registra duas vezes. A constraint tem NOME proprio de proposito:
-- a rota responde 409 casando o 23505 pelo nome da constraint, no padrao de
-- `isUniqueViolationOn` (server/lib/certificates.ts), e nao por "qualquer
-- 23505", que confundiria esta colisao com qualquer outra da mesma tabela.
--
-- `external_id` e o identificador na rede (o code do Instagram, os digitos do
-- TikTok), extraido do link pelo shared. Guardar o id, e nao so a URL, e o que
-- torna a unicidade estavel: a mesma publicacao colada com e sem query string,
-- com e sem www, cai na mesma linha.
--
-- RLS ligada e sem policy nem privilegio para anon e authenticated, igual as
-- tabelas do lote 08: so o servidor le e escreve, pelo service_role.
--
-- ON DELETE CASCADE: a exclusao de conta e o `auth.admin.deleteUser` de
-- DELETE /api/me (server/routes/me.ts), e o cascade leva as publicacoes junto,
-- sem entrar em lista de limpeza nenhuma.
--
-- Puramente aditiva (tabela nova e vazia): isenta da janela de migration
-- destrutiva. Rollback e o drop dela.

BEGIN;

CREATE TABLE public.creator_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  network text NOT NULL CHECK (network IN ('instagram', 'tiktok')),
  kind text NOT NULL CHECK (kind IN ('post', 'reel', 'video')),
  external_id text NOT NULL,
  url text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT creator_posts_unico_por_creator
    UNIQUE (user_id, network, external_id)
);

-- A listagem do creator e a do admin sao sempre por dono e da mais recente
-- para a mais antiga; o indice cobre as duas.
CREATE INDEX creator_posts_user_created_idx
  ON public.creator_posts(user_id, created_at DESC);

ALTER TABLE public.creator_posts ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.creator_posts FROM PUBLIC, anon, authenticated;

COMMENT ON TABLE public.creator_posts IS
  'Publicacoes que o creator registrou (link de post ou reel do Instagram, ou de video do TikTok). Sem verificacao de conteudo: a contagem alimenta o ranking mensal e o admin remove o que nao for sobre a Bora na Tech. Escrito apenas pelo server.';

COMMIT;
