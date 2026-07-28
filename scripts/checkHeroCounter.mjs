// Verificação de largura do contador do hero, em Chrome de verdade.
//
// Por que existe: o contador ficou travado em "+0" no mobile e as duas
// correções anteriores passaram verde. O motivo é que o defeito era GEOMÉTRICO
// (o alvo do IntersectionObserver caía dentro da faixa morta lateral criada por
// um rootMargin negativo), e jsdom não tem layout: lá todo getBoundingClientRect
// é zero e nenhum teste de unidade consegue enxergar a condição. Este script é
// o instrumento que roda no ambiente que genuinamente TEM layout.
//
// Uso:
//   pnpm dev:client                       # em outro terminal
//   pnpm check:hero-counter
//   BASE_URL=http://localhost:4173 pnpm check:hero-counter
//
// Não roda no CI porque depende de um Chrome instalado e de um servidor de pé.
// É verificação de release manual, versionada aqui de propósito: checklist que
// mora só na conversa some na primeira compactação de contexto.

import { createRequire } from "node:module";
import { existsSync } from "node:fs";

const require = createRequire(import.meta.url);
const { default: puppeteer } = await import("puppeteer-core");

const BASE_URL = process.env.BASE_URL ?? "http://localhost:3000";
const EXPECTED = process.env.HERO_COUNTER_VALUE ?? "2776";

// Larguras cobertas. As quatro do meio são as que quebravam em produção; 360
// entra porque é a largura "de teste" onde o bug NÃO aparecia, e foi por isso
// que ele sobreviveu a duas correções.
const WIDTHS = [320, 344, 360, 375, 390, 402, 412, 430, 480, 640, 768, 1024, 1440];

function resolveChrome() {
  if (process.env.CHROME_PATH) return process.env.CHROME_PATH;
  const candidates = [
    "/usr/bin/google-chrome",
    "/usr/bin/google-chrome-stable",
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser",
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  ];
  const found = candidates.find((p) => existsSync(p));
  if (!found) {
    console.error(
      "[hero-counter] Chrome não encontrado. Defina CHROME_PATH apontando para o binário.",
    );
    process.exit(1);
  }
  return found;
}

const res = await fetch(BASE_URL).catch(() => null);
if (!res || !res.ok) {
  console.error(
    `[hero-counter] ${BASE_URL} não respondeu. Suba o servidor antes (pnpm dev:client).`,
  );
  process.exit(1);
}

const browser = await puppeteer.launch({
  executablePath: resolveChrome(),
  headless: "new",
  args: ["--no-sandbox", "--disable-dev-shm-usage"],
});

// Lê o número renderizado no badge do hero. Devolve null se o badge não existir:
// badge ausente é FALHA, nunca "pulado". Um seletor que deixou de casar tem que
// derrubar a verificação, senão ela passa sobre uma superfície vazia.
async function readCounter(page) {
  return page.evaluate(() => {
    const badge = Array.from(document.querySelectorAll("span")).find((s) =>
      /pessoas já encontraram/.test(s.textContent || ""),
    );
    if (!badge) return null;
    const m = (badge.textContent || "").match(/\+\s*([\d.]+)\s*pessoas/);
    return m ? m[1].replace(/[.\s]/g, "") : null;
  });
}

async function sample({ width, reduced }) {
  const page = await browser.newPage();
  try {
    if (reduced) {
      await page.emulateMediaFeatures([
        { name: "prefers-reduced-motion", value: "reduce" },
      ]);
    }
    await page.setViewport({ width, height: 800, deviceScaleFactor: 1 });
    // Semeia o last-known-good pra o contador renderizar sem depender do backend.
    await page.evaluateOnNewDocument((v) => {
      localStorage.setItem("bnt_users_count", v);
    }, EXPECTED);
    await page.goto(BASE_URL, { waitUntil: "networkidle2", timeout: 30000 });

    // Movimento reduzido: tem que já estar no valor final, sem animar.
    await new Promise((r) => setTimeout(r, 250));
    const early = await readCounter(page);

    await new Promise((r) => setTimeout(r, 2500));
    const final = await readCounter(page);

    return { early, final };
  } finally {
    await page.close();
  }
}

const failures = [];

for (const reduced of [false, true]) {
  console.log(
    `\n[hero-counter] prefers-reduced-motion: ${reduced ? "reduce" : "no-preference"}`,
  );
  console.log("  largura | @250ms | final  | veredito");
  console.log("  --------|--------|--------|---------");
  for (const width of WIDTHS) {
    const { early, final } = await sample({ width, reduced });

    const problems = [];
    if (final === null) problems.push("badge não encontrado");
    else if (final !== EXPECTED) problems.push(`final=${final}`);
    // Movimento reduzido não pode animar: o valor final já tem que estar lá.
    if (reduced && early !== EXPECTED) problems.push(`animou (@250ms=${early})`);

    if (problems.length) failures.push({ width, reduced, problems });
    console.log(
      `  ${String(width).padEnd(7)} | ${String(early ?? "-").padEnd(6)} | ${String(
        final ?? "-",
      ).padEnd(6)} | ${problems.length ? "FALHOU: " + problems.join(", ") : "ok"}`,
    );
  }
}

await browser.close();

const total = WIDTHS.length * 2;
if (failures.length) {
  console.error(
    `\n[hero-counter] ${failures.length} de ${total} amostras falharam:`,
  );
  for (const f of failures) {
    console.error(
      `  - ${f.width}px (reduced=${f.reduced}): ${f.problems.join(", ")}`,
    );
  }
  process.exit(1);
}

console.log(
  `\n[hero-counter] ${total} amostras OK (${WIDTHS.length} larguras x 2 modos de movimento), todas em +${EXPECTED}.`,
);
