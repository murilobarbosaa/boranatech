import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";

/**
 * ESTADO INDETERMINADO DO BLOCO DE AUTH NO HEADER (lote Home 02).
 *
 * Enquanto o AuthContext carrega, `user` e null. O Header mostrava "Entrar" nesse
 * intervalo, e quem ja estava logado via "Entrar" antes do proprio avatar.
 *
 * A correcao e ASSIMETRICA de proposito: o espaco neutro so aparece quando ha
 * sessao persistida no navegador. O visitante sem sessao, que e a maioria,
 * continua vendo "Entrar" na hora, sem um flicker novo de placeholder.
 */

const estado = vi.hoisted(() => ({
  auth: {
    loading: true,
    profile: null as unknown,
    profileStatus: "idle",
    signOut: vi.fn(),
    user: null as unknown,
  },
  sessaoPersistida: false,
}));

vi.mock("@/contexts/AuthContext", () => ({ useAuth: () => estado.auth }));
vi.mock("@/contexts/SubscriptionContext", () => ({
  useSubscription: () => ({ isPro: false, loading: false }),
}));
vi.mock("@/hooks/useAdmin", () => ({ useAdmin: () => ({ isAdmin: false }) }));
vi.mock("@/components/Logo", () => ({ default: () => null }));
vi.mock("@/components/ThemeToggle", () => ({ default: () => null }));
vi.mock("@/components/onboarding/BotaoGuiaDaPagina", () => ({
  default: () => null,
}));
vi.mock("@/components/notifications/NotificationBell", () => ({
  default: () => <span data-testid="sino" />,
}));
vi.mock("@/components/UserAvatar", () => ({
  default: () => <span data-testid="avatar" />,
  effectiveOwnAvatar: () => ({ mode: "icon", avatarUrl: null }),
}));
vi.mock("@/lib/persistedSession", () => ({
  temSessaoPersistida: () => estado.sessaoPersistida,
}));

import Header from "./Header";

function linksEntrar() {
  return screen.queryAllByRole("link", { name: "Entrar" });
}

function aguardando() {
  return screen.queryAllByTestId("header-auth-aguardando");
}

beforeEach(() => {
  estado.auth.loading = true;
  estado.auth.user = null;
  estado.auth.profile = null;
  estado.sessaoPersistida = false;
});

afterEach(() => {
  cleanup();
});

describe("bloco de auth do Header", () => {
  it("sem sessao persistida e auth carregando: Entrar na hora, sem placeholder", () => {
    render(<Header />);
    expect(linksEntrar().length).toBeGreaterThan(0);
    expect(aguardando()).toHaveLength(0);
  });

  it("com sessao persistida e auth carregando: espaco neutro, sem Entrar", () => {
    estado.sessaoPersistida = true;
    render(<Header />);
    expect(linksEntrar()).toHaveLength(0);
    expect(aguardando().length).toBeGreaterThan(0);
    for (const el of aguardando()) {
      expect(el.getAttribute("aria-hidden")).toBe("true");
    }
  });

  it("com sessao persistida e usuario resolvido: avatar", () => {
    estado.sessaoPersistida = true;
    estado.auth.loading = false;
    estado.auth.user = { id: "u1", email: "a@b.com", user_metadata: {} };
    render(<Header />);
    expect(screen.getAllByTestId("avatar").length).toBeGreaterThan(0);
    expect(linksEntrar()).toHaveLength(0);
    expect(aguardando()).toHaveLength(0);
  });

  it("com sessao persistida que nao virou usuario: volta ao Entrar", () => {
    estado.sessaoPersistida = true;
    estado.auth.loading = false;
    render(<Header />);
    expect(linksEntrar().length).toBeGreaterThan(0);
    expect(aguardando()).toHaveLength(0);
  });
});
