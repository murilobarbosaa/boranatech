import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";

/**
 * BOTAO "Creator" NO HEADER (lote 03).
 *
 * So aparece com resposta afirmativa do servidor (`ready` com kind). Em
 * `loading` e em `error` ele NAO aparece: esconder por erro e aceitavel, o que
 * nao pode e o erro virar "nao e creator" dentro do hook, e isso e travado em
 * useCreator.test.tsx. Aqui se trava a outra metade: as duas posicoes (desktop
 * e drawer) sempre concordam, e o botao convive com o do Admin.
 */

type EstadoCreator =
  | { status: "loading" }
  | { status: "ready"; kind: "influencer" | "afiliado" | null }
  | { status: "error" };

const estado = vi.hoisted(() => ({
  auth: {
    loading: false,
    profile: null as unknown,
    profileStatus: "idle",
    signOut: vi.fn(),
    user: { id: "u1", email: "cria@exemplo.com", user_metadata: {} } as unknown,
  },
  isAdmin: false,
  creator: { status: "loading" } as EstadoCreator,
}));

vi.mock("@/contexts/AuthContext", () => ({ useAuth: () => estado.auth }));
vi.mock("@/contexts/SubscriptionContext", () => ({
  useSubscription: () => ({ isPro: false, loading: false }),
}));
vi.mock("@/hooks/useAdmin", () => ({
  useAdmin: () => ({ isAdmin: estado.isAdmin }),
}));
vi.mock("@/hooks/useCreator", () => ({
  useCreator: () => estado.creator,
}));
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
  temSessaoPersistida: () => false,
}));

import Header from "./Header";

function botaoDesktop() {
  return screen.queryByTestId("header-creator");
}

function botaoDrawer() {
  return screen.queryByTestId("header-creator-mobile");
}

function linksAdmin() {
  return screen.queryAllByRole("link", { name: "Admin" });
}

beforeEach(() => {
  estado.isAdmin = false;
  estado.creator = { status: "loading" };
});

afterEach(() => {
  cleanup();
});

describe("botao Creator do Header", () => {
  it("ausente enquanto o status carrega", () => {
    render(<Header />);
    expect(botaoDesktop()).toBeNull();
    expect(botaoDrawer()).toBeNull();
  });

  it("ausente em erro", () => {
    estado.creator = { status: "error" };
    render(<Header />);
    expect(botaoDesktop()).toBeNull();
    expect(botaoDrawer()).toBeNull();
  });

  it("ausente para quem o servidor diz que nao e creator", () => {
    estado.creator = { status: "ready", kind: null };
    render(<Header />);
    expect(botaoDesktop()).toBeNull();
    expect(botaoDrawer()).toBeNull();
  });

  it("presente nas duas posicoes para um influencer, apontando para /creator", () => {
    estado.creator = { status: "ready", kind: "influencer" };
    render(<Header />);
    expect(botaoDesktop()?.getAttribute("href")).toBe("/creator");
    expect(botaoDrawer()?.getAttribute("href")).toBe("/creator");
    expect(botaoDesktop()?.textContent).toBe("Creator");
    expect(botaoDrawer()?.textContent).toBe("Creator");
  });

  it("admin que tambem e creator ve os dois botoes, nas duas posicoes", () => {
    estado.isAdmin = true;
    estado.creator = { status: "ready", kind: "afiliado" };
    render(<Header />);
    expect(linksAdmin()).toHaveLength(2);
    expect(botaoDesktop()).not.toBeNull();
    expect(botaoDrawer()).not.toBeNull();
  });

  it("admin que nao e creator ve so o Admin", () => {
    estado.isAdmin = true;
    estado.creator = { status: "ready", kind: null };
    render(<Header />);
    expect(linksAdmin()).toHaveLength(2);
    expect(botaoDesktop()).toBeNull();
    expect(botaoDrawer()).toBeNull();
  });

  it("desktop e drawer concordam em todos os estados", () => {
    const estados: EstadoCreator[] = [
      { status: "loading" },
      { status: "error" },
      { status: "ready", kind: null },
      { status: "ready", kind: "influencer" },
      { status: "ready", kind: "afiliado" },
    ];
    for (const e of estados) {
      estado.creator = e;
      render(<Header />);
      expect(Boolean(botaoDesktop())).toBe(Boolean(botaoDrawer()));
      cleanup();
    }
  });
});
