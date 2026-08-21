import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * DEPOIS DE UM TIMEOUT, A PAGINA MANDA PROCURAR ANTES DE PAGAR DE NOVO?
 *
 * O achado que este lote fecha: o servidor NAO percebe o aborto do client. Ele
 * termina a analise, grava a linha de uso e persiste. A mensagem antiga mandava
 * "tente de novo em alguns minutos", que e a acao mais cara possivel: cobra uma
 * segunda analise por um trabalho ja concluido e ja gravado.
 *
 * Quatro afirmacoes, e a terceira e a que da valor as outras:
 *
 *   1. o estado de timeout renderiza a mensagem nova, com a acao de busca;
 *   2. a acao chama a CONSULTA do historico;
 *   3. a acao NUNCA chama a rota de analise (assercao negativa explicita), e o
 *      fluxo em que a analise e encontrada a exibe com a rota de analise em
 *      ZERO chamada;
 *   4. a busca so aparece no timeout: nos outros erros nao ha analise em voo
 *      para procurar, e oferecer a busca seria prometer o que nao existe.
 *
 * Nada de rede. O cliente HTTP esta dublado por funcao, entao o que se observa e
 * exatamente qual chamada a pagina faz, que e a pergunta deste arquivo.
 */

const analyzeLinkedin = vi.fn();
const listLinkedinAnalyses = vi.fn();
const getLinkedinAnalysis = vi.fn();

vi.mock("@/lib/linkedinClient", async (importActual) => {
  const real = await importActual<typeof import("@/lib/linkedinClient")>();
  return {
    ...real,
    analyzeLinkedin: (...args: unknown[]) => analyzeLinkedin(...args),
    listLinkedinAnalyses: (...args: unknown[]) => listLinkedinAnalyses(...args),
    getLinkedinAnalysis: (...args: unknown[]) => getLinkedinAnalysis(...args),
  };
});

vi.mock("pdfjs-dist", () => ({
  GlobalWorkerOptions: { workerSrc: "" },
  getDocument: () => ({ promise: Promise.reject(new Error("sem pdf aqui")) }),
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
vi.mock("@/lib/supabase", () => ({ supabase: null }));
vi.mock("@/lib/useLinkedinImprovementProgress", () => ({
  useLinkedinImprovementProgress: () => ({
    applied: new Set<number>(),
    toggle: vi.fn(),
    saving: false,
    error: "",
  }),
}));

// jsdom nao implementa `scrollIntoView`, e a pagina o chama ao chegar o
// resultado e ao sair o erro. Sem o duble, a falha aparece como
// `unhandledRejection` no meio de um teste que nao tem nada a ver com scroll.
Element.prototype.scrollIntoView = function scrollIntoViewStub() {};

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
  LinkedinError,
  LINKEDIN_TIMEOUT_COPY,
} from "@/components/linkedin/LinkedinStates";
import { encodeLinkedinStoredState } from "@/lib/linkedinStoredState";
import Page from "./LinkedinAnalisar";

const STORAGE_KEY = "boranatech:linkedin-analyzer";

const PERFIL = `Fulana Teste
Desenvolvedora Front-end | React, TypeScript
Sobre
${"Construo interfaces de produto para times distribuidos ha alguns anos. ".repeat(4)}
Experiência
Empresa Alfa
Desenvolvedora Front-end
janeiro de 2022 - o momento
Desenvolvi telas em React e acompanhei metricas de qualidade do produto.`;

/**
 * FORMULARIO COMPLETO em sessionStorage.
 *
 * A pagina restaura o form do storage na montagem, e e esse o caminho usado
 * aqui para chegar ao submit. Encenar os cinco selects Radix so para preencher
 * contexto custaria mais em fragilidade do que entrega em confianca, e o mesmo
 * criterio ja esta escrito em `LinkedinAnalisarEntradaPdf.test.tsx`. O que
 * importa provar nao esta no formulario: esta no que a pagina chama depois.
 */
function semearFormularioCompleto() {
  window.sessionStorage.setItem(
    STORAGE_KEY,
    encodeLinkedinStoredState({
      form: {
        profileText: PERFIL,
        area: "frontend",
        level: "junior",
        mercado: "brasil",
        skills: "React, TypeScript",
        objetivo: "",
        foto: "sim",
        banner: "sim",
        openToWork: "sim",
        conexoes: "100-500",
        atividade: "semanal",
      },
      result: null,
      analysisId: null,
      textoHash: null,
      headlineManual: null,
    }),
  );
}

/** Resumo de historico minimo que `readAnalysisSummary` aceitaria de volta. */
function resumo(id: string) {
  return {
    id,
    area: "frontend",
    level: "junior",
    score: 62,
    faixa: "boa",
    created_at: "2026-08-21T12:00:00.000Z",
    deterministicVersion: 5,
    qualitativeVersion: null,
    comparacaoVersion: null,
    mercado: "brasil",
    headlineComparacao: null,
    headlineOrigem: null,
    skillsComparacao: null,
    foto: "sim",
    banner: "sim",
    openToWork: "sim",
    conexoes: "100-500",
    atividade: "semanal",
    notaIncompleta: false,
    checks: null,
    textoHash: null,
  };
}

async function chegarAoTimeout() {
  semearFormularioCompleto();
  analyzeLinkedin.mockRejectedValue(new Error("TIMEOUT"));
  render(<Page />);

  const form = document.querySelector("form");
  if (!form) throw new Error("form nao encontrado");
  fireEvent.submit(form);

  await waitFor(() => {
    expect(screen.getByText(LINKEDIN_TIMEOUT_COPY.mensagem)).toBeTruthy();
  });
  // A analise saiu UMA vez, a que estourou. Daqui para a frente o contador nao
  // pode subir mais, e e isso que os testes abaixo vigiam.
  expect(analyzeLinkedin).toHaveBeenCalledTimes(1);
}

beforeEach(() => {
  window.sessionStorage.clear();
  analyzeLinkedin.mockReset();
  listLinkedinAnalyses.mockReset();
  getLinkedinAnalysis.mockReset();
  listLinkedinAnalyses.mockResolvedValue([]);
});

afterEach(() => {
  cleanup();
  window.sessionStorage.clear();
  vi.restoreAllMocks();
});

describe("a mensagem de timeout parou de mandar pagar de novo", () => {
  it("nao sugere tentar de novo como primeira acao, e aponta o historico", () => {
    const texto = LINKEDIN_TIMEOUT_COPY.mensagem.toLowerCase();
    // A frase antiga, pelo que ela mandava fazer. Ela dizia "tente de novo em
    // alguns minutos" como acao unica e primeira.
    expect(texto).not.toContain("tente de novo em alguns minutos");
    // O que ela precisa dizer agora: a analise pode existir, e procurar e barato.
    expect(texto).toContain("histórico");
    expect(texto).toContain("não gasta uma nova análise");
  });

  it("a promessa e CONDICIONAL, nao afirma que a analise existe", () => {
    // "pode ter terminado" e "se ela estiver la". Prometer que existe seria
    // inventar: o timeout nao sabe se o servidor terminou.
    const texto = LINKEDIN_TIMEOUT_COPY.mensagem.toLowerCase();
    expect(texto).toContain("pode ter terminado");
    expect(texto).toContain("se ela estiver lá");
  });
});

describe("a acao de busca consulta o historico, e so ele", () => {
  it("clicar chama a consulta do historico e NUNCA a rota de analise", async () => {
    await chegarAoTimeout();
    const chamadasDeHistoricoAntes = listLinkedinAnalyses.mock.calls.length;

    fireEvent.click(screen.getByText(LINKEDIN_TIMEOUT_COPY.acao));

    await waitFor(() => {
      expect(listLinkedinAnalyses.mock.calls.length).toBeGreaterThan(
        chamadasDeHistoricoAntes,
      );
    });
    // ASSERCAO NEGATIVA EXPLICITA. E ela que separa esta acao de "tentar de
    // novo": o contador de analises nao se move.
    expect(analyzeLinkedin).toHaveBeenCalledTimes(1);
  });

  it("achou a analise completada: exibe, sem nova cobranca", async () => {
    await chegarAoTimeout();

    // O historico volta com uma linha que NAO estava la no submit.
    listLinkedinAnalyses.mockResolvedValue([resumo("analise-nova")]);
    getLinkedinAnalysis.mockResolvedValue({
      ...resumo("analise-nova"),
      result: RESULTADO,
    });

    fireEvent.click(screen.getByText(LINKEDIN_TIMEOUT_COPY.acao));

    // O erro sai da tela: a pessoa esta vendo a analise que ja tinha pago.
    await waitFor(() => {
      expect(screen.queryByText(LINKEDIN_TIMEOUT_COPY.mensagem)).toBeNull();
    });
    expect(getLinkedinAnalysis).toHaveBeenCalledWith("analise-nova");
    // O NUMERO QUE IMPORTA: a recuperacao inteira custou zero analise.
    expect(analyzeLinkedin).toHaveBeenCalledTimes(1);
  });

  it("nao achou: diz isso como estado, e segue sem cobrar", async () => {
    await chegarAoTimeout();
    // Historico vazio: nada apareceu ainda.
    listLinkedinAnalyses.mockResolvedValue([]);

    fireEvent.click(screen.getByText(LINKEDIN_TIMEOUT_COPY.acao));

    await waitFor(() => {
      expect(screen.getByText(LINKEDIN_TIMEOUT_COPY.vazio)).toBeTruthy();
    });
    // Nem no caminho vazio a pagina dispara analise por conta propria.
    expect(analyzeLinkedin).toHaveBeenCalledTimes(1);
    expect(getLinkedinAnalysis).not.toHaveBeenCalled();
  });
});

describe("a busca so existe onde faz sentido", () => {
  it("timeout oferece as duas acoes, com a barata primeiro", () => {
    const onRecuperar = vi.fn();
    const onRetry = vi.fn();
    const { container } = render(
      <LinkedinError
        error="TIMEOUT"
        onRetry={onRetry}
        onRecuperar={onRecuperar}
      />,
    );
    const botoes = Array.from(container.querySelectorAll("button")).map(
      (b) => b.textContent ?? "",
    );
    expect(botoes[0]).toContain(LINKEDIN_TIMEOUT_COPY.acao);
    expect(botoes[1]).toContain("Tentar de novo");
    // Tentar de novo CONTINUA existindo: e a saida certa quando a analise
    // realmente nao completou. O que mudou foi a ordem.
    fireEvent.click(container.querySelectorAll("button")[1]);
    expect(onRetry).toHaveBeenCalledTimes(1);
    expect(onRecuperar).not.toHaveBeenCalled();
  });

  it("erro que nao e timeout nao oferece busca nenhuma", () => {
    const onRecuperar = vi.fn();
    const { container } = render(
      <LinkedinError
        error="ANALYSIS_FAILED"
        onRetry={vi.fn()}
        onRecuperar={onRecuperar}
      />,
    );
    expect(container.textContent).not.toContain(LINKEDIN_TIMEOUT_COPY.acao);
  });

  it("enquanto procura, o botao anuncia e nao aceita segundo clique", () => {
    const onRecuperar = vi.fn();
    const { container } = render(
      <LinkedinError error="TIMEOUT" onRecuperar={onRecuperar} recuperando />,
    );
    const botao = container.querySelector("button");
    expect(botao?.textContent).toContain(LINKEDIN_TIMEOUT_COPY.procurando);
    expect(botao?.hasAttribute("disabled")).toBe(true);
  });
});

/** Resposta minima que `readLinkedinAnalysisResponse` aceita de volta. */
const RESULTADO = {
  deterministic: {
    score: 62,
    faixa: "boa",
    checks: [],
    notaIncompleta: false,
    keywordsCampos: {},
  },
  deterministicVersion: 5,
  qualitative: null,
  qualitativeVersion: null,
};
