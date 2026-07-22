// Geracao de PDF e PNG do certificado a partir do SVG ja preenchido (Parte 2).
// RISCO DE INFRA: o Chromium nunca rodou no runtime do Railway (so no build da
// Vercel via prerender). Por isso: browser SINGLETON reutilizado (nao um por
// request), relaunch se morrer, timeout por geracao, e o chamador converte
// qualquer falha em 503 tratado. A VISUALIZACAO publica do certificado nao
// depende disto; so o DOWNLOAD.
import chromium from "@sparticuz/chromium";
import puppeteer, { type Browser, type Page } from "puppeteer-core";

// Dimensoes do PNG de saida. Mira ~1754px de largura (metade do vetor
// 3508x2480): grande o suficiente para LinkedIn, mantendo a proporcao 1.4145.
const PNG_W = 1754;
const PNG_H = 1240;

// PDF em A4 paisagem. A proporcao do SVG (3508/2480 = 1.4145) e praticamente a
// do A4 paisagem (297/210 = 1.4142): diferenca de 0.02%, imperceptivel, entao
// o certificado preenche a pagina sem distorcer nem deixar barra branca. Usamos
// tamanho de pagina PADRAO (A4) de proposito: com um tamanho gigante custom
// (ex 3508px = ~36in) o pipeline de impressao do Chromium renderiza o conteudo
// cortado/deslocado (o page.pdf nao respeita o viewport como o screenshot). O
// viewport abaixo e so o A4 paisagem em px @96dpi, para o layout bater.
const A4_LANDSCAPE_W = 1123;
const A4_LANDSCAPE_H = 794;

const GEN_TIMEOUT_MS = 15_000;

// Singleton: a promise do browser e memoizada. Se o browser desconectar
// (crash, OOM), o listener zera a promise e o proximo getBrowser relanca.
let browserPromise: Promise<Browser> | null = null;

// Receita de launch COPIADA do prerender (scripts/prerender.mjs): mesmos args
// do @sparticuz/chromium via defaultArgs, mesmo executablePath. headless
// "shell" explicito (o @sparticuz/chromium v149 nao expoe mais o getter
// chromium.headless que o prerender referencia; ali ele vira undefined). Nao
// inventar flags novas. Erro de launch propaga cru para o log da rota.
async function launchBrowser(): Promise<Browser> {
  const executablePath = await chromium.executablePath();
  const args = await puppeteer.defaultArgs({
    args: chromium.args,
    headless: "shell",
  });
  return puppeteer.launch({ args, executablePath, headless: "shell" });
}

async function getBrowser(): Promise<Browser> {
  if (browserPromise) {
    try {
      const existing = await browserPromise;
      if (existing.connected) return existing;
    } catch {
      // launch anterior falhou: cai para o relaunch abaixo.
    }
    browserPromise = null;
  }

  const pending = launchBrowser().then((browser) => {
    browser.on("disconnected", () => {
      if (browserPromise === pending) browserPromise = null;
    });
    return browser;
  });
  browserPromise = pending;

  try {
    return await pending;
  } catch (err) {
    if (browserPromise === pending) browserPromise = null;
    throw err;
  }
}

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`timeout: ${label}`));
    }, ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (err: unknown) => {
        clearTimeout(timer);
        reject(err instanceof Error ? err : new Error(String(err)));
      },
    );
  });
}

// Wrapper do PNG: o SVG no tamanho exato pedido, sem margem. O screenshot
// captura o viewport, entao esse dimensionamento explicito basta.
function pngHtmlWrap(svg: string, width: number, height: number): string {
  return (
    `<!doctype html><html><head><meta charset="utf-8">` +
    `<style>*{margin:0;padding:0}html,body{width:${width}px;height:${height}px;background:#fff}` +
    `svg{display:block;width:${width}px;height:${height}px}</style></head><body>${svg}</body></html>`
  );
}

// Wrapper do PDF: pagina A4 paisagem via @page, e o SVG preenchendo a caixa da
// pagina (position:fixed;inset:0 + 100%/100%). Diferente do PNG, o page.pdf usa
// o tamanho de PAGINA, nao o viewport; por isso o SVG e ancorado a caixa da
// pagina, nao a um body de px gigante.
function pdfHtmlWrap(svg: string): string {
  return (
    `<!doctype html><html><head><meta charset="utf-8">` +
    `<style>@page{size:A4 landscape;margin:0}` +
    `*{margin:0;padding:0}html,body{width:100%;height:100%;background:#fff}` +
    `svg{position:fixed;inset:0;width:100%;height:100%;display:block}</style>` +
    `</head><body>${svg}</body></html>`
  );
}

// O SVG ja carrega as fontes embutidas (base64), entao nao ha requisicao
// externa; ainda assim esperamos document.fonts.ready para nao capturar/imprimir
// com fonte de fallback.
async function generate<T>(
  html: string,
  viewportW: number,
  viewportH: number,
  capture: (page: Page) => Promise<T>,
): Promise<T> {
  const browser = await getBrowser();
  const page = await browser.newPage();
  try {
    return await withTimeout(
      (async () => {
        await page.setViewport({
          width: viewportW,
          height: viewportH,
          deviceScaleFactor: 1,
        });
        await page.setContent(html, {
          waitUntil: "load",
          timeout: GEN_TIMEOUT_MS,
        });
        await page.evaluate(async () => {
          await document.fonts.ready;
        });
        return await capture(page);
      })(),
      GEN_TIMEOUT_MS,
      "certificate generation",
    );
  } finally {
    await page.close().catch(() => {});
  }
}

// PDF vetorial: A4 paisagem, pagina unica, sem margem, com fundo. O certificado
// inteiro preenche a pagina proporcionalmente (ver constantes A4_*).
export async function renderCertificatePdf(svg: string): Promise<Buffer> {
  return generate(
    pdfHtmlWrap(svg),
    A4_LANDSCAPE_W,
    A4_LANDSCAPE_H,
    async (page) => {
      const pdf = await page.pdf({
        format: "A4",
        landscape: true,
        printBackground: true,
        pageRanges: "1",
        margin: { top: "0", right: "0", bottom: "0", left: "0" },
      });
      return Buffer.from(pdf);
    },
  );
}

// PNG grande para postar nativamente em redes.
export async function renderCertificatePng(svg: string): Promise<Buffer> {
  return generate(pngHtmlWrap(svg, PNG_W, PNG_H), PNG_W, PNG_H, async (page) => {
    const shot = await page.screenshot({
      type: "png",
      clip: { x: 0, y: 0, width: PNG_W, height: PNG_H },
    });
    return Buffer.from(shot);
  });
}
