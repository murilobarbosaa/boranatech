// Gera shared/roadmapV2/meta.generated.ts com os metadados leves das trilhas
// v2 (slug, titulo, contagens), derivados do agregado real em build time, pra
// listagem consumir sem arrastar o conteudo inteiro das trilhas pro bundle.
// Rodar com: pnpm gen:roadmap-meta (tsx resolve os paths do tsconfig).
// Modo --check: regenera em memoria e compara com o arquivo em disco (e, se
// client/src/lib/roadmapV2/loaders.ts existir, confere slug a slug que o mapa
// de loaders e o agregado estao em sincronia); divergencia sai com codigo 1.
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { roadmapsV2 } from "../shared/roadmapV2/content";
import type { RoadmapMeta } from "../shared/roadmapV2/meta";
import type { RoadmapNode } from "../shared/roadmapV2/types";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(ROOT, "shared", "roadmapV2", "meta.generated.ts");
const LOADERS = path.join(
  ROOT,
  "client",
  "src",
  "lib",
  "roadmapV2",
  "loaders.ts",
);

function hasProjectNode(nodes: RoadmapNode[]): boolean {
  return nodes.some(
    (node) =>
      Boolean(node.project) ||
      (node.children ? hasProjectNode(node.children) : false),
  );
}

// Mesma ordem do array roadmapsV2; saida deterministica (JSON.stringify com
// chaves em ordem de insercao fixa).
const meta: RoadmapMeta[] = roadmapsV2.map((roadmap) => ({
  slug: roadmap.slug,
  area: roadmap.area,
  ...(roadmap.kind ? { kind: roadmap.kind } : {}),
  title: roadmap.title,
  level: roadmap.level,
  description: roadmap.description,
  ...(roadmap.languages && roadmap.languages.length > 0
    ? { languages: roadmap.languages }
    : {}),
  sectionCount: roadmap.sections.length,
  stepCount: roadmap.sections.reduce(
    (sum, section) => sum + section.children.length,
    0,
  ),
  hasProject: roadmap.sections.some((section) =>
    hasProjectNode(section.children),
  ),
}));

const content = `// GENERATED FILE. Do not edit. Run pnpm gen:roadmap-meta
// Metadados leves das trilhas v2, derivados do agregado
// shared/roadmapV2/content pelo scripts/generateRoadmapMeta.mts. A listagem
// consome isso no lugar do conteudo completo.

import type { RoadmapMeta } from "./meta";

export const roadmapsMeta: RoadmapMeta[] = ${JSON.stringify(meta, null, 2)};
`;

// Validacao textual do mapa de loaders (client/src/lib/roadmapV2/loaders.ts):
// extrai as chaves do mapa por regex (com ou sem aspas, ja que o prettier
// desaspa chaves simples) e compara com os slugs do agregado nos dois
// sentidos. E leitura de texto simples, nao AST; suficiente porque o arquivo
// e um mapa literal com uma chave de loader por linha no formato
// `slug: () =>`. Se o formato do mapa mudar, esta checagem precisa acompanhar.
function checkLoaders(): string[] {
  if (!existsSync(LOADERS)) return [];
  const problems: string[] = [];
  const source = readFileSync(LOADERS, "utf8");
  const slugs = new Set(roadmapsV2.map((roadmap) => roadmap.slug));

  const keyPattern = /^\s*"?([a-z0-9-]+)"?:\s*\(\)\s*=>/gm;
  const loaderKeys = new Set<string>();
  for (const match of source.matchAll(keyPattern)) {
    loaderKeys.add(match[1]);
  }

  for (const slug of slugs) {
    if (!loaderKeys.has(slug)) {
      problems.push(`loaders.ts sem entrada para o slug "${slug}"`);
    }
  }
  for (const key of loaderKeys) {
    if (!slugs.has(key)) {
      problems.push(
        `loaders.ts tem entrada "${key}" que nao existe no agregado`,
      );
    }
  }
  return problems;
}

const checkMode = process.argv.includes("--check");

if (checkMode) {
  let failed = false;

  const onDisk = existsSync(OUT) ? readFileSync(OUT, "utf8") : "";
  if (onDisk !== content) {
    console.error(
      "[generateRoadmapMeta] shared/roadmapV2/meta.generated.ts esta desatualizado. Rode: pnpm gen:roadmap-meta",
    );
    failed = true;
  }

  for (const problem of checkLoaders()) {
    console.error(`[generateRoadmapMeta] ${problem}`);
    failed = true;
  }

  if (failed) process.exit(1);
  console.log("[generateRoadmapMeta] meta.generated.ts em sincronia.");
} else {
  writeFileSync(OUT, content);
  console.log(
    `[generateRoadmapMeta] ${meta.length} trilhas -> ${path.relative(process.cwd(), OUT)}`,
  );
}
