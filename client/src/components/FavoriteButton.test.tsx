import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";

// ── Mocks (Opcao A: useAuthGate REAL; mockamos as dependencias ao redor) ─────
const h = vi.hoisted(() => ({
  auth: { user: null as { id: string } | null, loading: false },
  toggleFavorite: vi.fn(),
  isFavorite: vi.fn(() => false),
  showActionToast: vi.fn(),
  toastError: vi.fn(),
  setLocation: vi.fn(),
}));

vi.mock("@/contexts/AuthContext", () => ({ useAuth: () => h.auth }));
vi.mock("@/hooks/useFavorites", () => ({
  useFavorites: () => ({
    isFavorite: h.isFavorite,
    toggleFavorite: h.toggleFavorite,
  }),
}));
vi.mock("@/hooks/usePrefersReducedMotion", () => ({
  usePrefersReducedMotion: () => true,
}));
vi.mock("@/lib/notify", () => ({ showActionToast: h.showActionToast }));
vi.mock("sonner", () => ({ toast: { error: h.toastError } }));
vi.mock("wouter", () => ({ useLocation: () => ["/cursos", h.setLocation] }));

import FavoriteButton from "@/components/FavoriteButton";
import { clearPendingGate, peekPendingGate } from "@/lib/authGate";

const ITEM = {
  id: "react",
  type: "tecnologia" as const,
  title: "React",
  subtitle: "Lib",
  url: "/react",
};

function clickFavorite() {
  return act(async () => {
    fireEvent.click(screen.getByRole("button", { name: "Favoritar React" }));
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  clearPendingGate();
  sessionStorage.clear();
  h.auth = { user: null, loading: false };
  h.isFavorite.mockReturnValue(false);
});

afterEach(() => {
  cleanup();
});

describe("FavoriteButton (pos-flip useAuthGate)", () => {
  it("1. deslogado: intercepta o gate, persiste o intent e abre o modal", async () => {
    h.auth = { user: null, loading: false };
    h.toggleFavorite.mockResolvedValue({ ok: false, requiresAuth: true });

    render(<FavoriteButton item={ITEM} />);
    await clickFavorite();

    expect(h.toggleFavorite).toHaveBeenCalledTimes(1);
    expect(h.toggleFavorite).toHaveBeenCalledWith(ITEM);

    const gate = peekPendingGate();
    expect(gate?.destination).toBe("/cursos");
    expect(gate?.intent).toEqual({
      kind: "domain",
      domain: "favorite",
      payload: {
        type: "tecnologia",
        itemKey: "react",
        snapshot: { title: "React", subtitle: "Lib", url: "/react" },
      },
    });

    // Modal aberto: botao "Entrar" do AuthGateModal presente.
    expect(screen.getByRole("button", { name: "Entrar" })).toBeTruthy();
    // Caminho deslogado nao mostra toast de sucesso.
    expect(h.showActionToast).not.toHaveBeenCalled();
  });

  it("2. logado add: toast 'Salvo', sem modal, sem persistir", async () => {
    h.auth = { user: { id: "u1" }, loading: false };
    h.toggleFavorite.mockResolvedValue({ ok: true, isNowFavorited: true });

    render(<FavoriteButton item={ITEM} />);
    await clickFavorite();

    expect(h.showActionToast).toHaveBeenCalledWith(
      expect.objectContaining({ message: "Salvo em Favoritos" }),
    );
    expect(h.toastError).not.toHaveBeenCalled();
    expect(screen.queryByRole("button", { name: "Entrar" })).toBeNull();
    expect(peekPendingGate()).toBeNull();
  });

  it("3. logado remove: toast 'Removido', sem modal, sem persistir", async () => {
    h.auth = { user: { id: "u1" }, loading: false };
    h.toggleFavorite.mockResolvedValue({ ok: true, isNowFavorited: false });

    render(<FavoriteButton item={ITEM} />);
    await clickFavorite();

    expect(h.showActionToast).toHaveBeenCalledWith(
      expect.objectContaining({ message: "Removido dos favoritos." }),
    );
    expect(h.toastError).not.toHaveBeenCalled();
    expect(screen.queryByRole("button", { name: "Entrar" })).toBeNull();
    expect(peekPendingGate()).toBeNull();
  });

  it("4. logado erro: toast.error, sem modal, sem persistir", async () => {
    h.auth = { user: { id: "u1" }, loading: false };
    h.toggleFavorite.mockResolvedValue({ ok: false });

    render(<FavoriteButton item={ITEM} />);
    await clickFavorite();

    expect(h.toastError).toHaveBeenCalledTimes(1);
    expect(h.showActionToast).not.toHaveBeenCalled();
    expect(screen.queryByRole("button", { name: "Entrar" })).toBeNull();
    expect(peekPendingGate()).toBeNull();
  });
});
