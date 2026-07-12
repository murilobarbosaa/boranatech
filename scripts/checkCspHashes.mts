// Garante que o script-src do vercel.json contem o hash sha256 de cada script
// inline de client/public/lancamento.html. Como lancamento.html e asset estatico
// (nao passa por nonce do Express), o CSP so libera o inline por hash. O hash
// quebra sempre que o conteudo do script muda (ex.: adicionar um creator ao
// array), entao esta verificacao roda no pnpm check e falha cedo, sem depender de
// memoria humana.
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const htmlPath = path.join(root, "client", "public", "lancamento.html");
const vercelPath = path.join(root, "vercel.json");

const html = readFileSync(htmlPath, "utf8");
const vercel = readFileSync(vercelPath, "utf8");

// So scripts inline sem atributo (opener exatamente "<script>") precisam de hash.
// "<script src=...>" e coberto por 'self'; "<script type=application/ld+json>"
// nao e executavel. O hash cobre o conteudo exato entre as tags, byte a byte.
const inlineScripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(
  (m) => m[1],
);

if (inlineScripts.length === 0) {
  console.error(
    "[checkCspHashes] Nenhum script inline encontrado em lancamento.html. A extracao quebrou.",
  );
  process.exit(1);
}

function sha256Base64(content: string): string {
  return createHash("sha256").update(content, "utf8").digest("base64");
}

const expected = inlineScripts.map((c) => `'sha256-${sha256Base64(c)}'`);
const missing = expected.filter((hash) => !vercel.includes(hash));

if (missing.length > 0) {
  console.error(
    "[checkCspHashes] Hash do CSP desatualizado: o script inline de client/public/lancamento.html mudou.",
  );
  console.error(
    "Adicione ao script-src do vercel.json (Content-Security-Policy) o(s) hash(es):",
  );
  for (const hash of missing) console.error(`  ${hash}`);
  process.exit(1);
}

console.log(
  `[checkCspHashes] ${expected.length} hash(es) de script inline em sincronia com vercel.json.`,
);
