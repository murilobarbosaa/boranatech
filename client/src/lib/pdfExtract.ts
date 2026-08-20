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

/**
 * OS ESTADOS DE FALHA DA ENTRADA, um por causa distinta.
 *
 * Lista em runtime, e nao so um tipo: uniao de tipo nao e enumeravel depois da
 * compilacao, e sem enumerar nao da para AFIRMAR O TOTAL. Quem consome precisa
 * provar que cobriu todos, nao que cobriu os que lembrou. O tipo sai daqui
 * (`(typeof PDF_ERROR_CODES)[number]`), entao o `tsc` e a checagem de
 * totalidade em teste olham para a MESMA fonte, e nao para duas listas que
 * podem divergir.
 *
 * `read_failed` foi removido: ele era o balde unico onde senha, PDF corrompido
 * e arquivo que nem PDF e caiam juntos, porque o `catch` descartava a
 * identidade do erro antes que alguem pudesse classifica-la.
 */
export const PDF_ERROR_CODES = [
  "wrong_type",
  "too_large",
  "too_little_text",
  "senha_protegido",
  "pdf_invalido",
  "erro_desconhecido",
] as const;

export type PdfErrorCode = (typeof PDF_ERROR_CODES)[number];

export class PdfExtractError extends Error {
  code: PdfErrorCode;
  constructor(code: PdfErrorCode, message: string) {
    super(message);
    this.name = "PdfExtractError";
    this.code = code;
  }
}

/**
 * Classifica a excecao do pdf.js pelo `name`, e NAO por `instanceof`.
 *
 * Duas razoes, as duas medidas na lib instalada (pdfjs-dist 6.0.227):
 *
 *  1. `PasswordException` e `InvalidPDFException` nao estao nos exports
 *     publicos do pacote, entao nao ha classe para comparar contra.
 *  2. O erro nasce dentro do WORKER e e re-hidratado ao cruzar a fronteira. A
 *     propria pdf.js reconstroi essas excecoes com `switch (ex.name)`, porque a
 *     identidade de classe nao sobrevive a serializacao. `name` sobrevive: as
 *     classes o gravam como propriedade de instancia no construtor
 *     (`super(msg, "PasswordException")`).
 *
 * FAIL-CLOSED: o que nao for reconhecido vira `erro_desconhecido` e ainda
 * assim LANCA. Nao existe ramo que siga em frente com texto pela metade, que
 * seria a versao silenciosa do mesmo defeito.
 */
export function classificarErroDePdf(erro: unknown): PdfErrorCode {
  const nome =
    typeof erro === "object" && erro !== null && "name" in erro
      ? String((erro as { name: unknown }).name)
      : "";
  if (nome === "PasswordException") return "senha_protegido";
  if (nome === "InvalidPDFException") return "pdf_invalido";
  return "erro_desconhecido";
}

/**
 * Mensagens NEUTRAIS, usadas por quem so mostra `err.message` (hoje o
 * analisador de curriculo, em `CurriculoAnalisar.tsx`). O analisador de
 * LinkedIn nao passa por aqui: ele traduz o `code` para uma copy propria, que
 * cita o export oficial do LinkedIn. A separacao existe porque a mesma causa
 * pede orientacoes diferentes em cada produto.
 */
const MENSAGEM_POR_CODIGO: Record<PdfErrorCode, string> = {
  // TODO(Ana): mensagem de arquivo que nao e PDF.
  wrong_type: "O arquivo precisa ser um PDF.",
  // TODO(Ana): mensagem de PDF acima do limite de tamanho.
  too_large: "O PDF é grande demais (máximo de 5MB).",
  // TODO(Ana): mensagem de PDF sem texto selecionável (escaneado).
  too_little_text:
    "Quase não encontrei texto nesse PDF. Cole o texto manualmente.",
  // TODO(Ana): mensagem de PDF protegido por senha.
  senha_protegido:
    "Esse PDF está protegido por senha. Remova a proteção e envie de novo, ou cole o texto manualmente.",
  // TODO(Ana): mensagem de PDF corrompido ou incompleto.
  pdf_invalido:
    "Esse arquivo não abriu como PDF. Ele pode estar corrompido ou ter sido baixado pela metade. Baixe o arquivo de novo e tente outra vez.",
  // TODO(Ana): mensagem de falha não identificada na leitura do PDF.
  erro_desconhecido:
    "Não consegui ler esse PDF e não identifiquei o motivo. Tente baixar o arquivo de novo, ou cole o texto manualmente.",
};

export async function extractPdfText(file: File): Promise<string> {
  if (file.type !== "application/pdf") {
    throw new PdfExtractError("wrong_type", MENSAGEM_POR_CODIGO.wrong_type);
  }
  if (file.size > MAX_PDF_BYTES) {
    throw new PdfExtractError("too_large", MENSAGEM_POR_CODIGO.too_large);
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
  } catch (erro) {
    // `catch (erro)`, e nao `catch {}`. Sem o parametro a identidade do erro
    // era descartada aqui, e senha, corrompido e arquivo-que-nao-e-PDF saiam
    // com a mesma frase: tres causas, tres acoes diferentes do usuario, um
    // texto so.
    const code = classificarErroDePdf(erro);
    throw new PdfExtractError(code, MENSAGEM_POR_CODIGO[code]);
  }

  const trimmed = text.trim();
  if (trimmed.length < MIN_TEXT_CHARS) {
    throw new PdfExtractError(
      "too_little_text",
      MENSAGEM_POR_CODIGO.too_little_text,
    );
  }
  return trimmed;
}

// Alias fino mantido para o fluxo do LinkedIn (mesmas validações e erros).
export const extractLinkedinPdf = extractPdfText;
