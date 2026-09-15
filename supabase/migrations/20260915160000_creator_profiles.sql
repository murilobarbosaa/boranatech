-- Perfil de creator (lote 08): redes declaradas e a chave Pix de comissao.
--
-- 1. creator_profiles: o @ do Instagram e do TikTok, os seguidores DECLARADOS
--    pelo proprio creator (sem API das redes, sem OAuth) e o consentimento de
--    aparecer para outros creators. 1:1 com o usuario. O consentimento nasce
--    desligado: o calendario do lote 11 le isso, e ninguem aparece para outro
--    creator sem ter dito que pode.
-- 2. creator_pix_keys: a chave Pix por onde a comissao sera paga (lote 09).
--    Tabela SEPARADA de proposito: e dado sensivel (uma chave do tipo cpf e o
--    proprio CPF), e assim a leitura mascarada e a revelacao auditada ficam
--    confinadas num arquivo so (server/lib/creatorProfile.ts).
--
-- As duas com RLS ligada e sem policy nem privilegio para anon e authenticated,
-- igual a creator_events (20260913120000): so o servidor le e escreve, pelo
-- service_role. Sem trigger de updated_at: o servidor grava o instante.
--
-- ON DELETE CASCADE nas duas: a exclusao de conta e o `auth.admin.deleteUser`
-- de DELETE /api/me (server/routes/me.ts), e o cascade apaga perfil e chave
-- junto com o usuario, sem entrar em lista nenhuma.
--
-- Puramente aditiva (duas tabelas novas e vazias): isenta da janela de
-- migration destrutiva. Rollback e o drop das duas.

BEGIN;

CREATE TABLE public.creator_profiles (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  instagram_handle text NULL,
  tiktok_handle text NULL,
  instagram_followers integer NULL CHECK (instagram_followers >= 0),
  tiktok_followers integer NULL CHECK (tiktok_followers >= 0),
  followers_updated_at timestamptz NULL,
  visible_to_creators boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.creator_profiles ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.creator_profiles FROM PUBLIC, anon, authenticated;

COMMENT ON TABLE public.creator_profiles IS
  'Perfil de creator: @ do Instagram e do TikTok, seguidores declarados pelo proprio creator e o consentimento de aparecer para outros creators. Escrito apenas pelo server.';

CREATE TABLE public.creator_pix_keys (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  key_type text NOT NULL
    CHECK (key_type IN ('cpf', 'cnpj', 'email', 'telefone', 'aleatoria')),
  key_value text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.creator_pix_keys ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.creator_pix_keys FROM PUBLIC, anon, authenticated;

COMMENT ON TABLE public.creator_pix_keys IS
  'Chave Pix de comissao do creator, normalizada pelo server. Dado sensivel: sai do server so mascarada, ou inteira pela revelacao auditada do admin.';

COMMIT;
