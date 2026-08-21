import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * A CADEIA INTEIRA DO 409, do cliente HTTP ate a tela.
 *
 * O teste irmao (`components/linkedin/LinkedinEmAndamento.test.tsx`) prova o
 * COMPONENTE: dada a string de estado, ele renderiza a copy propria e suprime o
 * botao de tentar de novo. Ele nao prova que a pagina CHEGA nesse estado, e era
 * exatamente ali que a fiacao poderia faltar.
 *
 * Aqui roda a pagina de verdade, com `analyzeLinkedin` dublado no ponto em que
 * o cliente HTTP ja traduziu o 409 (`ANALISE_EM_ANDAMENTO`). O que se afirma:
 *
 *   1. a mensagem propria chega ao DOM;
 *   2. a rota de analise NAO e chamada de novo, nem sozinha nem por acao
 *      disponivel na tela. O contador fica em 1, a chamada que levou o 409;
 *   3. o desfecho instrumentado do funil e `analise_em_andamento`, e nao um
 *      balde generico.
 *
 * Nada de rede: o cliente esta dublado por funcao.
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

const capture = vi.fn();
vi.mock("posthog-js", () => ({
  default: { capture: (...a: unknown[]) => capture(...a) },
}));

vi.mock("pdfjs-dist", () => ({
  GlobalWorkerOptions: { workerSrc: "" },
  getDocument: () => ({ promise: Promise.reject(new Error("sem pdf aqui")) }),
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
vi.mock("@/lib/useLinkedinImprovementProgress", () => ({
  useLinkedinImprovementProgress: () => ({
    applied: new Set<number>(),
    toggle: vi.fn(),
    saving: false,
    error: "",
  }),
}));

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

import { LINKEDIN_EM_ANDAMENTO_COPY } from "@/components/linkedin/LinkedinStates";
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

/** Mesmo caminho do teste de recuperacao: o form completo vem do storage. */
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

async function chegarAo409() {
  semearFormularioCompleto();
  analyzeLinkedin.mockRejectedValue(new Error("ANALISE_EM_ANDAMENTO"));
  render(<Page />);
  const form = document.querySelector("form");
  if (!form) throw new Error("form nao encontrado");
  fireEvent.submit(form);
  await waitFor(() => {
    expect(screen.getByText(LINKEDIN_EM_ANDAMENTO_COPY)).toBeTruthy();
  });
  expect(analyzeLinkedin).toHaveBeenCalledTimes(1);
}

beforeEach(() => {
  window.sessionStorage.clear();
  analyzeLinkedin.mockReset();
  listLinkedinAnalyses.mockReset();
  getLinkedinAnalysis.mockReset();
  capture.mockClear();
  listLinkedinAnalyses.mockResolvedValue([]);
});

afterEach(() => {
  cleanup();
  window.sessionStorage.clear();
  vi.restoreAllMocks();
});

describe("a pagina chega ao estado novo e nao pede outra analise", () => {
  it("renderiza a mensagem propria vinda do 409", async () => {
    await chegarAo409();
    expect(screen.getByText(LINKEDIN_EM_ANDAMENTO_COPY)).toBeTruthy();
  });

  it("ZERO analise nova: nem automatica, nem por botao na tela", async () => {
    await chegarAo409();

    // Nenhuma acao da tela pode disparar analise. Clicar em TUDO que existe e a
    // forma de afirmar isso sem depender de eu ter listado os botoes certos: se
    // um botao novo aparecer amanha e disparar analise, este teste cai.
    for (const botao of Array.from(document.querySelectorAll("button"))) {
      fireEvent.click(botao);
    }
    await waitFor(() => {
      expect(screen.queryByText(LINKEDIN_EM_ANDAMENTO_COPY)).toBeTruthy();
    });

    // O contador continua em 1: a unica chamada e a que levou o 409.
    expect(analyzeLinkedin).toHaveBeenCalledTimes(1);
  });

  it("o botao de tentar de novo nao esta na tela", async () => {
    await chegarAo409();
    expect(screen.queryByText(/Tentar de novo/i)).toBeNull();
  });

  it("o funil recebe o desfecho proprio, e nao um balde generico", async () => {
    await chegarAo409();

    const desfechos = capture.mock.calls
      .filter((c) => typeof c[1] === "object" && c[1] !== null)
      .map((c) => (c[1] as { desfecho?: unknown }).desfecho)
      .filter((d): d is string => typeof d === "string");

    expect(desfechos).toContain("analise_em_andamento");
    // A colisao que interessa evitar: se caisse em `erro_generico`, o painel
    // nao distinguiria "abriu duas abas" de qualquer outra falha.
    expect(desfechos).not.toContain("erro_generico");
    expect(desfechos).not.toContain("rate_limited");
  });
});
