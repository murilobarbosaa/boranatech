-- Remove o CHECK de avatar_border. As bordas Pro novas (pro-rgb, pro-holo,
-- pro-godzilla, pro-storm) nao estavam no CHECK antigo, entao salvar dava erro.
-- A validacao real passa a ser a allowlist do servidor (server/routes/me.ts +
-- server/lib/avatarBorders.ts) e o gate de Pro no write/resolver.
-- NAO aplicado automaticamente: rodar no SQL Editor apos revisao.

BEGIN;

ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_avatar_border_check;

COMMIT;
