-- Avatar Pro: modo foto vs icone + moderacao por denuncia.
--
-- profiles ganha:
--   avatar_mode               'icon' (icone + cor, como hoje) ou 'photo'. Foto e
--                             icone/cor sao mutuamente exclusivos no resolvedor (etapa 2);
--                             borda continua ortogonal (vale nos dois modos).
--   avatar_moderation_status  'clean' -> 'pending_review' (foto escondida automaticamente
--                             ao bater o limiar de denunciantes distintos, reversivel) ->
--                             'removed' (admin confirma violacao e remove de vez).
--   avatar_upload_disabled    admin desabilita o upload de foto da conta ao remover.
--
-- avatar_reports guarda as denuncias. Leitura e acao de admin sao server-side via
-- service role (supabaseAdmin); o unico acesso de cliente e inserir a propria denuncia.

BEGIN;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS avatar_mode text NOT NULL DEFAULT 'icon'
    CONSTRAINT profiles_avatar_mode_check CHECK (avatar_mode IN ('icon', 'photo')),
  ADD COLUMN IF NOT EXISTS avatar_moderation_status text NOT NULL DEFAULT 'clean'
    CONSTRAINT profiles_avatar_moderation_status_check
      CHECK (avatar_moderation_status IN ('clean', 'pending_review', 'removed')),
  ADD COLUMN IF NOT EXISTS avatar_upload_disabled boolean NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS public.avatar_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  target_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reason text NOT NULL
    CONSTRAINT avatar_reports_reason_check CHECK (reason IN ('sexual', 'violence', 'spam', 'other')),
  status text NOT NULL DEFAULT 'open'
    CONSTRAINT avatar_reports_status_check CHECK (status IN ('open', 'closed')),
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT avatar_reports_no_self CHECK (reporter_user_id <> target_user_id)
);

-- No maximo uma denuncia ABERTA por par denunciante/alvo. Depois que o caso fecha,
-- o mesmo denunciante pode denunciar de novo.
CREATE UNIQUE INDEX IF NOT EXISTS avatar_reports_open_unique
  ON public.avatar_reports (reporter_user_id, target_user_id)
  WHERE status = 'open';

-- Ajuda na fila de revisao e na contagem de denunciantes distintos por alvo.
CREATE INDEX IF NOT EXISTS avatar_reports_target_open_idx
  ON public.avatar_reports (target_user_id)
  WHERE status = 'open';

ALTER TABLE public.avatar_reports ENABLE ROW LEVEL SECURITY;

-- Denunciante insere a propria denuncia.
CREATE POLICY "avatar_reports_insert_own" ON public.avatar_reports
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = reporter_user_id);

-- A RLS controla quais LINHAS; o GRANT habilita o privilegio de INSERT no role.
GRANT INSERT ON public.avatar_reports TO authenticated;

-- De proposito NAO ha policy de select/update/delete para roles de cliente:
-- toda leitura e acao de admin acontece server-side via service role (supabaseAdmin).

COMMIT;
