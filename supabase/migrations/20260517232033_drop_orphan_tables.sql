-- Cleanup de tabelas órfãs identificadas durante a Fase Migration-1
-- (17/05/2026). Confirmadas como descartáveis pelo usuário:
--   - *_backup_20260516: snapshots manuais de 16/05, sem valor histórico
--   - events: sem refs no código, lixo de feature antiga
--
-- CASCADE é necessário pois pode haver FKs/views/policies dependentes.

BEGIN;

DROP TABLE IF EXISTS "public"."courses_backup_20260516" CASCADE;
DROP TABLE IF EXISTS "public"."projects_backup_20260516" CASCADE;
DROP TABLE IF EXISTS "public"."roadmaps_backup_20260516" CASCADE;
DROP TABLE IF EXISTS "public"."events" CASCADE;

COMMIT;
