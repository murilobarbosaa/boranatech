import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";

/**
 * ROTULOS EM PORTUGUES das ferramentas de IA, na aba IA.
 *
 * Os cards exibiam o SLUG tecnico ("resume-analyzer", "github-perfil"), que e o
 * identificador gravado em `ai_usage_logs.tool`. Chave certa no banco, rotulo
 * errado numa tela de gestao.
 *
 * O que se trava aqui e o FALLBACK, nao a traducao. O mapa nao e exaustivo por
 * decisao: ha slugs em producao fora dele, e um mapa que se afirmasse completo
 * seria uma lista escrita a mao sobre um conjunto que cresce. Slug sem traducao
 * precisa aparecer CRU, porque a alternativa (rotulo inventado ou linha
 * omitida) esconderia uma ferramenta que esta gastando dinheiro de verdade.
 */

const fetchMock = vi.hoisted(() => vi.fn());
vi.mock("@/lib/adminApi", () => ({
  adminFetch: (...args: unknown[]) => fetchMock(...args),
}));

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({
    loading: false,
    signOut: vi.fn(),
    user: { id: "admin-1", email: "admin@exemplo.com" },
  }),
}));

vi.mock("@/lib/supabase", () => ({
  supabase: {
    auth: {
      getSession: async () => ({
        data: {
          session: { access_token: `x.${btoa('{"admin_role":"owner"}')}.y` },
        },
      }),
    },
  },
}));

vi.mock("@/lib/api", () => ({ apiUrl: (p: string) => p }));

class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
(globalThis as { ResizeObserver?: unknown }).ResizeObserver =
  (globalThis as { ResizeObserver?: unknown }).ResizeObserver ??
  ResizeObserverStub;

import Admin from "./Admin";

function mockDeRotas(aiStats: unknown) {
  fetchMock.mockImplementation((rota: unknown) => {
    const r = String(rota);
    if (r.startsWith("/ai-stats")) return Promise.resolve({ data: aiStats });
    if (r.startsWith("/health-band")) {
      return Promise.resolve({ data: { ok: true, problemas: [] } });
    }
    return Promise.resolve({ data: {} });
  });
}

async function abrirAbaIa() {
  window.history.replaceState({}, "", "/admin?section=ia");
  render(<Admin />);
  await waitFor(() =>
    expect(screen.getByText(/Custo por ferramenta/i)).toBeTruthy(),
  );
}

beforeEach(() => {
  fetchMock.mockReset();
});

afterEach(() => {
  cleanup();
  window.history.replaceState({}, "", "/admin");
  vi.restoreAllMocks();
});

describe("rótulos das ferramentas de IA", () => {
  it("mostra o nome em português, e NÃO o slug técnico", async () => {
    mockDeRotas({
      "resume-analyzer": { calls: 10, success: 10, cost: 1 },
      "github-perfil": { calls: 5, success: 5, cost: 0.5 },
    });
    await abrirAbaIa();

    // Dois cards renderizam a mesma ferramenta, então cada rótulo aparece duas
    // vezes: `getAllByText` de propósito.
    expect(
      screen.getAllByText("Analisador de Currículo").length,
    ).toBeGreaterThan(0);
    expect(
      screen.getAllByText("Analisador de GitHub (perfil)").length,
    ).toBeGreaterThan(0);
    // O FREIO: o slug não pode mais estar visível como texto.
    expect(screen.queryByText("resume-analyzer")).toBeNull();
    expect(screen.queryByText("github-perfil")).toBeNull();
  });

  it("o slug técnico continua acessível no title, para depuração", async () => {
    mockDeRotas({ "resume-analyzer": { calls: 10, success: 10, cost: 1 } });
    await abrirAbaIa();

    const rotulos = screen.getAllByText("Analisador de Currículo");
    expect(rotulos.length).toBeGreaterThan(0);
    for (const el of rotulos) {
      expect(el.getAttribute("title")).toBe("resume-analyzer");
    }
  });

  it("os slugs vivos e os históricos têm rótulo, nenhum cai no fallback", async () => {
    // O censo de 2026-08-22 (ver o comentário do mapa em Admin.tsx): os slugs
    // que `logAiUsage` grava hoje, mais os dois históricos cujas linhas de 14/08
    // ainda caem na janela de 30 dias da aba. Se algum destes voltar a aparecer
    // cru na tela, o mapa perdeu uma entrada.
    const ESPERADOS: Array<[string, string]> = [
      ["career-plan-chat", "Chat do Plano de Carreira"],
      ["interview-tts", "Voz da Entrevista"],
      ["project-validation", "Validação de Projeto"],
      ["study-plan-build", "Plano de Estudos (construção)"],
      ["interview", "Entrevista (formato antigo)"],
    ];
    mockDeRotas(
      Object.fromEntries(
        ESPERADOS.map(([slug]) => [slug, { calls: 1, success: 1, cost: 0.1 }]),
      ),
    );
    await abrirAbaIa();

    for (const [slug, rotulo] of ESPERADOS) {
      expect(screen.getAllByText(rotulo).length).toBeGreaterThan(0);
      // O FREIO: o slug não pode aparecer como texto em lugar nenhum.
      expect(screen.queryByText(slug)).toBeNull();
    }
  });

  it("FALLBACK: ferramenta sem tradução aparece pelo slug cru, nunca some", async () => {
    // O caso que decide o desenho: sumir com a linha, ou trocá-la por
    // "Ferramenta desconhecida", esconderia gasto real de IA.
    //
    // O SLUG É FICTÍCIO DE PROPÓSITO. A primeira versão deste teste usava
    // `career-plan-chat`, que era um slug real ainda sem tradução; assim que o
    // mapa foi completado, o exemplo ganhou rótulo e o teste passou a medir o
    // contrário do que afirma. Um teste de fallback ancorado num slug real tem
    // prazo de validade igual ao do mapa. Com um nome que nunca vai existir, ele
    // fica imune ao crescimento do mapa, que é justamente o que se quer testar.
    mockDeRotas({
      "ferramenta-fantasma-teste": { calls: 7, success: 7, cost: 3.5 },
      "resume-analyzer": { calls: 1, success: 1, cost: 0.1 },
    });
    await abrirAbaIa();

    expect(
      screen.getAllByText("ferramenta-fantasma-teste").length,
    ).toBeGreaterThan(0);
    // E o custo dele continua na tela: a linha não foi engolida.
    expect(screen.getByText("US$ 3.50")).toBeTruthy();
    // CONTROLE NEGATIVO: nada de rótulo inventado para o desconhecido.
    expect(screen.queryByText(/desconhecid/i)).toBeNull();
  });

  it("traduzida e não traduzida convivem no mesmo card", async () => {
    // Slug fictício pelo mesmo motivo do teste acima: o exemplo anterior
    // (`project-validation`) era real e ganhou tradução no commit seguinte.
    mockDeRotas({
      "agent-chat": { calls: 2, success: 2, cost: 0.2 },
      "outra-ferramenta-inexistente-teste": {
        calls: 3,
        success: 3,
        cost: 0.3,
      },
    });
    await abrirAbaIa();

    expect(screen.getAllByText("Chat do Agente").length).toBeGreaterThan(0);
    expect(
      screen.getAllByText("outra-ferramenta-inexistente-teste").length,
    ).toBeGreaterThan(0);
  });
});
