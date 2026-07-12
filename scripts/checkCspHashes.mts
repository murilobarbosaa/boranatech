// Garante que o script-src das DUAS copias da policy contem o hash sha256 de
// cada script inline de client/public/lancamento.html. A landing e asset estatico
// (nao passa por nonce), entao o CSP so libera o inline por hash, e o mesmo
// arquivo e servido por dois caminhos: a Vercel (vercel.json) e o Express
// (server/app.ts, servindo dist/public). O hash quebra sempre que o conteudo do
// script muda (ex.: adicionar um creator ao array), entao esta verificacao roda
// no pnpm check e falha cedo, sem depender de memoria humana.
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const htmlPath = path.join(root, "client", "public", "lancamento.html");

// As duas fontes que declaram o script-src e precisam do mesmo hash do inline.
const sources = [
  { name: "vercel.json", file: path.join(root, "vercel.json") },
  { name: "server/app.ts", file: path.join(root, "server", "app.ts") },
] as const;

const html = readFileSync(htmlPath, "utf8");

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

function declaredHashes(content: string): string[] {
  return [...content.matchAll(/'sha256-[A-Za-z0-9+/=]+'/g)].map((m) => m[0]);
}

const expected = inlineScripts.map((c) => `'sha256-${sha256Base64(c)}'`);
const declaredBySource = sources.map((source) => ({
  name: source.name,
  hashes: declaredHashes(readFileSync(source.file, "utf8")),
}));

let failed = false;

// 1. Cada fonte precisa conter todo hash calculado do inline atual.
for (const source of declaredBySource) {
  const missing = expected.filter((hash) => !source.hashes.includes(hash));
  if (missing.length > 0) {
    failed = true;
    console.error(
      `[checkCspHashes] Hash do CSP desatualizado em ${source.name}: o script inline de client/public/lancamento.html mudou.`,
    );
    console.error(`Adicione ao script-src de ${source.name} o(s) hash(es):`);
    for (const hash of missing) console.error(`  ${hash}`);
  }
}

// 2. As duas fontes nao podem divergir entre si no conjunto de hashes.
const [first, ...rest] = declaredBySource;
for (const other of rest) {
  const onlyInFirst = first.hashes.filter((h) => !other.hashes.includes(h));
  const onlyInOther = other.hashes.filter((h) => !first.hashes.includes(h));
  if (onlyInFirst.length > 0 || onlyInOther.length > 0) {
    failed = true;
    console.error(
      `[checkCspHashes] ${first.name} e ${other.name} divergem no conjunto de hashes do script-src.`,
    );
    for (const hash of onlyInFirst)
      console.error(`  so em ${first.name}: ${hash}`);
    for (const hash of onlyInOther)
      console.error(`  so em ${other.name}: ${hash}`);
  }
}

if (failed) process.exit(1);

console.log(
  `[checkCspHashes] ${expected.length} hash(es) de script inline em sincronia com ${sources
    .map((s) => s.name)
    .join(" e ")}.`,
);
