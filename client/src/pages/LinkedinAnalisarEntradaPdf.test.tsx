import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * A PAGINA NOMEIA CADA FALHA DE ENTRADA, ou continua colapsando causas?
 *
 * Este arquivo prova quatro coisas sobre o analisador de LinkedIn:
 *
 *   1. TOTALIDADE. Todo estado de `PDF_ERROR_CODES` tem mensagem propria na
 *      pagina, e nao ha mensagem sobrando para estado que nao existe. Igualdade
 *      de CONJUNTO, nunca uma lista escrita a mao aqui: lista a mao e o caso
 *      degenerado do parser que sub-casa em silencio, e um estado novo passaria
 *      despercebido justamente por ninguem ter lembrado dele.
 *   2. COLAPSO PROIBIDO. Senha, PDF corrompido e falha nao identificada nao
 *      compartilham mais a mesma frase, e nenhuma delas se confunde com o texto
 *      do caminho legitimo.
 *   3. BLOQUEIO. Em qualquer estado de falha a analise NAO sai: zero requisicao.
 *   4. TEXTO COLADO. O `unreadable_text` que o servidor passou a devolver antes
 *      de reservar cota chega a tela com mensagem propria.
 *
 * As asserts sao por TEXTO, nunca por cor ou classe: a distincao entre os
 * estados precisa existir para quem nao enxerga cor.
 *
 * Nada de rede: `pdfjs-dist` esta dublado (ele nem carrega em jsdom, falta
 * `DOMMatrix`) e o `fetch` global e um spy. O cliente HTTP real fica de pe de
 * proposito, entao a traducao de 422 para a tela e exercitada de verdade.
 */

const getDocument = vi.fn();
vi.mock("pdfjs-dist", () => ({
  GlobalWorkerOptions: { workerSrc: "" },
  getDocument: (args: unknown) => getDocument(args),
}));
vi.mock("pdfjs-dist/build/pdf.worker.min.mjs?url", () => ({ default: "" }));

vi.mock("@/components/Layout", () => ({
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));
vi.mock("@/components/SEO", () => ({ default: () => null }));
vi.mock("posthog-js", () => ({ default: { capture: vi.fn() } }));
vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({ user: { id: "u1", email: "a@b.c" }, loading: false }),
}));
vi.mock("@/contexts/SubscriptionContext", () => ({
  useSubscription: () => ({ isPro: true, isAdmin: false, loading: false }),
}));
// Sem sessao: `getAuthHeader` do cliente real ja trata `supabase` nulo.
vi.mock("@/lib/supabase", () => ({ supabase: null }));
vi.mock("@/lib/useLinkedinHistory", () => ({
  useLinkedinHistory: () => ({
    analyses: [],
    analysesRef: { current: [] },
    loading: false,
    error: "",
    refreshLinkedinHistory: vi.fn(),
  }),
}));
vi.mock("@/lib/useLinkedinImprovementProgress", () => ({
  useLinkedinImprovementProgress: () => ({
    applied: new Set<number>(),
    toggle: vi.fn(),
    saving: false,
    error: "",
  }),
}));

class IOStub {
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() {
    return [];
  }
}
(
  globalThis as unknown as { IntersectionObserver: unknown }
).IntersectionObserver = IOStub;

import {
  fixarSemSuportePdf,
  fixarSuportePdf,
  restaurarSuportePdf,
} from "@/lib/__fixtures__/promiseTry";
import { PDF_ERROR_CODES, type PdfErrorCode } from "@/lib/pdfExtract";
import Page, { PDF_ERROR_COPY } from "./LinkedinAnalisar";

/** Erro forjado com o `name` real da pdfjs-dist, como a lib o grava. */
function erroDaLib(name: string, extra: Record<string, unknown> = {}) {
  const e = new Error(`forjado: ${name}`);
  e.name = name;
  return Object.assign(e, extra);
}

function pdf(bytes = 2048): File {
  return new File([new Uint8Array(bytes)], "perfil.pdf", {
    type: "application/pdf",
  });
}

/**
 * Como cada estado e PRODUZIDO. O teste de totalidade compara as chaves deste
 * mapa com `PDF_ERROR_CODES`, entao um estado novo sem receita aqui derruba a
 * suite em vez de ficar sem cobertura.
 */
const RECEITA: Record<PdfErrorCode, () => File> = {
  wrong_type: () => new File(["oi"], "perfil.txt", { type: "text/plain" }),
  too_large: () =>
    new File([new Uint8Array(5 * 1024 * 1024 + 1)], "perfil.pdf", {
      type: "application/pdf",
    }),
  too_little_text: () => {
    getDocument.mockReturnValue({
      promise: Promise.resolve({
        numPages: 2,
        getPage: async () => ({ getTextContent: async () => ({ items: [] }) }),
      }),
    });
    return pdf();
  },
  senha_protegido: () => {
    getDocument.mockReturnValue({
      promise: Promise.reject(erroDaLib("PasswordException", { code: 1 })),
    });
    return pdf();
  },
  pdf_invalido: () => {
    getDocument.mockReturnValue({
      promise: Promise.reject(erroDaLib("InvalidPDFException")),
    });
    return pdf();
  },
  erro_desconhecido: () => {
    getDocument.mockReturnValue({
      promise: Promise.reject(new Error("ninguem previu isto")),
    });
    return pdf();
  },
  // Sem `Promise.try` o pdfjs 6 estoura DENTRO da propria maquinaria, fora do
  // `try` de `extractPdfText`. A guarda corre ANTES de encostar no pdfjs, entao
  // aqui nao se dubla `getDocument`: o desfecho certo e ele nunca ser chamado.
  browser_unsupported: () => {
    fixarSemSuportePdf();
    return pdf();
  },
};

let fetchSpy: ReturnType<typeof vi.fn>;

// `browser_unsupported` so e reproduzivel mexendo em `Promise.try`, que e
// global. A mutacao e a devolucao vivem em `@/lib/__fixtures__/promiseTry`, e o
// `restaurarSuportePdf` do afterEach impede que ela vaze para os outros casos:
// uma receita que apaga o metodo e nao o repoe faria os testes seguintes
// rodarem num navegador falso, e o vazamento apareceria como falha em outro
// arquivo.
//
// O `fixarSuportePdf` do beforeEach e o que MUDOU em 03/09/2026. Antes, os
// casos que NAO sao `browser_unsupported` herdavam o `Promise.try` do runner,
// entao a pagina era exercitada contra o navegador do CI em vez de contra um
// declarado aqui. Com o `.nvmrc` em 22 isso derrubou 33 testes de uma vez.

beforeEach(() => {
  fixarSuportePdf();
  getDocument.mockReset();
  fetchSpy = vi.fn(async () => new Response("{}", { status: 200 }));
  vi.stubGlobal("fetch", fetchSpy);
});

afterEach(() => {
  restaurarSuportePdf();
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

function inputDeArquivo(): HTMLInputElement {
  const input = document.querySelector<HTMLInputElement>(
    'input[type="file"][accept="application/pdf"]',
  );
  if (!input) throw new Error("input de PDF nao encontrado na pagina");
  return input;
}

describe("TOTALIDADE: todo estado tem mensagem, e nenhuma sobra", () => {
  it("as chaves de PDF_ERROR_COPY sao exatamente PDF_ERROR_CODES", () => {
    // Igualdade nos DOIS sentidos. "o que declarei existe?" nao e a mesma
    // pergunta que "o que existe esta declarado?", e so as duas juntas pegam
    // tanto o estado novo sem copy quanto a copy orfa de estado removido.
    expect(new Set(Object.keys(PDF_ERROR_COPY))).toEqual(
      new Set(PDF_ERROR_CODES),
    );
  });

  it("todo estado tem receita de reproducao neste arquivo", () => {
    expect(new Set(Object.keys(RECEITA))).toEqual(new Set(PDF_ERROR_CODES));
  });

  it("nenhuma mensagem e vazia ou so espaco", () => {
    for (const code of PDF_ERROR_CODES) {
      expect(PDF_ERROR_COPY[code].trim().length).toBeGreaterThan(0);
    }
  });
});

describe("COLAPSO PROIBIDO: causas distintas, frases distintas", () => {
  it("as seis mensagens sao todas diferentes entre si", () => {
    const frases = PDF_ERROR_CODES.map((c) => PDF_ERROR_COPY[c]);
    expect(new Set(frases).size).toBe(frases.length);
  });

  it("senha, PDF corrompido e falha desconhecida nao dividem mais a frase", () => {
    // A regressao exata que este lote fechou: as tres caiam no mesmo
    // `read_failed` e liam "Nao consegui ler o PDF. Tente colar o texto
    // manualmente." Tres causas, tres acoes, um texto so.
    const tres = [
      PDF_ERROR_COPY.senha_protegido,
      PDF_ERROR_COPY.pdf_invalido,
      PDF_ERROR_COPY.erro_desconhecido,
    ];
    expect(new Set(tres).size).toBe(3);
  });

  it("cada mensagem orienta a acao propria da sua causa", () => {
    // Nao e sobre a frase exata (a copy ainda passa pela Ana), e sim sobre a
    // acao continuar amarrada a causa certa depois de qualquer reescrita.
    expect(PDF_ERROR_COPY.senha_protegido.toLowerCase()).toContain("senha");
    expect(PDF_ERROR_COPY.pdf_invalido.toLowerCase()).toContain("baixe");
    expect(PDF_ERROR_COPY.too_little_text.toLowerCase()).toContain("imagem");
  });

  it("a falha desconhecida e honesta e nao culpa quem enviou", () => {
    const frase = PDF_ERROR_COPY.erro_desconhecido.toLowerCase();
    expect(frase).toContain("não descobri o motivo");
    expect(frase).toContain("não seu");
  });
});

describe("a mensagem certa chega ao DOM, e a analise nao sai", () => {
  it.each(PDF_ERROR_CODES)(
    "%s: renderiza a propria mensagem e faz zero requisicao",
    async (code) => {
      render(<Page />);
      const arquivo = RECEITA[code]();

      fireEvent.change(inputDeArquivo(), { target: { files: [arquivo] } });

      await waitFor(() => {
        expect(screen.getByText(PDF_ERROR_COPY[code])).toBeTruthy();
      });

      // BLOQUEIO: estado nao-ok nunca vira chamada de analise.
      expect(fetchSpy).not.toHaveBeenCalled();

      // E nenhuma das OUTRAS mensagens aparece junto: distincao real na tela,
      // e nao so no mapa.
      for (const outro of PDF_ERROR_CODES) {
        if (outro === code) continue;
        expect(screen.queryByText(PDF_ERROR_COPY[outro])).toBeNull();
      }
    },
  );
});

describe("TEXTO COLADO: o 422 do servidor chega nomeado a tela", () => {
  /**
   * A cadeia e provada em TRES ELOS, cada um com o codigo real do seu lado.
   * Encenar os cinco selects de contexto (primitivos Radix) so para chegar ao
   * submit custaria mais em fragilidade do que entrega em confianca, e o que
   * importa provar nao esta no formulario, esta na volta do servidor.
   */

  it("ELO A: o cliente real traduz o 422 do servidor em UNREADABLE", async () => {
    // O servidor passou a recusar texto ilegivel ANTES de reservar cota, com
    // `unreadable_text` em 422. Nada do caminho de erro esta dublado alem do
    // transporte: quem classifica e `client/src/lib/linkedinClient.ts`.
    fetchSpy.mockResolvedValue(
      new Response(
        JSON.stringify({
          error: { code: "unreadable_text", message: "ilegivel" },
        }),
        { status: 422, headers: { "Content-Type": "application/json" } },
      ),
    );

    const { analyzeLinkedin } = await import("@/lib/linkedinClient");
    await expect(
      analyzeLinkedin({
        profileText: "x".repeat(250),
        area: "frontend",
        level: "junior",
        mercado: "brasil",
        skills: "React",
        foto: "sim",
        banner: "sim",
        openToWork: "sim",
        conexoes: "100-500",
        atividade: "semanal",
      }),
    ).rejects.toThrow("UNREADABLE");
  });

  it("ELO B: UNREADABLE tem texto proprio, e nao cai no generico", async () => {
    const { LinkedinError } =
      await import("@/components/linkedin/LinkedinStates");
    const { container } = render(<LinkedinError error="UNREADABLE" />);
    const texto = container.textContent ?? "";

    // Mensagem propria e util: nomeia o que fazer (colar o texto das secoes).
    expect(texto).toMatch(/não consegui ler seu perfil/i);
    expect(texto.length).toBeGreaterThan(40);

    // NAO e a generica de falha de analise.
    cleanup();
    const generico =
      render(<LinkedinError error="ANALYSIS_FAILED" />).container.textContent ??
      "";
    expect(texto).not.toBe(generico);

    // E nao colide com nenhuma das seis mensagens de entrada de PDF: a causa
    // "servidor nao reconheceu o perfil" e distinta de "nao consegui abrir o
    // arquivo".
    for (const code of PDF_ERROR_CODES) {
      expect(texto).not.toBe(PDF_ERROR_COPY[code]);
    }
  });

  it("ELO C: a pagina liga o estado de erro ao componente que o nomeia", async () => {
    // O submit real chama `runAnalysis`, que grava o erro em estado e a pagina
    // o entrega a `LinkedinError`. `fireEvent.submit` no proprio form exercita
    // essa fiacao sem depender do botao (que fica desabilitado ate o contexto
    // estar completo) nem dos selects Radix.
    render(<Page />);
    fireEvent.click(screen.getByText(/Prefiro preencher na mão/i));

    const form = document.querySelector("form");
    if (!form) throw new Error("form nao encontrado");
    fireEvent.submit(form);

    await waitFor(() => {
      expect(screen.getByText(/Confira os campos do formulário/i)).toBeTruthy();
    });
    // Sem contexto preenchido o pedido nem sai: o guard local barra antes.
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
