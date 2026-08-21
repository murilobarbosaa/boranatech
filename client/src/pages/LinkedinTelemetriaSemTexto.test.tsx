import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * ANTI-VAZAMENTO DA TELEMETRIA DO ANALISADOR (Fase 3, lote 4).
 *
 * PERMANENTE, nao prova descartavel, e irmao de
 * `server/lib/linkedinLogSemTexto.test.ts`: aquele cobre o stdout e o Sentry do
 * servidor, este cobre o que sai do NAVEGADOR para o PostHog. As duas portas
 * levam dado para fora, e telemetria e a mais facil de esquecer porque ninguem
 * a le durante o desenvolvimento.
 *
 * COMO FUNCIONA: o perfil, a headline, o Sobre, a experiencia e ate o NOME DO
 * ARQUIVO carregam marcadores improvaveis. Os fluxos rodam de ponta a ponta com
 * `pdfjs` dublado, TODA chamada de `posthog.capture` e capturada, e o assert
 * varre RECURSIVAMENTE chaves e valores. Um marcador em qualquer lugar reprova.
 *
 * Varrer recursivamente, e nao so o primeiro nivel, e deliberado: uma property
 * aninhada ou uma string serializada passaria por um assert ingenuo, que foi
 * exatamente como o vazamento equivalente do servidor escapou.
 */

const MARCADOR_HEADLINE = "ZQXJHEADLINEZQXJ";
const MARCADOR_SOBRE = "ZQXJSOBREZQXJ";
const MARCADOR_EXPERIENCIA = "ZQXJEXPERIENCIAZQXJ";
const MARCADOR_EMPRESA = "ZQXJEMPRESAZQXJ";
const MARCADOR_ARQUIVO = "ZQXJperfil-de-fulanaZQXJ.pdf";
const MARCADOR_SERVIDOR = "ZQXJMENSAGEMDOSERVIDORZQXJ";
const MARCADORES = [
  MARCADOR_HEADLINE,
  MARCADOR_SOBRE,
  MARCADOR_EXPERIENCIA,
  MARCADOR_EMPRESA,
  MARCADOR_ARQUIVO,
  MARCADOR_SERVIDOR,
  "ZQXJ",
];

const PERFIL = `Contato
teste@email.com
Fulana Teste
Desenvolvedora Front-end | React, TypeScript | ${MARCADOR_HEADLINE}
Resumo
Sou desenvolvedora front-end e cuido de acessibilidade. ${MARCADOR_SOBRE} Trabalho com React e TypeScript em times distribuidos e acompanho metricas de entrega junto com design e produto.
Experience
${MARCADOR_EMPRESA}
Desenvolvedora Front-end
janeiro de 2022 - Present
2 anos
Desenvolvi telas em React e TypeScript para 12 squads internos. ${MARCADOR_EXPERIENCIA}`;

const capturas: Array<{ evento: string; props: unknown }> = [];

vi.mock("posthog-js", () => ({
  default: {
    capture: (evento: string, props: unknown) => {
      capturas.push({ evento, props });
    },
  },
}));

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
vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({ user: { id: "u1", email: "a@b.c" }, loading: false }),
}));
vi.mock("@/contexts/SubscriptionContext", () => ({
  useSubscription: () => ({ isPro: true, isAdmin: false, loading: false }),
}));
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

import { classificarDesfechoDeErro } from "@/lib/analytics";
import Page from "./LinkedinAnalisar";

/**
 * Achata QUALQUER valor em texto varrível, inclusive as CHAVES do objeto.
 *
 * Uma property batizada com o nome do arquivo vazaria pela chave, e um assert
 * que so olhasse valores nao veria. `JSON.stringify` cobre os dois de uma vez,
 * e o fallback existe para ciclo e `BigInt`, que fazem ele lancar.
 */
function achatar(valor: unknown): string {
  if (typeof valor === "string") return valor;
  if (valor instanceof Error) return `${valor.name} ${valor.message}`;
  try {
    return JSON.stringify(valor) ?? String(valor);
  } catch {
    return String(valor);
  }
}

function tudoQueSaiu(): string {
  return capturas.map((c) => `${c.evento} ${achatar(c.props)}`).join("\n");
}

function pdfComTexto(texto: string) {
  const linhas = texto.split("\n").map((l) => ({ str: l, hasEOL: true }));
  getDocument.mockReturnValue({
    promise: Promise.resolve({
      numPages: 1,
      getPage: async () => ({
        getTextContent: async () => ({ items: linhas }),
      }),
    }),
  });
  // O NOME DO ARQUIVO tambem carrega marcador: ele e um dado do usuario que a
  // pagina tem em maos e que seria comodo mandar junto no evento.
  return new File([new Uint8Array(2048)], MARCADOR_ARQUIVO, {
    type: "application/pdf",
  });
}

function inputDeArquivo(): HTMLInputElement {
  const input = document.querySelector<HTMLInputElement>(
    'input[type="file"][accept="application/pdf"]',
  );
  if (!input) throw new Error("input de PDF nao encontrado");
  return input;
}

beforeEach(() => {
  capturas.length = 0;
  getDocument.mockReset();
  // A pagina persiste o passo do formulario em `sessionStorage` e o restaura na
  // montagem. Sem limpar, o `entryPath: "review"` deixado por um teste de
  // upload sobrevive para o proximo e o botao do caminho manual nem existe no
  // DOM. Isolamento entre testes, e nao detalhe de estilo.
  window.sessionStorage.clear();
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => new Response("{}", { status: 200 })),
  );
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("nenhum evento do funil carrega texto do usuario", () => {
  it("PDF lido com sucesso: eventos saem, marcadores nao", async () => {
    render(<Page />);
    fireEvent.change(inputDeArquivo(), {
      target: { files: [pdfComTexto(PERFIL)] },
    });

    await waitFor(() => {
      expect(capturas.some((c) => c.evento === "linkedin_pdf_extracao")).toBe(
        true,
      );
    });
    // O fluxo precisa ter emitido de fato: um teste que passa porque nada
    // aconteceu nao prova nada sobre vazamento.
    expect(capturas.length).toBeGreaterThanOrEqual(2);

    const saiu = tudoQueSaiu();
    for (const marcador of MARCADORES) {
      expect(saiu).not.toContain(marcador);
    }
  });

  it("PDF que falha: nem o nome do arquivo nem o erro entram no evento", async () => {
    const erro = new Error(`falha em ${MARCADOR_ARQUIVO}`);
    erro.name = "PasswordException";
    getDocument.mockReturnValue({ promise: Promise.reject(erro) });

    render(<Page />);
    fireEvent.change(inputDeArquivo(), {
      target: {
        files: [
          new File([new Uint8Array(2048)], MARCADOR_ARQUIVO, {
            type: "application/pdf",
          }),
        ],
      },
    });

    await waitFor(() => {
      expect(capturas.some((c) => c.evento === "linkedin_pdf_extracao")).toBe(
        true,
      );
    });
    const evento = capturas.find((c) => c.evento === "linkedin_pdf_extracao");
    expect(evento?.props).toEqual({ desfecho: "senha_protegido" });

    const saiu = tudoQueSaiu();
    for (const marcador of MARCADORES) {
      expect(saiu).not.toContain(marcador);
    }
  });

  it("PDF que abre mas nao e perfil: desfecho nomeado, sem o texto", async () => {
    render(<Page />);
    fireEvent.change(inputDeArquivo(), {
      target: {
        files: [pdfComTexto(`${MARCADOR_SOBRE} `.repeat(30))],
      },
    });

    await waitFor(() => {
      expect(capturas.some((c) => c.evento === "linkedin_pdf_extracao")).toBe(
        true,
      );
    });
    const evento = capturas.find((c) => c.evento === "linkedin_pdf_extracao");
    expect(evento?.props).toEqual({ desfecho: "perfil_nao_reconhecido" });

    const saiu = tudoQueSaiu();
    for (const marcador of MARCADORES) {
      expect(saiu).not.toContain(marcador);
    }
  });

  it("texto colado: o evento de revisao nao leva o texto junto", async () => {
    render(<Page />);
    fireEvent.click(screen.getByText(/Prefiro preencher na mão/i));
    const textarea = screen.getByPlaceholderText(/Cole aqui o texto do seu/i);

    fireEvent.paste(textarea, {
      clipboardData: { getData: () => PERFIL },
    });

    await waitFor(() => {
      expect(
        capturas.some((c) => c.evento === "linkedin_headline_review"),
      ).toBe(true);
    });

    const saiu = tudoQueSaiu();
    for (const marcador of MARCADORES) {
      expect(saiu).not.toContain(marcador);
    }
  });

  it("desfecho invalido pelo guard local: sem texto e sem contagem inventada", async () => {
    render(<Page />);
    fireEvent.click(screen.getByText(/Prefiro preencher na mão/i));
    const form = document.querySelector("form");
    if (!form) throw new Error("form nao encontrado");
    fireEvent.submit(form);

    await waitFor(() => {
      expect(
        capturas.some((c) => c.evento === "linkedin_analysis_result"),
      ).toBe(true);
    });
    const evento = capturas.find(
      (c) => c.evento === "linkedin_analysis_result",
    );
    // `null` e `indisponivel`, e NAO `false` e `0`: zero seria a afirmacao de
    // que a analise rodou e nao violou nada.
    expect(evento?.props).toEqual({
      desfecho: "invalid_request",
      nota_incompleta: null,
      violacoes_total: "indisponivel",
    });
  });
});

describe("a mensagem do servidor nunca vira property", () => {
  it("frase com marcador vira erro_generico, e o texto e descartado", () => {
    // Este e o vazamento mais provavel do fluxo: a ultima linha de
    // `linkedinClient` lanca `body.error?.message`, ou seja a frase escrita
    // pela rota, e mandar `desfecho: mensagem` seria a coisa mais natural.
    const desfecho = classificarDesfechoDeErro(
      `Algo deu errado com ${MARCADOR_SERVIDOR} no perfil`,
    );
    expect(desfecho).toBe("erro_generico");
    expect(achatar(desfecho)).not.toContain("ZQXJ");
  });
});
