import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { HelmetProvider } from "react-helmet-async";

/**
 * A pagina de SUBAREA monta e emite o SEO certo sem sessao.
 *
 * Mesmo defeito e mesma prova da irma AreaDetalhe.anonimo.test.tsx: com o
 * RequireAuth no caminho, o prerender (que roda anonimo) capturava a pagina de
 * cadastro e o canonical apontava para /cadastro.
 *
 * EXPECTATIVAS LITERAIS, ESCRITAS A MAO, lidas de client/src/lib/data.ts no
 * olho: a area de slug "dados" tem `nome: "Ciência de Dados"` e, entre as
 * subareas, a de slug "analista-dados" tem `nome: "Analista de Dados"`.
 * Transcritas aqui e nao derivadas de areasTI de proposito: expectativa que
 * nasce do mesmo mecanismo da implementacao concorda com ela por construcao.
 */
const PARENT_SLUG = "dados";
const SUBAREA_SLUG = "analista-dados";
const TITLE_ESPERADO = "Analista de Dados · Ciência de Dados · Bora na Tech?";
const CANONICAL_ESPERADO =
  "https://boranatech.com.br/areas/dados/analista-dados";

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({ user: null, loading: false, signOut: vi.fn() }),
}));
vi.mock("@/contexts/SubscriptionContext", () => ({
  useSubscription: () => ({ isPro: false, isAdmin: false, loading: false }),
}));
vi.mock("@/components/Layout", () => ({
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock("wouter", async (importOriginal) => {
  const real = await importOriginal<typeof import("wouter")>();
  return {
    ...real,
    useRoute: () => [true, { parent: PARENT_SLUG, subarea: SUBAREA_SLUG }],
  };
});

import SubAreaDetalhe from "./SubAreaDetalhe";

function renderizar() {
  return render(
    <HelmetProvider>
      <SubAreaDetalhe />
    </HelmetProvider>,
  );
}

function canonicalNoHead(): string | null {
  const el = document.head.querySelector('link[rel="canonical"]');
  return el ? el.getAttribute("href") : null;
}

describe("SubAreaDetalhe sem sessao", () => {
  beforeEach(() => {
    document.head.querySelectorAll("link[rel='canonical']").forEach((n) => {
      n.remove();
    });
  });

  afterEach(() => {
    cleanup();
  });

  it("monta o conteudo real da subarea, sem redirecionar", async () => {
    renderizar();
    expect(
      await screen.findByRole("heading", { name: "Analista de Dados" }),
    ).toBeTruthy();
    expect(
      screen.queryByText(/Subárea não encontrada|não encontrada\./),
    ).toBeNull();
  });

  it("emite o title da propria subarea, com a area mae", async () => {
    renderizar();
    await screen.findByRole("heading", { name: "Analista de Dados" });
    await waitFor(() => {
      expect(document.title).toBe(TITLE_ESPERADO);
    });
  });

  it("emite o canonical da propria rota, e nao o de outra pagina", async () => {
    renderizar();
    await screen.findByRole("heading", { name: "Analista de Dados" });
    await waitFor(() => {
      expect(canonicalNoHead()).toBe(CANONICAL_ESPERADO);
    });
    expect(canonicalNoHead()).not.toBe("https://boranatech.com.br/cadastro");
    expect(document.title).not.toBe("Cadastro · Bora na Tech?");
  });
});
