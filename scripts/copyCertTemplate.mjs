// Copia o template SVG do certificado para dist/templates/. O esbuild NAO
// empacota o .svg no bundle (server/lib/certificateRender.ts o le via fs em
// runtime), entao sem esta copia o fs.readFile quebraria em producao. Rodado no
// fim do `build`; o runtime do Railway (node dist/index.js a partir da raiz)
// acha o arquivo em dist/templates/ (candidato preferido do resolver).
import { copyFileSync, existsSync, mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const src = path.join(ROOT, "server", "templates", "certificate.svg");
const destDir = path.join(ROOT, "dist", "templates");

if (!existsSync(src)) {
  throw new Error(`[copyCertTemplate] template ausente: ${src}`);
}
mkdirSync(destDir, { recursive: true });
copyFileSync(src, path.join(destDir, "certificate.svg"));
console.log("[copyCertTemplate] certificate.svg -> dist/templates/");
