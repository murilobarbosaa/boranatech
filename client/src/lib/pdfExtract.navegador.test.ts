import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Degradacao em navegador sem `Promise.try`.
 *
 * O defeito coberto aqui (BUG-75) nao era "o PDF falha": era o PDF falhar
 * DENTRO da maquinaria do pdfjs, fora do `try` do `extractPdfText`, escapando
 * como uncaught (mechanism `onerror`). Por isso a assercao que importa nao e "a
 * mensagem esta certa", e sim **`getDocument` nao chegou a ser chamado**: o
 * caminho que estoura e o que nao pode ser tomado.
 */

const sentrySpy = vi.hoisted(() => ({ captureMessage: vi.fn() }));
vi.mock("@sentry/react", () => ({
  captureMessage: sentrySpy.captureMessage,
}));

const pdfSpy = vi.hoisted(() => ({ getDocument: vi.fn() }));
vi.mock("pdfjs-dist", () => ({
  GlobalWorkerOptions: { workerSrc: "" },
  getDocument: pdfSpy.getDocument,
}));
vi.mock("pdfjs-dist/build/pdf.worker.min.mjs?url", () => ({
  default: "worker-stub.mjs",
}));

import {
  extractPdfText,
  navegadorSuportaPdf,
  PdfExtractError,
} from "./pdfExtract";

/** Acesso tipado ao metodo que pode nao existir, sem `any`. */
type PromiseComTry = { try?: unknown };
const promiseCtor = Promise as unknown as PromiseComTry;

/** PDF valido do ponto de vista de tipo e tamanho: as duas guardas anteriores passam. */
function pdfDeTeste(): File {
  return new File(["conteudo"], "curriculo.pdf", { type: "application/pdf" });
}

/** Documento minimo que o fluxo normal consegue percorrer. */
function documentoComTexto(texto: string) {
  return {
    promise: Promise.resolve({
      numPages: 1,
      getPage: async () => ({
        getTextContent: async () => ({
          items: [{ str: texto, hasEOL: true }],
        }),
      }),
    }),
  };
}

let tryOriginal: unknown;

beforeEach(() => {
  tryOriginal = promiseCtor.try;
  sentrySpy.captureMessage.mockReset();
  pdfSpy.getDocument.mockReset();
});

afterEach(() => {
  if (tryOriginal === undefined) delete promiseCtor.try;
  else promiseCtor.try = tryOriginal;
});

describe("navegador sem Promise.try", () => {
  beforeEach(() => {
    delete promiseCtor.try;
  });

  it("nao inicia o worker e devolve erro tratado", async () => {
    expect(navegadorSuportaPdf()).toBe(false);

    await expect(extractPdfText(pdfDeTeste())).rejects.toMatchObject({
      name: "PdfExtractError",
      code: "browser_unsupported",
    });

    // A assercao central: o caminho que estourava nao foi tomado.
    expect(pdfSpy.getDocument).not.toHaveBeenCalled();
  });

  it("a mensagem aponta a saida, nao so o problema", async () => {
    const erro = await extractPdfText(pdfDeTeste()).catch((e: unknown) => e);
    expect(erro).toBeInstanceOf(PdfExtractError);
    const mensagem = (erro as PdfExtractError).message;
    // Sem prescrever a copy inteira (ela tem TODO(Ana) e vai mudar): o que se
    // trava e que a pessoa fica sabendo o que fazer, nao so que falhou.
    expect(mensagem).toContain("134");
    expect(mensagem.toLowerCase()).toContain("colar o texto");
  });

  it("reporta ao Sentry como info, para medir a cauda", async () => {
    await extractPdfText(pdfDeTeste()).catch(() => undefined);

    expect(sentrySpy.captureMessage).toHaveBeenCalledTimes(1);
    const [mensagem, opcoes] = sentrySpy.captureMessage.mock.calls[0] as [
      string,
      {
        level: string;
        fingerprint: string[];
        tags: Record<string, string>;
        extra: Record<string, unknown>;
      },
    ];
    expect(mensagem).toBe("pdf_browser_unsupported");
    // `info` e deliberado: nada quebrou e ninguem precisa acordar.
    expect(opcoes.level).toBe("info");
    // Fingerprint fixo por TIPO: uma issue por ocorrencia nao mede cauda.
    expect(opcoes.fingerprint).toEqual(["pdf-browser-unsupported"]);
    expect(opcoes.tags.origem).toBe("pdf-extract");
    expect(opcoes.tags).toHaveProperty("chrome");
  });

  it("Sentry que lanca nao muda o desfecho", async () => {
    sentrySpy.captureMessage.mockImplementation(() => {
      throw new Error("sem DSN");
    });
    // Continua sendo o erro tratado, e nao o erro da telemetria.
    await expect(extractPdfText(pdfDeTeste())).rejects.toMatchObject({
      code: "browser_unsupported",
    });
  });

  it("tipo errado ainda ganha a mensagem de tipo, nao a de navegador", async () => {
    // A ordem das guardas: um .docx em navegador velho continua falhando por ser
    // .docx, que e o defeito que a pessoa consegue corrigir.
    const docx = new File(["x"], "cv.docx", { type: "application/msword" });
    await expect(extractPdfText(docx)).rejects.toMatchObject({
      code: "wrong_type",
    });
    expect(sentrySpy.captureMessage).not.toHaveBeenCalled();
  });
});

describe("CONTROLE NEGATIVO: navegador com Promise.try", () => {
  beforeEach(() => {
    // O ambiente de teste pode nao ter o metodo (depende da versao do V8), entao
    // ele e instalado explicitamente em vez de suposto presente.
    promiseCtor.try = () => Promise.resolve();
  });

  it("segue o fluxo normal e chama o pdfjs", async () => {
    expect(navegadorSuportaPdf()).toBe(true);
    pdfSpy.getDocument.mockReturnValue(documentoComTexto("a".repeat(400)));

    const texto = await extractPdfText(pdfDeTeste());

    expect(pdfSpy.getDocument).toHaveBeenCalledTimes(1);
    expect(texto.length).toBeGreaterThanOrEqual(400);
    expect(sentrySpy.captureMessage).not.toHaveBeenCalled();
  });
});
