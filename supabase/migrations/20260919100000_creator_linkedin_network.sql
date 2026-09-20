-- LinkedIn como rede de creator (creators, lote 10d).
--
-- As marcacoes do calendario e as publicacoes registradas passam a aceitar
-- `linkedin` alem de `instagram` e `tiktok`. Nenhuma coluna nova, nenhum
-- indice: so as duas CHECKs de rede ficam mais largas. A lista canonica no
-- codigo e `REDES_DE_CREATOR` em shared/creatorProfile.ts, que este lote torna
-- a fonte unica das duas tabelas.
--
-- Os nomes das constraints sao os que o Postgres deu sozinho quando as
-- CHECKs foram criadas inline (`<tabela>_<coluna>_check`), conferidos em
-- producao pelo pg_constraint antes desta migration.
--
-- O perfil (handle e seguidores do LinkedIn) fica FORA deste lote: sao outras
-- colunas e outras telas.
--
-- Puramente aditiva (constraint mais larga): isenta da janela de migration
-- destrutiva. Rollback: as duas CHECKs de volta a dois valores, o que so
-- funciona enquanto nenhuma linha `linkedin` existir.

BEGIN;

ALTER TABLE public.creator_posts DROP CONSTRAINT creator_posts_network_check;
ALTER TABLE public.creator_posts ADD CONSTRAINT creator_posts_network_check
  CHECK (network IN ('instagram', 'tiktok', 'linkedin'));

ALTER TABLE public.creator_calendar_events DROP CONSTRAINT creator_calendar_events_network_check;
ALTER TABLE public.creator_calendar_events ADD CONSTRAINT creator_calendar_events_network_check
  CHECK (network IN ('instagram', 'tiktok', 'linkedin'));

COMMIT;
