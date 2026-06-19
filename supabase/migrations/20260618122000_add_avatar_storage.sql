-- Avatar foto: coluna de path no storage + bucket publico de avatares.
--   avatar_storage_path  caminho do objeto no bucket 'avatars' (pra poder apagar depois).
--
-- Bucket publico: a URL publica e usada pra exibir avatar de terceiros. Limite de 5MB
-- e mime types no proprio bucket como camada extra. NAO criamos policies de
-- storage.objects: o cliente nunca escreve no storage; todo upload/delete e server-side
-- via service role (que ignora RLS) e a leitura e pela URL publica. Deny-by-default
-- para o cliente e o comportamento desejado.

BEGIN;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS avatar_storage_path text;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  5242880,
  ARRAY['image/png', 'image/jpeg', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

COMMIT;
