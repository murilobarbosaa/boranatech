import * as Sentry from "@sentry/react";
import * as pdfjsLib from "pdfjs-dist";
import workerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";

/**
 * Extração de texto de PDF, 100% no navegador.
 *
 * O arquivo NUNCA é enviado ao servidor: lemos o texto aqui e só o texto vai
 * para a análise. Valida tipo e tamanho antes de processar e exige um mínimo
 * de texto para não seguir silenciosamente com uma extração vazia.
 *
 * Usada pelo analisador de LinkedIn (via alias extractLinkedinPdf) e pelo
 * analisador de currículo.
 */

pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;

export const MAX_PDF_BYTES = 5 * 1024 * 1024;
export const MIN_TEXT_CHARS = 200;

export type PdfErrorCode =
  | "wrong_type"
  | "too_large"
  | "too_little_text"
  | "read_failed"
  | "browser_unsupported";

/**
 * O navegador aguenta o pdfjs 6?
 *
 * O `pdfjs-dist@6` chama `Promise.try` (ES2025) no despacho de mensagens do
 * `MessageHandler`, e `Promise.try` so existe a partir do Chrome 134. Em
 * navegador mais velho a chamada estoura com `TypeError` DENTRO da maquinaria do
 * pdfjs, fora do `try` do `extractPdfText`: o erro escapa como uncaught
 * (mechanism `onerror`) e o usuario ve a pagina quebrar em vez de uma mensagem.
 *
 * MEDIDO nesta versao (6.0.227), e o detalhe muda a escolha da correcao: a
 * chamada esta nos DOIS bundles, `build/pdf.min.mjs` (thread principal) e
 * `build/pdf.worker.min.mjs` (worker), no mesmo trecho do `MessageHandler`. Um
 * polyfill de `Promise.try` no thread principal cobriria metade do problema, e a
 * outra metade vive em outro contexto de execucao: o worker nasce de
 * `GlobalWorkerOptions.workerSrc`, uma URL servida por `?url`, e injetar codigo
 * ali exigiria embrulhar o worker num `blob:`. O CSP deste projeto NAO permite:
 * nao ha diretiva `worker-src`, entao worker cai em `script-src`, que e
 * `'self' https://us-assets.i.posthog.com 'sha256-...'`, sem `blob:` (o unico
 * `blob:` do CSP esta em `media-src`, para o audio das entrevistas). Alargar
 * `script-src` para aceitar `blob:` por causa de um polyfill seria pagar em
 * superficie de XSS por um navegador de cauda. Por isso a correcao e detectar e
 * degradar, e nao remendar.
 *
 * `typeof Promise.try === "function"` e proxy DIRETO, nao heuristica: e
 * exatamente a chamada que falha. Nao se le versao de navegador aqui de
 * proposito, porque versao e a causa e o metodo e o efeito, e sniffing de UA
 * erraria em qualquer navegador que ganhasse o metodo depois.
 */
export function navegadorSuportaPdf(): boolean {
  return typeof (Promise as unknown as { try?: unknown }).try === "function";
}

// TODO(Ana): revisar a copy.
const COPY_BROWSER_UNSUPPORTED =
  "Seu navegador é antigo demais para ler PDF por aqui. Atualize o Chrome " +
  "(versão 134 ou mais nova) e tente de novo, ou siga sem o PDF: dá para " +
  "colar o texto na mão nesta mesma página.";

/**
 * Versao do Chrome, ou o estado NOMEADO `desconhecido`.
 *
 * Serve so para dimensionar a cauda no Sentry (tag agrega, o UA cru nao). Nao
 * casou, devolve `desconhecido` em vez de um numero chutado: numero errado aqui
 * e indistinguivel de numero certo, e o UA inteiro vai no `extra`, entao a tag
 * nunca e o unico registro.
 */
function versaoDoChrome(userAgent: string): string {
  const casou = /Chrome\/(\d+)/.exec(userAgent);
  return casou ? casou[1] : "desconhecido";
}

export class PdfExtractError extends Error {
  code: PdfErrorCode;
  constructor(code: PdfErrorCode, message: string) {
    super(message);
    this.name = "PdfExtractError";
    this.code = code;
  }
}

export async function extractPdfText(file: File): Promise<string> {
  if (file.type !== "application/pdf") {
    throw new PdfExtractError("wrong_type", "O arquivo precisa ser um PDF.");
  }
  if (file.size > MAX_PDF_BYTES) {
    throw new PdfExtractError(
      "too_large",
      "O PDF é grande demais (máximo de 5MB).",
    );
  }

  // DEPOIS de tipo e tamanho, e ANTES de encostar no pdfjs. A ordem importa: um
  // .docx em navegador velho merece "precisa ser um PDF", que e o defeito que o
  // usuario consegue corrigir, e nao "atualize o navegador", que nao resolveria
  // o caso dele.
  if (!navegadorSuportaPdf()) {
    const userAgent =
      typeof navigator === "undefined" ? "" : navigator.userAgent;
    try {
      // `info`, nao `warning`: nada quebrou e o usuario recebeu uma saida clara.
      // Isto existe para MEDIR o tamanho da cauda de navegador velho e decidir
      // se vale suportar, nao para alguem acordar. Fingerprint fixo pela razao
      // de sempre: o interesse e a serie no tempo, e uma issue por ocorrencia
      // carrega a mesma informacao que nenhuma.
      Sentry.captureMessage("pdf_browser_unsupported", {
        level: "info",
        tags: { origem: "pdf-extract", chrome: versaoDoChrome(userAgent) },
        fingerprint: ["pdf-browser-unsupported"],
        extra: { userAgent },
      });
    } catch {
      // Sentry sem DSN e no-op, e telemetria nunca decide o desfecho daqui.
    }
    throw new PdfExtractError("browser_unsupported", COPY_BROWSER_UNSUPPORTED);
  }

  let text = "";
  try {
    const data = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data }).promise;
    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
      const page = await pdf.getPage(pageNumber);
      const content = await page.getTextContent();
      for (const item of content.items) {
        if ("str" in item) {
          text += item.str;
          text += item.hasEOL ? "\n" : " ";
        }
      }
      text += "\n";
    }
  } catch {
    throw new PdfExtractError(
      "read_failed",
      "Não consegui ler o PDF. Tente colar o texto manualmente.",
    );
  }

  const trimmed = text.trim();
  if (trimmed.length < MIN_TEXT_CHARS) {
    throw new PdfExtractError(
      "too_little_text",
      "Quase não encontrei texto nesse PDF. Cole o texto manualmente.",
    );
  }
  return trimmed;
}

// Alias fino mantido para o fluxo do LinkedIn (mesmas validações e erros).
export const extractLinkedinPdf = extractPdfText;
