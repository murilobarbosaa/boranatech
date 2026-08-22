import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";

/**
 * TABELA DE CUSTO DE IA POR USUARIO, na aba IA.
 *
 * O card exibia um `PendingIntegration` com a frase "Dados agregados por
 * usuario disponiveis apos 30 dias". A frase era FALSA: `logAiUsage` grava
 * `user_id` em `ai_usage_logs` desde 09/05, entao o dado existia havia mais de
 * cem dias. Um placeholder que promete DATA e pior que um que diz "nao temos":
 * ele para de ser lido como pendencia e vira paisagem.
 *
 * O que se trava aqui sao os ESTADOS, nao o feliz caminho. Tabela vazia por
 * falha de rede e a forma silenciosa de errar nesta tela: ela afirma "ninguem
 * gastou IA", que e um fato, quando o que houve foi nao conseguir perguntar.
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
          session: {
            access_token: `x.${btoa('{"admin_role":"owner"}')}.y`,
          },
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

function linha(over: Record<string, unknown> = {}) {
  return {
    userId: "uid-ana",
    email: "ana@exemplo.com",
    nome: "Ana",
    perfilAusente: false,
    calls: 12,
    success: 12,
    costUsd: 2.5,
    semCustoMedido: 0,
    ...over,
  };
}

/** `custo` null = a rota falha, para exercitar o estado de erro. */
function mockDeRotas(custo: unknown, falha = false) {
  fetchMock.mockImplementation((rota: unknown) => {
    const r = String(rota);
    if (r.startsWith("/ai-cost-per-user")) {
      return falha
        ? Promise.reject(new Error("Erro ao carregar custo de IA por usuário."))
        : Promise.resolve({ data: custo });
    }
    if (r.startsWith("/ai-stats")) return Promise.resolve({ data: {} });
    if (r.startsWith("/health-band")) {
      return Promise.resolve({ data: { ok: true, problemas: [] } });
    }
    return Promise.resolve({ data: {} });
  });
}

async function abrirAbaIa() {
  window.history.replaceState({}, "", "/admin?section=ia");
  render(<Admin />);
  // Ancora no card VIZINHO: "Custo por usuário" casa em mais de um no de texto
  // (o titulo e a celula), e getByText lanca em multiplos.
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

describe("aba IA, custo por usuário", () => {
  it("a promessa falsa dos 30 dias NÃO existe mais", async () => {
    // O texto exato que ficou no ar por mais de cem dias.
    mockDeRotas({
      top: [linha()],
      semUsuario: null,
      maisUsuarios: 0,
      usuariosDistintos: 1,
    });
    await abrirAbaIa();
    await waitFor(() =>
      expect(screen.getByTestId("ia-custo-por-usuario")).toBeTruthy(),
    );
    expect(screen.queryByText(/disponíveis após 30 dias/i)).toBeNull();
  });

  it("renderiza a tabela com e-mail, chamadas e custo em dólar", async () => {
    mockDeRotas({
      top: [
        linha(),
        linha({
          userId: "uid-bia",
          email: "bia@exemplo.com",
          costUsd: 0.5,
          calls: 3,
        }),
      ],
      semUsuario: null,
      maisUsuarios: 0,
      usuariosDistintos: 2,
    });
    await abrirAbaIa();

    const tabela = await screen.findByTestId("ia-custo-por-usuario");
    expect(tabela.textContent).toContain("ana@exemplo.com");
    expect(tabela.textContent).toContain("bia@exemplo.com");
    // DÓLAR, o mesmo formato do card de custo por ferramenta ao lado.
    expect(tabela.textContent).toContain("US$ 2.50");
    expect(tabela.textContent).toContain("US$ 0.50");
    // CONTROLE NEGATIVO: nada de real nesta superfície.
    expect(tabela.textContent).not.toContain("R$");
  });

  it("perfil ausente aparece com id truncado e a marca, não em branco", async () => {
    mockDeRotas({
      top: [
        linha({
          userId: "uid-fantasma-longo",
          email: null,
          nome: null,
          perfilAusente: true,
        }),
      ],
      semUsuario: null,
      maisUsuarios: 0,
      usuariosDistintos: 1,
    });
    await abrirAbaIa();

    const tabela = await screen.findByTestId("ia-custo-por-usuario");
    expect(tabela.textContent).toContain("uid-fant");
    expect(tabela.textContent).toContain("perfil ausente");
  });

  it("cai para o NOME quando não há e-mail", async () => {
    mockDeRotas({
      top: [linha({ email: null, nome: "Ana Julia", perfilAusente: false })],
      semUsuario: null,
      maisUsuarios: 0,
      usuariosDistintos: 1,
    });
    await abrirAbaIa();

    const tabela = await screen.findByTestId("ia-custo-por-usuario");
    expect(tabela.textContent).toContain("Ana Julia");
    // CONTROLE NEGATIVO: perfil existe, então a marca de ausente não aparece.
    expect(tabela.textContent).not.toContain("perfil ausente");
  });

  it("o balde sem usuário aparece, e some quando não existe", async () => {
    mockDeRotas({
      top: [linha()],
      semUsuario: { calls: 4, success: 4, costUsd: 1.25, semCustoMedido: 1 },
      maisUsuarios: 0,
      usuariosDistintos: 1,
    });
    await abrirAbaIa();
    const balde = await screen.findByTestId("ia-custo-sem-usuario");
    expect(balde.textContent).toContain("Sem usuário");
    expect(balde.textContent).toContain("US$ 1.25");

    cleanup();
    mockDeRotas({
      top: [linha()],
      semUsuario: null,
      maisUsuarios: 0,
      usuariosDistintos: 1,
    });
    await abrirAbaIa();
    await screen.findByTestId("ia-custo-por-usuario");
    expect(screen.queryByTestId("ia-custo-sem-usuario")).toBeNull();
  });

  it("o resto do ranking é DECLARADO, não cortado em silêncio", async () => {
    mockDeRotas({
      top: [linha()],
      semUsuario: null,
      maisUsuarios: 37,
      usuariosDistintos: 38,
    });
    await abrirAbaIa();
    const resto = await screen.findByTestId("ia-custo-resto");
    expect(resto.textContent).toContain("37");

    // CONTROLE NEGATIVO: sem resto, a linha não aparece (senão "e mais 0
    // usuários" viraria ruído permanente no rodapé).
    cleanup();
    mockDeRotas({
      top: [linha()],
      semUsuario: null,
      maisUsuarios: 0,
      usuariosDistintos: 1,
    });
    await abrirAbaIa();
    await screen.findByTestId("ia-custo-por-usuario");
    expect(screen.queryByTestId("ia-custo-resto")).toBeNull();
  });

  it("janela vazia diz que está vazia, e NÃO some sem explicação", async () => {
    mockDeRotas({
      top: [],
      semUsuario: null,
      maisUsuarios: 0,
      usuariosDistintos: 0,
    });
    await abrirAbaIa();
    await waitFor(() =>
      expect(screen.getByText(/Nenhuma chamada de IA na janela/i)).toBeTruthy(),
    );
    expect(screen.queryByTestId("ia-custo-por-usuario")).toBeNull();
  });

  it("ERRO vira mensagem, nunca tabela vazia", async () => {
    // A distinção que esta tela precisa preservar: "ninguém gastou IA" e "não
    // consegui perguntar" são fatos diferentes, e vazio afirma o primeiro.
    mockDeRotas(null, true);
    await abrirAbaIa();

    await waitFor(() =>
      expect(
        screen.getByText(/Erro ao carregar custo de IA por usuário/i),
      ).toBeTruthy(),
    );
    expect(screen.queryByTestId("ia-custo-por-usuario")).toBeNull();
    expect(screen.queryByText(/Nenhuma chamada de IA na janela/i)).toBeNull();
  });

  it("JANELA DE DEPLOY: backend antigo sem a rota não derruba a aba", async () => {
    // A Vercel sobe antes do Railway, e por 1 a 3 minutos o bundle novo fala
    // com o backend ANTIGO, que não conhece esta rota nem estes campos. Um
    // `top.length` direto sobre esse payload lança TypeError e leva a aba
    // INTEIRA junto, o que é pior que não mostrar a tabela.
    //
    // Este teste NASCEU de uma quebra real: a suíte inteira acusou quatro
    // vermelhos em `Admin.ia.moeda.test.tsx`, que não mocka esta rota e por
    // isso reproduziu exatamente a resposta do backend antigo.
    mockDeRotas({});
    await abrirAbaIa();

    await waitFor(() =>
      expect(screen.getByText(/Nenhuma chamada de IA na janela/i)).toBeTruthy(),
    );
    // O card VIZINHO continua de pé: é isso que "não derruba a aba" quer dizer.
    expect(screen.getByText(/Custo por ferramenta/i)).toBeTruthy();
  });

  it("payload PARCIAL degrada campo a campo, sem inventar número", async () => {
    // Só `top`, sem `maisUsuarios` nem `semUsuario`. Cada ausência vira o
    // estado vazio equivalente, nunca um número plausível.
    mockDeRotas({ top: [linha()] });
    await abrirAbaIa();

    const tabela = await screen.findByTestId("ia-custo-por-usuario");
    expect(tabela.textContent).toContain("ana@exemplo.com");
    expect(screen.queryByTestId("ia-custo-resto")).toBeNull();
    expect(screen.queryByTestId("ia-custo-sem-usuario")).toBeNull();
  });

  it("a janela dos 30 dias fica ESCRITA, para a tabela não parecer 'desde sempre'", async () => {
    mockDeRotas({
      top: [linha()],
      semUsuario: null,
      maisUsuarios: 0,
      usuariosDistintos: 1,
    });
    await abrirAbaIa();
    await screen.findByTestId("ia-custo-por-usuario");
    expect(screen.getByText(/Últimos 30 dias/i)).toBeTruthy();
  });
});
