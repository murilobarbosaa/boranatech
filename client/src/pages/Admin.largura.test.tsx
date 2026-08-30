import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";

/**
 * QUEM ESCAPA DO TETO DE LARGURA, e quem NAO.
 *
 * O `.container` do admin trava em 1280px a partir de lg. O kanban e a unica
 * secao que ganha com mais largura (coluna de 13rem fixa: o teto decide quantas
 * cabem), e num monitor largo sobrava margem morta enquanto a fileira rolava na
 * horizontal.
 *
 * A EXCECAO E POR SECAO **E** POR MODO, e este arquivo existe porque essa
 * conjuncao e facil de perder. As tres asercoes negativas valem tanto quanto a
 * positiva: uma largura cheia que vazasse para a lista ou para as outras abas
 * esticaria linha de texto e coluna de tabela, e ninguem abre um chamado
 * dizendo "minha tabela ficou larga demais" -- so acha o admin pior.
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
    profile: null,
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

/** A classe que neutraliza o teto. Uma constante para os quatro testes. */
const ESCAPE = "lg:max-w-none";

beforeEach(() => {
  fetchMock.mockReset();
  fetchMock.mockRejectedValue(new Error("sem dados no teste"));
});

afterEach(cleanup);

async function abrirEm(url: string) {
  window.history.replaceState({}, "", url);
  render(<Admin />);
  await waitFor(() => expect(screen.getByTestId("admin-secoes")).toBeTruthy());
  return screen.getByTestId("admin-secoes");
}

describe("largura cheia: so o quadro de tarefas", () => {
  it("Tarefas no modo BOARD escapa do teto", async () => {
    const secoes = await abrirEm("/admin?section=tarefas");
    expect(secoes.className).toContain(ESCAPE);
  });

  it("Tarefas com ?view=board explicito tambem escapa", async () => {
    // `board` e o default quando o parametro nao vem; declarado, tem de dar no
    // mesmo. Sem este teste, um readViewState que so aceitasse o implicito
    // passaria.
    const secoes = await abrirEm("/admin?section=tarefas&view=board");
    expect(secoes.className).toContain(ESCAPE);
  });

  it("Tarefas no modo LISTA NAO escapa: lista e leitura", async () => {
    // O par que prova que a condicao olha o MODO, e nao so a secao. Com uma
    // condicao so por secao, este teste falharia.
    const secoes = await abrirEm("/admin?section=tarefas&view=lista");
    expect(secoes.className).not.toContain(ESCAPE);
  });

  it("Usuarios NAO escapa, mesmo com ?view=board na URL", async () => {
    // O par simetrico: prova que a condicao olha a SECAO, e nao so o modo. O
    // `view=board` fica na URL quando alguem volta de Tarefas para Usuarios, e
    // e exatamente assim que uma condicao pela metade vazaria.
    const secoes = await abrirEm("/admin?section=usuarios&view=board");
    expect(secoes.className).not.toContain(ESCAPE);
  });

  it("Visao geral (sem ?section) NAO escapa", async () => {
    const secoes = await abrirEm("/admin");
    expect(secoes.className).not.toContain(ESCAPE);
  });

  it("o teto continua sendo o do `.container` em todos os casos", async () => {
    // CONTROLE do controle: o escape NEUTRALIZA o teto, nao troca o contêiner.
    // Se alguem substituir `container` por outra coisa, o padding lateral e o
    // alinhamento da pagina mudam junto e nenhum dos testes acima acusaria.
    for (const url of ["/admin?section=tarefas", "/admin?section=usuarios"]) {
      cleanup();
      const secoes = await abrirEm(url);
      expect(secoes.className, url).toContain("container");
    }
  });
});
