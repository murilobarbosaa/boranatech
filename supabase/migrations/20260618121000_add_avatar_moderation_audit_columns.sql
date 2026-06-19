-- Avatar moderation: colunas de auditoria.
--   avatar_moderation_updated_at   quando o avatar_moderation_status mudou.
--   avatar_moderation_reviewed_by  admin que agiu; null em acao automatica (por contagem).

BEGIN;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS avatar_moderation_updated_at timestamptz,
  ADD COLUMN IF NOT EXISTS avatar_moderation_reviewed_by uuid
    REFERENCES auth.users(id) ON DELETE SET NULL;

COMMIT;
