import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

/**
 * EM QUE ROTAS o Natechinho aparece.
 *
 * A lista é decisão de PRODUTO, e decisão de produto que vive só no código some
 * na primeira refatoração que "simplifica" a condição. Cada exclusão aqui tem um
 * motivo diferente, e o teste guarda os três:
 *
 *   /roadmaps/:slug/prova       avaliação: assistente permitiria cola;
 *   /certificados/:code         só logado: recrutador com o link não vê;
 *   /admin                      painel: o agente é assistente de USUÁRIO e não
 *                               responde nada do que se faz ali.
 *
 * O teste exercita a checagem REATIVA (a que usa useLocation), que é a que vale
 * na navegação client-side. A do LaunchGate não serviria: ele está acima do
 * <Router /> e lê window.location.pathname direto, então não re-renderiza ao
 * navegar.
 */

const h = vi.hoisted(() => ({
  location: "/",
  auth: { user: { id: "u1" } as { id: string } | null, loading: false },
  isPro: true,
}));

vi.mock("wouter", () => ({
  useLocation: () => [h.location, vi.fn()],
  Link: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
}));
vi.mock("@/contexts/AuthContext", () => ({ useAuth: () => h.auth }));
vi.mock("@/contexts/SubscriptionContext", () => ({
  useSubscription: () => ({ isPro: h.isPro }),
}));
vi.mock("@/hooks/useAuthGate", () => ({
  useAuthGate: () => ({ requireAuth: vi.fn(), modalProps: { open: false } }),
}));
vi.mock("@/components/gate/AuthGateModal", () => ({ default: () => null }));
vi.mock("@/lib/agentClient", () => ({ streamAgentChat: vi.fn() }));
vi.mock("@/lib/agentHistoryClient", () => ({
  listConversations: vi.fn(async () => []),
  getConversation: vi.fn(),
  deleteConversation: vi.fn(),
}));

import AgentWidget from "./AgentWidget";

afterEach(() => {
  cleanup();
  h.location = "/";
  h.auth = { user: { id: "u1" }, loading: false };
  h.isPro = true;
});

/** O launcher é o único elemento que o widget renderiza fechado. */
function launcherExiste(): boolean {
  return screen.queryAllByRole("button").length > 0;
}

describe("rotas em que o agente aparece", () => {
  it("aparece numa rota comum", () => {
    // Trava do próprio instrumento: sem esta, um teste que sempre não-encontra
    // passaria em todas as exclusões afirmando nada.
    h.location = "/cursos";
    render(<AgentWidget />);
    expect(launcherExiste()).toBe(true);
  });

  it("NÃO aparece em /admin", () => {
    h.location = "/admin";
    render(<AgentWidget />);
    expect(launcherExiste()).toBe(false);
  });

  it("NÃO aparece numa sub-rota futura de /admin", () => {
    // Prefixo, não igualdade: hoje só existe a rota exata, e uma sub-rota nova
    // não pode trazer o widget de volta em silêncio.
    h.location = "/admin/financeiro";
    render(<AgentWidget />);
    expect(launcherExiste()).toBe(false);
  });

  it("continua aparecendo em rota que só COMEÇA parecida", () => {
    // `/administracao` não é o painel. Sem a barra no fim do prefixo, um
    // `startsWith("/admin")` derrubaria o widget aqui também.
    h.location = "/administradores";
    render(<AgentWidget />);
    expect(launcherExiste()).toBe(true);
  });

  it("NÃO aparece na prova, que é avaliação", () => {
    h.location = "/roadmaps/frontend/prova";
    render(<AgentWidget />);
    expect(launcherExiste()).toBe(false);
  });

  it("no certificado público, só aparece para quem está logado", () => {
    h.location = "/certificados/abc123";
    render(<AgentWidget />);
    expect(launcherExiste()).toBe(true);

    cleanup();
    h.auth = { user: null, loading: false };
    render(<AgentWidget />);
    expect(launcherExiste()).toBe(false);
  });
});
