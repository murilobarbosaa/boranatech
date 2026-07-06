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
  | "read_failed";

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
    throw new PdfExtractError(
      "wrong_type",
      "O arquivo precisa ser um PDF.",
    );
  }
  if (file.size > MAX_PDF_BYTES) {
    throw new PdfExtractError(
      "too_large",
      "O PDF é grande demais (máximo de 5MB).",
    );
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
