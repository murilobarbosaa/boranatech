// Gera o registro dos modulos v2 de projeto a partir dos ARQUIVOS em
// shared/projects/v2/. Antes disto, adicionar um projeto v2 exigia tocar tres
// lugares a mao (o modulo, PROJETOS_V2_IDS e o mapa de loaders) e o teste so
// avisava depois. Agora a fonte e o diretorio: criar <id>.ts e rodar
// `pnpm gen:projetos-v2`.
//
// Modo --check: regenera em memoria e compara byte a byte com o disco, saindo
// 1 se estiver desatualizado. Entra na cadeia do `pnpm check`, logo depois do
// generateRoadmapMeta.
//
// SEM NUMERAL de proposito: a contagem de modulos v2 muda a cada projeto
// migrado, e comentario que afirma numero fica errado no primeiro registro
// novo sem nada acusar. Quem quer o total le PROJETOS_V2_IDS.
import { existsSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DIR = path.join(ROOT, "shared", "projects", "v2");
const OUT_REGISTRY = path.join(DIR, "registry.generated.ts");
const OUT_ALL = path.join(DIR, "all.generated.ts");

// Arquivos de infraestrutura do proprio diretorio. Tudo que sobra e modulo de
// projeto, entao um arquivo novo com outro proposito aqui viraria "projeto" e
// quebraria o guard de id x nome de arquivo, que e o comportamento desejado:
// melhor falhar do que registrar em silencio.
const NAO_E_PROJETO = new Set([
  "types.ts",
  "index.ts",
  "all.ts",
  "registry.generated.ts",
  "all.generated.ts",
]);

const ids = readdirSync(DIR)
  .filter((nome) => nome.endsWith(".ts"))
  .filter((nome) => !NAO_E_PROJETO.has(nome))
  .filter((nome) => !nome.endsWith(".test.ts"))
  .filter((nome) => !nome.endsWith(".generated.ts"))
  .map((nome) => nome.slice(0, -".ts".length))
  .sort();

// Identificador JS valido a partir do id em kebab-case.
const varName = (id: string) =>
  id.replace(/-([a-z0-9])/g, (_, c: string) => c.toUpperCase());

const registry = `// GENERATED FILE. Do not edit. Run pnpm gen:projetos-v2
//
// Derivado dos arquivos de shared/projects/v2/. Para adicionar um projeto v2:
// criar shared/projects/v2/<id>.ts e rodar o gerador.
import type { ProjetoV2Detalhe } from "./types";

export const PROJETOS_V2_IDS = [
${ids.map((id) => `  "${id}",`).join("\n")}
] as const;

export const loaders: Record<
  string,
  () => Promise<{ default: ProjetoV2Detalhe }>
> = {
${ids.map((id) => `  "${id}": () => import("./${id}"),`).join("\n")}
};
`;

const all = `// GENERATED FILE. Do not edit. Run pnpm gen:projetos-v2
//
// Importa TODOS os modulos v2 estaticamente. So para testes e para o server
// (que nao se importa com tamanho de bundle). O client NUNCA importa este
// arquivo: o guard em client/src/lib/projectsV2Import.test.ts afirma isso.
${ids.map((id) => `import ${varName(id)} from "./${id}";`).join("\n")}
import type { ProjetoV2Detalhe } from "./types";

export const PROJETOS_V2: ProjetoV2Detalhe[] = [
${ids.map((id) => `  ${varName(id)},`).join("\n")}
];
`;

const checkMode = process.argv.includes("--check");

if (checkMode) {
  let failed = false;
  for (const [arquivo, esperado] of [
    [OUT_REGISTRY, registry],
    [OUT_ALL, all],
  ] as const) {
    const onDisk = existsSync(arquivo) ? readFileSync(arquivo, "utf8") : "";
    if (onDisk !== esperado) {
      console.error(
        `[generateProjectsV2Registry] ${path.relative(ROOT, arquivo)} esta desatualizado. Rode: pnpm gen:projetos-v2`,
      );
      failed = true;
    }
  }
  if (failed) process.exit(1);
  console.log(
    `[generateProjectsV2Registry] registry.generated.ts e all.generated.ts em sincronia (${ids.length} modulo(s) v2).`,
  );
} else {
  writeFileSync(OUT_REGISTRY, registry);
  writeFileSync(OUT_ALL, all);
  console.log(
    `[generateProjectsV2Registry] ${ids.length} modulo(s) v2 -> ${path.relative(ROOT, OUT_REGISTRY)} + ${path.relative(ROOT, OUT_ALL)}`,
  );
}
