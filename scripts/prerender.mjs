// Prerender das rotas publicas do sitemap sobre dist/public, rodado no
// postbuild. So executa em build da Vercel (ou com FORCE_PRERENDER=1); no
// Railway o guard abaixo pula tudo e o server continua servindo o shell SPA.
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

if (!process.env.VERCEL && !process.env.FORCE_PRERENDER) {
  console.log("[prerender] Fora da Vercel e sem FORCE_PRERENDER: pulando.");
  process.exit(0);
}

const { default: puppeteer } = await import("puppeteer-core");
const { default: chromium } = await import("@sparticuz/chromium");

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DIST = path.join(ROOT, "dist", "public");
const SITEMAP = path.join(ROOT, "client", "public", "sitemap.xml");
const EXCLUDED = new Set(["/areas", "/noticias"]);
const CONCURRENCY = 4;
const PAGE_TIMEOUT_MS = 15000;
const MAX_FAILURES = 5;

// ---------------------------------------------------------------------------
// Rotas: o sitemap e a fonte unica de verdade.
const sitemapXml = readFileSync(SITEMAP, "utf8");
const routes = [...sitemapXml.matchAll(/<loc>([^<]+)<\/loc>/g)]
  .map((m) => new URL(m[1]).pathname.replace(/\/+$/, "") || "/")
  .filter((route) => !EXCLUDED.has(route));

if (routes.length < 40) {
  throw new Error(
    `[prerender] Sanity check falhou: so ${routes.length} rotas no sitemap (esperado 40+).`,
  );
}

const shellPath = path.join(DIST, "index.html");
if (!existsSync(shellPath)) {
  throw new Error("[prerender] dist/public/index.html nao existe. Rode o vite build antes.");
}

// Shell intacto para o rewrite catch-all da Vercel (/app.html) e para o
// fallback do servidor local abaixo. Copiado ANTES de qualquer snapshot.
const shellHtml = readFileSync(shellPath, "utf8");
copyFileSync(shellPath, path.join(DIST, "app.html"));

// ---------------------------------------------------------------------------
// Pos-processamento: o react-helmet-async v3 deste projeto nao marca as tags
// com data-rh, entao a estatica e identificada pelo CONTEUDO das tags do
// shell. Quando o snapshot tem 2+ tags do mesmo tipo (title, description,
// og:*, twitter:*), remove a ocorrencia igual a do shell e mantem a dinamica.
const TAG_KINDS = [
  { kind: "title", regex: /<title[^>]*>[^<]*<\/title>/g, content: (t) => t.replace(/<[^>]+>/g, "") },
  ...["description"].map((name) => metaKind("name", name)),
];

function metaKind(attr, value) {
  return {
    kind: `${attr}:${value}`,
    regex: new RegExp(`<meta[^>]*${attr}="${value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}"[^>]*>`, "g"),
    content: (t) => t.match(/content="([^"]*)"/)?.[1] ?? "",
  };
}

function metaKindsFromShell(head) {
  const kinds = new Map();
  for (const m of head.matchAll(/<meta[^>]*(?:property|name)="((?:og|twitter):[^"]+)"[^>]*>/g)) {
    const key = m[1];
    const attr = key.startsWith("og:") ? "property" : "name";
    if (!kinds.has(key)) kinds.set(key, metaKind(attr, key));
  }
  return [...kinds.values()];
}

function headOf(html) {
  const end = html.indexOf("</head>");
  return end === -1 ? "" : html.slice(0, end);
}

const shellHead = headOf(shellHtml);
const allKinds = [...TAG_KINDS, ...metaKindsFromShell(shellHead)];
const shellContents = new Map(
  allKinds.map((k) => [
    k.kind,
    new Set([...shellHead.matchAll(k.regex)].map((m) => k.content(m[0]))),
  ]),
);

function dedupeHead(html) {
  const headEnd = html.indexOf("</head>");
  if (headEnd === -1) return html;
  let head = html.slice(0, headEnd);

  for (const k of allKinds) {
    const matches = [...head.matchAll(k.regex)].map((m) => m[0]);
    if (matches.length < 2) continue;
    const staticContents = shellContents.get(k.kind) ?? new Set();
    const hasDynamic = matches.some((t) => !staticContents.has(k.content(t)));
    const toRemove = hasDynamic
      ? matches.filter((t) => staticContents.has(k.content(t)))
      : matches.slice(1);
    for (const tag of toRemove) {
      head = head.replace(tag, "");
    }
  }
  return head + html.slice(headEnd);
}

// ---------------------------------------------------------------------------
// Servidor estatico local com fallback SPA (shell em memoria, imune a ordem
// de escrita dos snapshots).
const MIME = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".css": "text/css",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".woff2": "font/woff2",
  ".ico": "image/x-icon",
  ".webmanifest": "application/manifest+json",
  ".xml": "application/xml",
  ".txt": "text/plain",
};

const server = http.createServer((req, res) => {
  const urlPath = decodeURIComponent(new URL(req.url, "http://localhost").pathname);
  const file = path.join(DIST, urlPath);
  if (urlPath !== "/" && existsSync(file) && path.extname(file)) {
    res.writeHead(200, {
      "content-type": MIME[path.extname(file)] || "application/octet-stream",
    });
    res.end(readFileSync(file));
    return;
  }
  res.writeHead(200, { "content-type": "text/html" });
  res.end(shellHtml);
});

await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const base = `http://127.0.0.1:${server.address().port}`;

// ---------------------------------------------------------------------------
// Captura com puppeteer: 1 browser, CONCURRENCY abas, posthog bloqueado.
const browser = await puppeteer.launch({
  args: await puppeteer.defaultArgs({ args: chromium.args, headless: "shell" }),
  executablePath: await chromium.executablePath(),
  headless: chromium.headless,
});

let postHogBlocked = 0;
const failures = [];
const snapshots = new Map();
const startedAt = Date.now();

async function capture(route) {
  const page = await browser.newPage();
  try {
    await page.setRequestInterception(true);
    page.on("request", (req) => {
      if (new URL(req.url()).hostname.endsWith("posthog.com")) {
        postHogBlocked += 1;
        req.abort().catch(() => {});
        return;
      }
      req.continue().catch(() => {});
    });

    try {
      await page.goto(`${base}${route}`, {
        waitUntil: "networkidle2",
        timeout: PAGE_TIMEOUT_MS,
      });
    } catch (err) {
      if (err?.name === "TimeoutError") {
        console.warn(`[prerender] Timeout em ${route}, usando conteudo ja carregado.`);
      } else {
        throw err;
      }
    }

    snapshots.set(route, dedupeHead(await page.content()));
  } catch (err) {
    failures.push({ route, error: String(err) });
    console.warn(`[prerender] Falha em ${route}: ${err}`);
  } finally {
    await page.close().catch(() => {});
  }
}

const queue = [...routes];
await Promise.all(
  Array.from({ length: CONCURRENCY }, async () => {
    while (queue.length > 0) {
      await capture(queue.shift());
    }
  }),
);

await browser.close();
server.close();

// ---------------------------------------------------------------------------
// Escrita: rotas em dist/public/<rota>/index.html; a raiz por ultimo, ja que
// sobrescreve o proprio shell (preservado em app.html).
let totalBytes = 0;
const writable = [...snapshots.entries()].sort(([a]) => (a === "/" ? 1 : -1));
for (const [route, html] of writable) {
  const target =
    route === "/"
      ? path.join(DIST, "index.html")
      : path.join(DIST, route.slice(1), "index.html");
  mkdirSync(path.dirname(target), { recursive: true });
  writeFileSync(target, html);
  totalBytes += Buffer.byteLength(html);
}

const elapsed = ((Date.now() - startedAt) / 1000).toFixed(1);
const avgKb = snapshots.size ? Math.round(totalBytes / snapshots.size / 1024) : 0;
console.log(
  `[prerender] ${routes.length} rotas, ${snapshots.size} snapshots, ` +
    `${failures.length} falhas, media ${avgKb} kB, posthog bloqueados ${postHogBlocked}, ${elapsed}s.`,
);

if (failures.length > MAX_FAILURES) {
  console.error(`[prerender] ${failures.length} falhas (limite ${MAX_FAILURES}).`);
  process.exit(1);
}
