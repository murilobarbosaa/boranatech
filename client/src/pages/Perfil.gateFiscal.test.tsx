import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * O BLOCO DE DADOS FISCAIS DO PERFIL SOME COM A EMISSAO DESLIGADA.
 *
 * Ele existe para coletar CPF, CNPJ e endereco, e a propria copy do bloco diz
 * para que serve ("dados usados na emissao das notas fiscais"). Com o
 * kill-switch desligado nao ha emissao, entao o bloco pede dado pessoal sem
 * finalidade. Some inteiro, junto com a secao de notas (coberta em
 * `components/fiscal/fiscalGate.test.tsx`).
 */

const estado = vi.hoisted(() => ({ nfseEnabled: false }));
vi.mock("@/services/nfseStatus", () => ({
  useNfseEnabled: () => estado.nfseEnabled,
}));

vi.mock("@/components/Layout", () => ({
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));
vi.mock("@/components/SEO", () => ({ default: () => null }));
vi.mock("@/components/fiscal/FiscalDataModal", () => ({ default: () => null }));
vi.mock("@/components/fiscal/FiscalInvoicesSection", () => ({
  default: () => null,
}));
vi.mock("@/components/profile/AvatarPhotoPanel", () => ({
  default: () => null,
}));
vi.mock("@/components/profile/ConquistasPreview", () => ({
  ConquistasPreview: () => null,
}));
vi.mock("@/components/profile/ProfileBackground", () => ({
  ProfileBackground: () => null,
}));
vi.mock("@/components/pro/ProUpsellModal", () => ({ default: () => null }));
vi.mock("posthog-js", () => ({ default: { capture: vi.fn() } }));

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({
    user: { id: "u1", email: "a@b.c" },
    profile: {
      id: "u1",
      full_name: "Fulano",
      cpf: null,
      cnpj: null,
      avatar_url: null,
    },
    refreshProfile: vi.fn(),
    signOut: vi.fn(),
    loading: false,
  }),
}));
vi.mock("@/contexts/SubscriptionContext", () => ({
  useSubscription: () => ({
    subscription: { status: "active" },
    isPro: true,
    loading: false,
    refreshSubscription: vi.fn(),
  }),
}));
vi.mock("@/hooks/useFavorites", () => ({
  useFavorites: () => ({ favorites: [], loading: false }),
}));
vi.mock("@/services/studyService", () => ({
  getStudySessions: vi.fn(async () => []),
  getStudyStreak: vi.fn(async () => ({ current: 0, longest: 0 })),
  getStudyTotals: vi.fn(async () => ({ minutes: 0, sessions: 0 })),
}));
vi.mock("@/services/careerQuizService", () => ({
  getQuizHistory: vi.fn(async () => []),
}));
vi.mock("@/services/avatarService", () => ({
  getMyAvatars: vi.fn(async () => []),
  unlockAvatar: vi.fn(),
  setMyAvatar: vi.fn(),
}));
vi.mock("@/services/profileService", () => ({
  updateMyProfile: vi.fn(),
}));

import Perfil from "./Perfil";

beforeEach(() => {
  estado.nfseEnabled = false;
  vi.stubGlobal(
    "IntersectionObserver",
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
      takeRecords() {
        return [];
      }
    },
  );
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => ({
      ok: false,
      json: async () => ({}),
    })) as unknown as typeof fetch,
  );
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("bloco de dados fiscais do perfil", () => {
  it("com a emissao desligada nao aparece", async () => {
    render(<Perfil />);

    // A pagina renderizou (ancora fora do dominio fiscal), e mesmo assim o
    // bloco fiscal nao esta la.
    await waitFor(() =>
      expect(screen.queryAllByText("Dados fiscais")).toHaveLength(0),
    );
    expect(screen.queryAllByText("Para emitir sua nota")).toHaveLength(0);
    expect(
      screen.queryAllByText(/Completar dados|Editar dados fiscais/),
    ).toHaveLength(0);
  });

  it("com a emissao ligada aparece, como hoje", async () => {
    estado.nfseEnabled = true;
    render(<Perfil />);

    await waitFor(() =>
      expect(screen.getAllByText("Dados fiscais").length).toBeGreaterThan(0),
    );
    expect(screen.getAllByText("Para emitir sua nota").length).toBeGreaterThan(
      0,
    );
  });
});
