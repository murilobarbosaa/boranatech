-- Remove a fonte Sympla órfã de content_sources.
-- A integração nunca escreveu na tabela events (já dropada na Migration-2b)
-- e o código relacionado foi removido no commit anterior.
-- content_sync_logs.source_id tem ON DELETE CASCADE → logs vinculados (se houver)
-- são removidos automaticamente.

BEGIN;

DELETE FROM public.content_sources WHERE code = 'sympla';

COMMIT;
