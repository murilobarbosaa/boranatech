import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";

/**
 * Itens 5.2, 5.3 e 5.5: o card de opt-in de marketing do /bem-vindo.
 *
 * O defeito consertado: dispensar o card (seguir sem marcar) nao gravava NADA,
 * e "nao gravou nada" era indistinguivel de "nunca perguntei", porque os dois
 * estados davam `marketing_opt_in === false`. Resultado: o card voltava a
 * perguntar a mesma pessoa em toda visita, que e a definicao de nao respeitar
 * uma recusa.
 *
 * O conserto nao usa coluna nova (decisao D, sem migration): reaproveita
 * `marketing_opt_in_at`, que passa a ser carimbado nas DUAS respostas, e "nunca
 * perguntado" vira `marketing_opt_in_at IS NULL`.
 */

const authState = vi.hoisted(() => ({
  value: {
    profile: null as Record<string, unknown> | null,
    profileStatus: "ready",
    refreshProfile: vi.fn(async () => {}),
  },
}));

vi.mock("@/contexts/AuthContext", () => ({ useAuth: () => authState.value }));

const perfil = vi.hoisted(() => ({ updateMyProfile: vi.fn() }));

vi.mock("@/services/profileService", () => ({
  updateMyProfile: perfil.updateMyProfile,
}));

const nav = vi.hoisted(() => ({ setLocation: vi.fn() }));

vi.mock("wouter", () => ({
  useLocation: () => ["/bem-vindo", nav.setLocation],
  Link: ({ children, href }: { children?: unknown; href?: string }) => (
    <a href={href}>{children as never}</a>
  ),
}));

vi.mock("framer-motion", () => ({
  motion: { div: "div" },
  useReducedMotion: () => true,
}));

vi.mock("@/components/SEO", () => ({ default: () => null }));
vi.mock("@/components/CeuEstrelado", () => ({ default: () => null }));

import BemVindo from "./BemVindo";

const PERFIL_NUNCA_PERGUNTADO = {
  onboarding_completed: false,
  marketing_opt_in: false,
  marketing_opt_in_at: null,
};

function checkbox() {
  return screen.queryByRole("checkbox");
}

function seguir() {
  // Qualquer um dos dois botoes de saida serve: os dois passam por
  // marcarOnboarding.
  fireEvent.click(screen.getAllByRole("button")[0]);
}

beforeEach(() => {
  localStorage.clear();
  authState.value.profile = { ...PERFIL_NUNCA_PERGUNTADO };
  authState.value.profileStatus = "ready";
  perfil.updateMyProfile.mockResolvedValue({});
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('"nunca perguntado" e o carimbo nulo (item 5.2)', () => {
  it("mostra o card quando marketing_opt_in_at e null", () => {
    render(<BemVindo />);
    expect(checkbox()).not.toBeNull();
  });

  it("NAO mostra o card para quem ja recusou (false COM carimbo)", () => {
    // O caso que motivou a mudanca: antes, este perfil era indistinguivel de
    // quem nunca foi perguntado, e o card reaparecia.
    authState.value.profile = {
      onboarding_completed: false,
      marketing_opt_in: false,
      marketing_opt_in_at: "2026-07-20T10:00:00Z",
    };
    render(<BemVindo />);
    expect(checkbox()).toBeNull();
  });

  it("NAO mostra o card para quem ja aceitou", () => {
    authState.value.profile = {
      onboarding_completed: false,
      marketing_opt_in: true,
      marketing_opt_in_at: "2026-07-20T10:00:00Z",
    };
    render(<BemVindo />);
    expect(checkbox()).toBeNull();
  });

  it("NAO mostra o card enquanto o profile nao carregou", () => {
    authState.value.profileStatus = "loading";
    authState.value.profile = null;
    render(<BemVindo />);
    expect(checkbox()).toBeNull();
  });

  it("NAO mostra o card se o profile falhou: sem certeza, nao pergunta", () => {
    authState.value.profileStatus = "error";
    authState.value.profile = null;
    render(<BemVindo />);
    expect(checkbox()).toBeNull();
  });
});

describe("dispensar GRAVA a recusa (item 5.3)", () => {
  it("seguir sem marcar grava marketing_opt_in = false", () => {
    render(<BemVindo />);
    seguir();

    expect(perfil.updateMyProfile).toHaveBeenCalledWith(
      expect.objectContaining({
        onboarding_completed: true,
        marketing_opt_in: false,
      }),
    );
  });

  it("marcar e seguir grava marketing_opt_in = true", () => {
    render(<BemVindo />);
    fireEvent.click(checkbox()!);
    seguir();

    expect(perfil.updateMyProfile).toHaveBeenCalledWith(
      expect.objectContaining({ marketing_opt_in: true }),
    );
  });

  it("o cliente NUNCA manda o carimbo: quem carimba e o servidor", () => {
    render(<BemVindo />);
    seguir();

    const [payload] = perfil.updateMyProfile.mock.calls[0];
    expect(payload).not.toHaveProperty("marketing_opt_in_at");
  });

  it("card nao exibido nao escreve o campo (PATCH parcial nao toca no valor)", () => {
    authState.value.profile = {
      onboarding_completed: false,
      marketing_opt_in: true,
      marketing_opt_in_at: "2026-07-20T10:00:00Z",
    };
    render(<BemVindo />);
    seguir();

    const [payload] = perfil.updateMyProfile.mock.calls[0];
    expect(payload).not.toHaveProperty("marketing_opt_in");
    expect(payload).toMatchObject({ onboarding_completed: true });
  });
});

describe("marketing nunca bloqueia (item 5.5)", () => {
  it("os botoes de saida estao habilitados com o card exibido e desmarcado", () => {
    render(<BemVindo />);
    for (const botao of screen.getAllByRole("button")) {
      expect((botao as HTMLButtonElement).disabled).toBe(false);
    }
  });

  it("o card nao e modal: o conteudo da pagina esta acessivel junto", () => {
    render(<BemVindo />);
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(screen.getAllByRole("button").length).toBeGreaterThan(0);
  });
});
