// Geracao de PDF e PNG do certificado a partir do SVG ja preenchido (Parte 2).
// RISCO DE INFRA: o Chromium nunca rodou no runtime do Railway (so no build da
// Vercel via prerender). Por isso: browser SINGLETON reutilizado (nao um por
// request), relaunch se morrer, timeout por geracao, e o chamador converte
// qualquer falha em 503 tratado. A VISUALIZACAO publica do certificado nao
// depende disto; so o DOWNLOAD.
import chromium from "@sparticuz/chromium";
import puppeteer, { type Browser, type Page } from "puppeteer-core";

// Dimensoes do desenho (viewBox do template) e do PNG de saida. O PNG mira
// ~1754px de largura: grande o suficiente para LinkedIn, metade do vetor.
const SVG_W = 3508;
const SVG_H = 2480;
const PNG_W = 1754;
const PNG_H = 1240;

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

// Documento minimo que enquadra o SVG no tamanho pedido. O SVG ja carrega as
// fontes embutidas (base64), entao nao ha requisicao externa; ainda assim
// esperamos document.fonts.ready para nao capturar com fonte de fallback.
function htmlWrap(svg: string, width: number, height: number): string {
  return (
    `<!doctype html><html><head><meta charset="utf-8">` +
    `<style>*{margin:0;padding:0}html,body{width:${width}px;height:${height}px;background:#fff}` +
    `svg{display:block;width:${width}px;height:${height}px}</style></head><body>${svg}</body></html>`
  );
}

async function generate<T>(
  svg: string,
  width: number,
  height: number,
  capture: (page: Page) => Promise<T>,
): Promise<T> {
  const browser = await getBrowser();
  const page = await browser.newPage();
  try {
    return await withTimeout(
      (async () => {
        await page.setViewport({ width, height, deviceScaleFactor: 1 });
        await page.setContent(htmlWrap(svg, width, height), {
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

// PDF vetorial no tamanho exato do desenho (sem margem, com fundo), pagina
// unica: cabe o SVG inteiro sem cortar.
export async function renderCertificatePdf(svg: string): Promise<Buffer> {
  return generate(svg, SVG_W, SVG_H, async (page) => {
    const pdf = await page.pdf({
      printBackground: true,
      width: `${SVG_W}px`,
      height: `${SVG_H}px`,
      pageRanges: "1",
      margin: { top: "0", right: "0", bottom: "0", left: "0" },
    });
    return Buffer.from(pdf);
  });
}

// PNG grande para postar nativamente em redes.
export async function renderCertificatePng(svg: string): Promise<Buffer> {
  return generate(svg, PNG_W, PNG_H, async (page) => {
    const shot = await page.screenshot({
      type: "png",
      clip: { x: 0, y: 0, width: PNG_W, height: PNG_H },
    });
    return Buffer.from(shot);
  });
}
