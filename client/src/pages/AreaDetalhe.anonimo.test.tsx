import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { HelmetProvider } from "react-helmet-async";

/**
 * A pagina de area monta e emite o SEO CERTO sem sessao.
 *
 * Ate 2026-09-08 estas rotas viviam atras de RequireAuth, e o efeito colateral
 * silencioso era de SEO: o prerender roda sem sessao, o gate redirecionava para
 * /cadastro, e as 71 rotas de area foram para producao servindo o title, a
 * description e o CANONICAL da pagina de cadastro. O canonical era o pior: 71
 * URLs declarando ao Google que a pagina canonica delas era outra.
 *
 * Este teste trava as duas metades: o conteudo monta anonimo, e as meta tags
 * sao as da propria rota.
 *
 * EXPECTATIVAS LITERAIS, ESCRITAS A MAO. O title e o canonical abaixo foram
 * lidos de client/src/lib/data.ts no olho (a area de slug "frontend" tem
 * `nome: "Front-end"`) e transcritos. Derivar a expectativa importando areasTI
 * e remontando o template faria o teste concordar com a implementacao por
 * construcao: ele passaria mesmo se as duas estivessem erradas juntas.
 */
const AREA_SLUG = "frontend";
const TITLE_ESPERADO = "Front-end · Bora na Tech?";
const CANONICAL_ESPERADO = "https://boranatech.com.br/areas/frontend";

vi.mock("@/contexts/AuthContext", () => ({
  // ANONIMO: sem usuario e sem carregamento pendente.
  useAuth: () => ({ user: null, loading: false, signOut: vi.fn() }),
}));
vi.mock("@/contexts/SubscriptionContext", () => ({
  useSubscription: () => ({ isPro: false, isAdmin: false, loading: false }),
}));
vi.mock("@/hooks/useFavorites", () => ({
  useFavorites: () => ({
    isFavorite: () => false,
    toggleFavorite: async () => ({ ok: false, requiresAuth: true }),
  }),
}));
vi.mock("@/components/Layout", () => ({
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// `useParams` fixo na fixture; o resto do wouter fica real (Link precisa dele).
vi.mock("wouter", async (importOriginal) => {
  const real = await importOriginal<typeof import("wouter")>();
  return { ...real, useParams: () => ({ slug: AREA_SLUG }) };
});

// A rota /api/content/areas/:slug e publica, mas o teste nao faz rede: o
// `catch` do getArea ja cai no estatico, e e esse caminho que interessa aqui
// (o pior caso, em que a API nao responde, tem que renderizar igual).
vi.mock("@/services/contentService", () => ({
  getArea: async () => {
    throw new Error("sem rede no teste");
  },
}));

import AreaDetalhe from "./AreaDetalhe";

function renderizar() {
  return render(
    <HelmetProvider>
      <AreaDetalhe />
    </HelmetProvider>,
  );
}

function canonicalNoHead(): string | null {
  const el = document.head.querySelector('link[rel="canonical"]');
  return el ? el.getAttribute("href") : null;
}

describe("AreaDetalhe sem sessao", () => {
  beforeEach(() => {
    document.head.querySelectorAll("link[rel='canonical']").forEach((n) => {
      n.remove();
    });
  });

  afterEach(() => {
    cleanup();
  });

  it("monta o conteudo real da area, sem redirecionar", async () => {
    renderizar();
    // O heading da area vem do estatico no primeiro paint, sem esperar rede.
    expect(
      await screen.findByRole("heading", { name: "Front-end" }),
    ).toBeTruthy();
    // E nao renderizou o estado de "nao encontrada".
    expect(
      screen.queryByRole("heading", { name: "Área não encontrada" }),
    ).toBeNull();
  });

  it("emite o title da propria area", async () => {
    renderizar();
    await screen.findByRole("heading", { name: "Front-end" });
    await waitFor(() => {
      expect(document.title).toBe(TITLE_ESPERADO);
    });
  });

  it("emite o canonical da propria rota, e nao o de outra pagina", async () => {
    renderizar();
    await screen.findByRole("heading", { name: "Front-end" });
    await waitFor(() => {
      expect(canonicalNoHead()).toBe(CANONICAL_ESPERADO);
    });
    // A regressao concreta que este teste existe para impedir.
    expect(canonicalNoHead()).not.toBe("https://boranatech.com.br/cadastro");
    expect(document.title).not.toBe("Cadastro · Bora na Tech?");
  });
});
