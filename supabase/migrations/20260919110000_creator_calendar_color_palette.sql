-- Paleta do calendario dos creators cai de 15 para 7 cores (lote 10d).
--
-- Quinze cores sao demais para uma grade de pontinhos, e tres verdes nao
-- ajudam ninguem a se achar. Ficam sete, bem separadas no circulo: violet,
-- blue, cyan, emerald, orange, rose e fuchsia. Amber e yellow saem tambem por
-- outro motivo: o anel de "meu dia" e o amarelo da marca, e um marcador
-- amarelo com anel amarelo some.
--
-- O UPDATE remapeia cada cor que sai para a vizinha mais proxima em matiz
-- ANTES de apertar o CHECK, para o banco nunca ficar com uma cor que o check
-- recusa. Em producao, na data desta migration, havia 22 perfis em violet e 1
-- em cyan, entao ele nao alcanca linha nenhuma; existe pela ordem, nao pelo
-- dado. A lista canonica no codigo e `CORES_DO_CALENDARIO` em
-- shared/creatorProfile.ts, e o client mapeia cada uma para o marcador em
-- client/src/lib/corDoCalendario.ts.
--
-- O UPDATE e de remapeamento dentro do proprio dominio (nenhum dado se perde,
-- so muda de nome), sobre uma tabela pequena; isento da janela de migration
-- destrutiva pelo mesmo motivo das aditivas: o rollback e o check antigo de
-- volta, sem nada a restaurar.

BEGIN;

UPDATE public.creator_profiles SET calendar_color = CASE calendar_color
  WHEN 'green' THEN 'emerald'
  WHEN 'lime' THEN 'emerald'
  WHEN 'sky' THEN 'cyan'
  WHEN 'indigo' THEN 'violet'
  WHEN 'purple' THEN 'violet'
  WHEN 'pink' THEN 'rose'
  WHEN 'amber' THEN 'orange'
  WHEN 'yellow' THEN 'orange'
  ELSE calendar_color END
WHERE calendar_color NOT IN ('violet','blue','cyan','emerald','orange','rose','fuchsia');

ALTER TABLE public.creator_profiles DROP CONSTRAINT creator_profiles_calendar_color_check;
ALTER TABLE public.creator_profiles ADD CONSTRAINT creator_profiles_calendar_color_check
  CHECK (calendar_color IN ('violet','blue','cyan','emerald','orange','rose','fuchsia'));

COMMIT;
