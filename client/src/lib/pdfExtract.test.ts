import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * A IDENTIDADE DO ERRO DE PDF SOBREVIVE ATE A UI?
 *
 * Ate este lote nao sobrevivia: `extractPdfText` capturava com `catch {}`, sem
 * parametro, e devolvia um unico `read_failed` para quatro causas distintas.
 * Senha, PDF corrompido, arquivo que nem e PDF e falha nao identificada saiam
 * com a mesma frase, apesar de pedirem quatro acoes diferentes da pessoa.
 *
 * Os erros aqui sao FORJADOS com os `name` REAIS da pdfjs-dist 6.0.227,
 * medidos na lib instalada (`build/pdf.mjs`): as classes gravam o nome como
 * propriedade de instancia no construtor (`super(msg, "PasswordException")`).
 * Nenhum PDF de verdade e lido e nenhuma rede e tocada: `pdfjs-dist` esta
 * dublado, e e ele quem decide o desfecho de cada caso.
 */

const getDocument = vi.fn();

vi.mock("pdfjs-dist", () => ({
  GlobalWorkerOptions: { workerSrc: "" },
  getDocument: (args: unknown) => getDocument(args),
}));
vi.mock("pdfjs-dist/build/pdf.worker.min.mjs?url", () => ({ default: "" }));

import {
  classificarErroDePdf,
  extractPdfText,
  MAX_PDF_BYTES,
  PDF_ERROR_CODES,
  PdfExtractError,
  type PdfErrorCode,
} from "./pdfExtract";

/**
 * Replica a forma real da excecao da pdfjs: `name` e propriedade da INSTANCIA,
 * nao o nome da classe. E isso que sobrevive a fronteira do worker, e por isso
 * que a classificacao le `name` em vez de usar `instanceof`.
 */
function erroDaLib(name: string, extra: Record<string, unknown> = {}) {
  const e = new Error(`forjado: ${name}`);
  e.name = name;
  return Object.assign(e, extra);
}

function pdfFalso(bytes = 2048): File {
  return new File([new Uint8Array(bytes)], "perfil.pdf", {
    type: "application/pdf",
  });
}

beforeEach(() => {
  getDocument.mockReset();
});

afterEach(() => {
  vi.restoreAllMocks();
});

async function codigoDe(promessa: Promise<unknown>): Promise<PdfErrorCode> {
  try {
    await promessa;
  } catch (err) {
    // FAIL-CLOSED faz parte da assercao: nao basta o codigo estar certo, tem
    // que ter LANCADO. Um ramo que devolvesse texto pela metade seria a versao
    // silenciosa do mesmo defeito.
    expect(err).toBeInstanceOf(PdfExtractError);
    return (err as PdfExtractError).code;
  }
  throw new Error("deveria ter lancado, e nao lancou");
}

describe("classificador: um caso por estado, pelo name real", () => {
  it("PasswordException vira senha_protegido", () => {
    // `code: 1` e o NEED_PASSWORD medido na lib. Nao entra no criterio de
    // proposito: senha ausente e senha errada pedem a mesma acao aqui, que e
    // remover a protecao do arquivo.
    expect(
      classificarErroDePdf(erroDaLib("PasswordException", { code: 1 })),
    ).toBe("senha_protegido");
  });

  it("InvalidPDFException vira pdf_invalido", () => {
    expect(classificarErroDePdf(erroDaLib("InvalidPDFException"))).toBe(
      "pdf_invalido",
    );
  });

  it("um name que a lib tem mas nos nao mapeamos vira erro_desconhecido", () => {
    // `UnknownErrorException` existe na pdfjs e NAO esta no mapa. O ponto e
    // que o desconhecido tem estado proprio em vez de virar um dos dois de
    // cima por descuido.
    expect(classificarErroDePdf(erroDaLib("UnknownErrorException"))).toBe(
      "erro_desconhecido",
    );
  });

  it("erro sem name reconhecivel vira erro_desconhecido", () => {
    expect(classificarErroDePdf(new Error("qualquer coisa"))).toBe(
      "erro_desconhecido",
    );
    expect(classificarErroDePdf("uma string solta")).toBe("erro_desconhecido");
    expect(classificarErroDePdf(null)).toBe("erro_desconhecido");
    expect(classificarErroDePdf(undefined)).toBe("erro_desconhecido");
  });
});

describe("extractPdfText propaga o estado classificado, sempre lancando", () => {
  it("PDF com senha", async () => {
    getDocument.mockReturnValue({
      promise: Promise.reject(erroDaLib("PasswordException", { code: 1 })),
    });
    expect(await codigoDe(extractPdfText(pdfFalso()))).toBe("senha_protegido");
  });

  it("PDF corrompido, truncado ou arquivo renomeado para .pdf", async () => {
    // As tres causas dao `InvalidPDFException` na lib, medido. Elas COMPARTILHAM
    // estado por serem indistinguiveis na origem, nao por descarte de
    // informacao: a acao util e a mesma, baixar o arquivo de novo.
    getDocument.mockReturnValue({
      promise: Promise.reject(erroDaLib("InvalidPDFException")),
    });
    expect(await codigoDe(extractPdfText(pdfFalso()))).toBe("pdf_invalido");
  });

  it("falha nao identificada", async () => {
    getDocument.mockReturnValue({
      promise: Promise.reject(new Error("algo que ninguem previu")),
    });
    expect(await codigoDe(extractPdfText(pdfFalso()))).toBe(
      "erro_desconhecido",
    );
  });

  it("arquivo que nao e PDF pelo tipo", async () => {
    const txt = new File(["texto"], "perfil.txt", { type: "text/plain" });
    expect(await codigoDe(extractPdfText(txt))).toBe("wrong_type");
    expect(getDocument).not.toHaveBeenCalled();
  });

  it("PDF acima do teto de tamanho", async () => {
    const gigante = new File([new Uint8Array(MAX_PDF_BYTES + 1)], "p.pdf", {
      type: "application/pdf",
    });
    expect(await codigoDe(extractPdfText(gigante))).toBe("too_large");
    expect(getDocument).not.toHaveBeenCalled();
  });

  it("PDF escaneado: abre sem erro e nao traz texto", async () => {
    // O caso que NAO passa pelo classificador: a lib nao reclama, so nao ha
    // texto para extrair. Continua sendo `too_little_text`, com estado e
    // mensagem proprios desde antes deste lote.
    getDocument.mockReturnValue({
      promise: Promise.resolve({
        numPages: 3,
        getPage: async () => ({ getTextContent: async () => ({ items: [] }) }),
      }),
    });
    expect(await codigoDe(extractPdfText(pdfFalso()))).toBe("too_little_text");
  });

  it("PDF legivel devolve o texto, e nenhum estado de falha", async () => {
    const linha = { str: "Desenvolvedora Front-end com React. ", hasEOL: true };
    getDocument.mockReturnValue({
      promise: Promise.resolve({
        numPages: 8,
        getPage: async () => ({
          getTextContent: async () => ({ items: [linha] }),
        }),
      }),
    });
    const texto = await extractPdfText(pdfFalso());
    expect(texto).toContain("Desenvolvedora Front-end");
  });
});

describe("a lista de estados nao encolhe nem cresce em silencio", () => {
  it("PDF_ERROR_CODES tem exatamente os sete estados, sem repetido", () => {
    // Assercao de TAMANHO do conjunto, no espirito de EXPECTED_TABLE_COUNT:
    // mexer nela e ato deliberado, no mesmo commit que cria ou remove o estado.
    //
    // 6 -> 7 no quarto merge da main: `browser_unsupported` chegou pela frente
    // de compatibilidade do pdfjs (BUG-75), que degrada em navegador sem
    // `Promise.try` em vez de deixar o erro escapar como uncaught. O estado
    // nasceu la como uniao de tipo a parte e foi trazido para ESTA lista, que e
    // a fonte unica; os casos dele vivem em `pdfExtract.navegador.test.ts`,
    // separados porque os dois arquivos dublam `pdfjs-dist` de formas
    // diferentes e um `vi.mock` sobrescreveria o outro.
    expect(new Set(PDF_ERROR_CODES).size).toBe(PDF_ERROR_CODES.length);
    expect(PDF_ERROR_CODES.length).toBe(7);
  });

  it("`read_failed` nao voltou", () => {
    // O balde unico que colapsava quatro causas. Se reaparecer, o defeito que
    // este lote fechou esta de volta.
    expect(PDF_ERROR_CODES as readonly string[]).not.toContain("read_failed");
  });
});
