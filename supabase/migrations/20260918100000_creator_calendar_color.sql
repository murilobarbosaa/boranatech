-- Cor do creator no calendario compartilhado (creators, lote 10c).
--
-- Cada creator escolhe, na aba Perfil, a cor com que as marcacoes dele
-- aparecem na grade do calendario. Os valores sao as 15 familias pastel da
-- plataforma (o `TagFamily` de client/src/lib/tagPalette.ts); a lista canonica
-- para o codigo vive em shared/creatorProfile.ts (`CORES_DO_CALENDARIO`), e o
-- CHECK aqui e a mesma lista, para o banco recusar o que o bundle nao sabe
-- desenhar.
--
-- Default `violet`, que e a cor que o calendario ja usava para todo mundo:
-- quem nunca escolheu continua igual ao que via antes. NOT NULL de proposito:
-- "sem cor" nao e um estado, e o resolver do client nao precisa de fallback
-- para um nulo que o banco nao produz.
--
-- Nao e dado pessoal: sai no GET /calendar para todo creator, com ou sem
-- consentimento de visibilidade, porque a cor so existe para ser vista.
--
-- Puramente aditiva (coluna com default): isenta da janela de migration
-- destrutiva. Rollback e o drop da coluna.

BEGIN;

ALTER TABLE public.creator_profiles
  ADD COLUMN calendar_color text NOT NULL DEFAULT 'violet'
    CONSTRAINT creator_profiles_calendar_color_check
    CHECK (calendar_color IN ('violet','green','amber','pink','orange','emerald','sky','purple','fuchsia','indigo','lime','cyan','blue','rose','yellow'));

COMMENT ON COLUMN public.creator_profiles.calendar_color IS
  'Familia de cor pastel (tagPalette) das marcacoes deste creator no calendario compartilhado. Lista canonica em shared/creatorProfile.ts, CORES_DO_CALENDARIO.';

COMMIT;
