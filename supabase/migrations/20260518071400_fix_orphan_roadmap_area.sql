-- Atribui area_slug ao roadmap 'zero-ti' que estava com valor vazio.
-- Identificado durante limpeza de débitos técnicos.

UPDATE public.roadmaps
SET area_slug = 'carreira'
WHERE slug = 'zero-ti'
  AND (area_slug IS NULL OR area_slug = '');
