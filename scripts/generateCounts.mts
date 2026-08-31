// Gera client/src/lib/countsGenerated.ts com as contagens da plataforma
// derivadas dos arrays reais, em build time, para a home consumir os numeros
// sem arrastar data.ts, platformData e glossaryData pro grafo do boot.
// Rodar com: pnpm generate:counts (tsx resolve os paths do tsconfig).
// Modo --check: regenera em memoria e compara byte a byte com o disco, falha se
// estiver desatualizado (roda no pnpm check:generated). O gerador e
// deterministico: le arrays estaticos, sem relogio nem ordem instavel, entao a
// comparacao byte a byte so acusa quando a fonte mudou sem o gerado ser refeito.
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { areasTI, roadmaps } from "../client/src/lib/data";
import { dictionaryTerms } from "../shared/glossaryData";

const OUT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "client",
  "src",
  "lib",
  "countsGenerated.ts",
);

const content = `// GENERATED FILE. Do not edit. Run pnpm generate:counts
// Contagens derivadas dos arrays reais (data.ts e glossaryData.ts) em build
// time, para consumo no grafo do boot sem importar os data files.

export const areasCount = ${areasTI.length};
export const roadmapsCount = ${roadmaps.length};
export const dictionaryTermsCount = ${dictionaryTerms.length};
`;

const checkMode = process.argv.includes("--check");

if (checkMode) {
  const onDisk = existsSync(OUT) ? readFileSync(OUT, "utf8") : "";
  if (onDisk !== content) {
    console.error(
      "[generateCounts] client/src/lib/countsGenerated.ts esta desatualizado. Rode: pnpm generate:counts",
    );
    process.exit(1);
  }
  console.log(
    `[generateCounts] countsGenerated.ts em sincronia (areasCount=${areasTI.length} roadmapsCount=${roadmaps.length} dictionaryTermsCount=${dictionaryTerms.length}).`,
  );
} else {
  writeFileSync(OUT, content);
  console.log(
    `[generateCounts] areasCount=${areasTI.length} roadmapsCount=${roadmaps.length} dictionaryTermsCount=${dictionaryTerms.length} -> ${path.relative(process.cwd(), OUT)}`,
  );
}
