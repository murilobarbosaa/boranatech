-- Normaliza valores de area_slug nas tabelas core.
-- Antes desta migration, o seed gravava labels PT-BR ("Front-end") em colunas
-- que deveriam conter slugs ("frontend"). Endpoints como
-- /api/content/roadmaps?area=frontend nunca retornavam nada por esse motivo.
--
-- Mapeamento alinhado com docs/glossario.md e com client/src/lib/data.ts (areasTI).
-- Casos especiais:
--   "Geral", "Full Stack"     → NULL (sem área canônica hoje)
--   "Carreira"                → "carreira" (sentinela; não tem página /areas/carreira)
--   "Back-end / Dados"        → "backend"
--   "Produto Digital"         → "produto"
--   "Produto / Gestão"        → "gestao"
--   "IA / Dados"              → "dados"

-- ROADMAPS (12 linhas afetadas)
UPDATE roadmaps SET area_slug = 'frontend'       WHERE area_slug = 'Front-end';
UPDATE roadmaps SET area_slug = 'backend'        WHERE area_slug = 'Back-end';
UPDATE roadmaps SET area_slug = 'dados'          WHERE area_slug = 'Ciência de Dados';
UPDATE roadmaps SET area_slug = 'uxui'           WHERE area_slug = 'UX/UI Design';
UPDATE roadmaps SET area_slug = 'ia'             WHERE area_slug = 'Inteligência Artificial';
UPDATE roadmaps SET area_slug = 'produto'        WHERE area_slug = 'Produto Digital';
UPDATE roadmaps SET area_slug = 'ciberseguranca' WHERE area_slug = 'Cibersegurança';
UPDATE roadmaps SET area_slug = 'cloud'          WHERE area_slug = 'Cloud';
UPDATE roadmaps SET area_slug = 'qa'             WHERE area_slug = 'QA';
UPDATE roadmaps SET area_slug = 'mobile'         WHERE area_slug = 'Mobile';
UPDATE roadmaps SET area_slug = 'carreira'       WHERE area_slug = 'Carreira';
UPDATE roadmaps SET area_slug = NULL             WHERE area_slug = 'Geral';

-- COURSES (20 linhas afetadas, 11 valores distintos)
UPDATE courses SET area_slug = 'frontend'       WHERE area_slug = 'Front-end';
UPDATE courses SET area_slug = 'backend'        WHERE area_slug IN ('Back-end', 'Back-end / Dados');
UPDATE courses SET area_slug = 'dados'          WHERE area_slug = 'Ciência de Dados';
UPDATE courses SET area_slug = 'uxui'           WHERE area_slug = 'UX/UI Design';
UPDATE courses SET area_slug = 'ciberseguranca' WHERE area_slug = 'Cibersegurança';
UPDATE courses SET area_slug = 'cloud'          WHERE area_slug = 'Cloud';
UPDATE courses SET area_slug = 'devops'         WHERE area_slug = 'DevOps';
UPDATE courses SET area_slug = 'qa'             WHERE area_slug = 'QA';
UPDATE courses SET area_slug = 'gestao'         WHERE area_slug = 'Produto / Gestão';
UPDATE courses SET area_slug = NULL             WHERE area_slug = 'Full Stack';

-- PROJECTS (48 linhas afetadas, 10 valores distintos)
UPDATE projects SET area_slug = 'frontend' WHERE area_slug = 'Front-end';
UPDATE projects SET area_slug = 'backend'  WHERE area_slug = 'Back-end';
UPDATE projects SET area_slug = 'dados'    WHERE area_slug IN ('Ciência de Dados', 'IA / Dados');
UPDATE projects SET area_slug = 'uxui'     WHERE area_slug = 'UX/UI Design';
UPDATE projects SET area_slug = 'devops'   WHERE area_slug = 'DevOps';
UPDATE projects SET area_slug = 'qa'       WHERE area_slug = 'QA';
UPDATE projects SET area_slug = 'gestao'   WHERE area_slug = 'Produto / Gestão';
UPDATE projects SET area_slug = 'carreira' WHERE area_slug = 'Carreira';
UPDATE projects SET area_slug = NULL       WHERE area_slug = 'Full Stack';

-- Verificação manual (rodar depois pra conferir):
--   SELECT DISTINCT area_slug FROM roadmaps;
--   SELECT DISTINCT area_slug FROM courses;
--   SELECT DISTINCT area_slug FROM projects;
-- Esperado: apenas slugs canônicos + NULL.
