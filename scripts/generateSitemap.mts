// Gera client/public/sitemap.xml a partir das rotas estaticas fixas mais as
// rotas dinamicas derivadas de areasTI (data.ts): /areas/:slug e
// /areas/:parent/:subarea. O sitemap e a fonte unica de verdade do prerender
// (scripts/prerender.mjs), entao mante-lo derivado de data.ts evita drift toda
// vez que uma area ou subarea muda. Rodar com: pnpm generate:sitemap.
// Modo --check: regenera em memoria e compara byte a byte com o disco, falha se
// estiver desatualizado (roda no pnpm check).
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { areasTI } from "../client/src/lib/data";

const ORIGIN = "https://boranatech.com.br";

const OUT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "client",
  "public",
  "sitemap.xml",
);

// Rotas estaticas publicas, na ordem historica do sitemap. Nao derivam de
// nenhum array, entao ficam listadas a mao aqui. Qualquer rota nova nao ligada
// a areas (nova pagina, nova secao) entra nesta lista.
const STATIC_ROUTES = [
  "/",
  "/areas",
  "/roadmaps",
  "/cursos",
  "/plataformas",
  "/faculdades",
  "/dicionario",
  "/quiz-carreira",
  "/comparador",
  "/eventos",
  "/projetos",
  "/vagas",
  "/noticias",
  "/comunidades",
  "/mulheres",
  "/dicas",
  "/sobre",
  "/planos",
  "/certificados",
  "/cadastro",
  "/licenca",
  "/termos-de-uso",
  "/privacidade",
  "/perguntas-frequentes",
  "/tecnologias",
  "/tecnologias/por-area",
  "/tecnologias/ranking",
  "/empresas",
  "/salarios",
  "/entrevistas",
  "/portfolio",
  "/portfolio/analisar",
  "/curriculo",
  "/curriculo/analisar",
  "/curriculo/gerar",
  "/linkedin/analisar",
  "/plano-carreira",
  "/estudos/diario",
  "/freelance",
  "/evolucao",
  "/ingles",
  "/ingles/onde-estudar",
  "/ingles/no-trabalho",
  "/ingles/entrevista",
  "/ingles/vocabulario",
  "/ferramentas",
  "/ia",
  "/mentorias",
];

// Rotas de detalhe derivadas de areasTI, em ordem estavel (ordem do array de
// areas e, dentro de cada area, ordem do array de subareas). Nenhuma area ou
// subarea tem gating (Pro/despublicada) em data.ts: a pagina de detalhe sempre
// renderiza conteudo publico completo, entao todas entram.
const areaRoutes = areasTI.flatMap((area) => [
  `/areas/${area.slug}`,
  ...(area.subareas ?? []).map((sub) => `/areas/${area.slug}/${sub.slug}`),
]);

const routes = [...STATIC_ROUTES, ...areaRoutes];

const body = routes
  .map((route) => `  <url><loc>${ORIGIN}${route}</loc></url>`)
  .join("\n");

const content = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${body}
</urlset>
`;

const checkMode = process.argv.includes("--check");

if (checkMode) {
  const onDisk = existsSync(OUT) ? readFileSync(OUT, "utf8") : "";
  if (onDisk !== content) {
    console.error(
      "[generateSitemap] client/public/sitemap.xml esta desatualizado. Rode: pnpm generate:sitemap",
    );
    process.exit(1);
  }
  console.log(
    `[generateSitemap] sitemap.xml em sincronia (${routes.length} rotas).`,
  );
} else {
  writeFileSync(OUT, content);
  console.log(
    `[generateSitemap] ${routes.length} rotas (${STATIC_ROUTES.length} estaticas + ${areaRoutes.length} de areas/subareas) -> ${path.relative(process.cwd(), OUT)}`,
  );
}
