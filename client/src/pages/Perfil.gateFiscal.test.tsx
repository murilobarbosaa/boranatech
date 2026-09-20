import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * O BLOCO DE DADOS FISCAIS DO PERFIL OBEDECE AO SWITCH DA COLETA.
 *
 * Ele existe para coletar CPF, CNPJ e endereco, e a coleta antecede a emissao,
 * para o backlog de notas sair com tomador identificado. Com a coleta desligada
 * o bloco some inteiro. A secao de NOTAS e outra superficie, com outro switch
 * (emissao), coberta em `components/fiscal/fiscalGate.test.tsx`.
 */

const estado = vi.hoisted(() => ({
  nfseEnabled: false,
  coletaEnabled: false,
}));
vi.mock("@/services/nfseStatus", () => ({
  useNfseEnabled: () => estado.nfseEnabled,
  useFiscalCollectionEnabled: () => estado.coletaEnabled,
}));

vi.mock("@/components/Layout", () => ({
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));
vi.mock("@/components/SEO", () => ({ default: () => null }));
vi.mock("@/components/fiscal/FiscalDataModal", () => ({ default: () => null }));
// `FiscalInvoicesSection` e a REAL, de proposito. Dublada para `null` ela
// estaria ausente em qualquer cenario, e "a secao de notas continua ausente com
// a coleta ligada" seria uma afirmacao que nao tem como falhar. O que se dubla
// e so a chamada que ela faz.
const getMyFiscalInvoices = vi.hoisted(() => vi.fn());
vi.mock("@/services/subscriptionService", async (importOriginal) => {
  const real =
    await importOriginal<typeof import("@/services/subscriptionService")>();
  return { ...real, getMyFiscalInvoices };
});
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
  estado.coletaEnabled = false;
  getMyFiscalInvoices.mockReset();
  getMyFiscalInvoices.mockResolvedValue([]);
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
  it("com a coleta desligada nao aparece", async () => {
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

  it("com a emissao ligada (que implica coleta ligada) aparece", async () => {
    estado.nfseEnabled = true;
    estado.coletaEnabled = true;
    render(<Perfil />);

    await waitFor(() =>
      expect(screen.getAllByText("Dados fiscais").length).toBeGreaterThan(0),
    );
    expect(screen.getAllByText("Para emitir sua nota").length).toBeGreaterThan(
      0,
    );
    // Controle positivo da afirmacao de ausencia do caso abaixo: com a emissao
    // ligada a secao de notas EXISTE nesta mesma pagina e busca as notas.
    expect(screen.getAllByText("Suas notas").length).toBeGreaterThan(0);
    await waitFor(() => expect(getMyFiscalInvoices).toHaveBeenCalledTimes(1));
  });

  it("coleta ligada e emissao DESLIGADA: o bloco de dados aparece e a secao de notas continua ausente", async () => {
    estado.coletaEnabled = true;
    estado.nfseEnabled = false;
    render(<Perfil />);

    await waitFor(() =>
      expect(screen.getAllByText("Dados fiscais").length).toBeGreaterThan(0),
    );
    expect(screen.getAllByText("Para emitir sua nota").length).toBeGreaterThan(
      0,
    );
    expect(screen.queryAllByText("Suas notas")).toHaveLength(0);
    expect(getMyFiscalInvoices).not.toHaveBeenCalled();
  });
});
