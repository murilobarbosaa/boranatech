import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * A RENOVACAO BARRADA POR UMA COBRANCA PIX QUE FICOU PARA TRAS.
 *
 * Quem ja e Pro nao ve o bloco de cobranca pendente do Perfil, entao ate este
 * lote nao existia botao de cancelar em lugar nenhum: o 409 virava um aviso e
 * a pessoa ficava sem renovar. O que se trava aqui e a saida: o aviso vira
 * dialogo, a confirmacao cancela e SO DEPOIS refaz a renovacao, e o pagamento
 * ja recebido nao refaz nada.
 *
 * O 409 so acontece com a cobranca ja NAO pendente no Asaas; com ela viva, a
 * rota devolve o mesmo QR (`pixPendenteReaproveitavel`), sem erro.
 */

const spies = vi.hoisted(() => {
  class CheckoutError extends Error {
    code: string;
    constructor(code: string) {
      super(code);
      this.code = code;
    }
  }
  return {
    CheckoutError,
    // REFERENCIAS ESTAVEIS. Dois efeitos do Perfil tem `user` na lista de
    // dependencias; devolvendo um objeto novo a cada render, o primeiro
    // `setState` (o clique em renovar) faz efeito e render se alimentarem, e a
    // suite trava sem nem falhar. O provider real entrega a mesma referencia.
    usuario: { id: "u1", email: "a@b.c" },
    perfil: {
      id: "u1",
      full_name: "Fulano",
      cpf: null,
      cnpj: null,
      avatar_url: null,
    },
    assinatura: {
      status: "active",
      renewal_type: "manual",
      payment_method: "pix",
      current_period_end: "2099-01-01T12:00:00.000Z",
      created_at: "2026-01-01T12:00:00.000Z",
      plans: { code: "pro_monthly", name: "Pro Mensal" },
    },
    refreshProfile: vi.fn(),
    signOut: vi.fn(),
    renovar: vi.fn(),
    cancelar: vi.fn(),
    refresh: vi.fn(async () => {}),
    erro: vi.fn(),
    sucesso: vi.fn(),
    sequencia: [] as string[],
  };
});

vi.mock("@/services/subscriptionService", async (importOriginal) => {
  const real =
    await importOriginal<typeof import("@/services/subscriptionService")>();
  return {
    ...real,
    CheckoutError: spies.CheckoutError,
    renewWithSession: () => {
      spies.sequencia.push("renew");
      return spies.renovar();
    },
    cancelPendingPixCharge: () => {
      spies.sequencia.push("cancel");
      return spies.cancelar();
    },
    getRenewalStatusWithSession: vi.fn(async () => ({ status: "pending" })),
  };
});
vi.mock("@/lib/supabase", () => ({ supabase: null }));
vi.mock("@/lib/notify", () => ({
  showErrorToast: (m: string) => spies.erro(m),
  showActionToast: (o: { message: string }) => spies.sucesso(o.message),
}));
vi.mock("@/components/pro/PixCheckoutModal", () => ({
  default: ({ open }: { open: boolean }) =>
    open ? <div>MODAL_PIX_ABERTO</div> : null,
}));

vi.mock("@/services/nfseStatus", () => ({ useNfseEnabled: () => false }));
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

const AUTH = {
  user: spies.usuario,
  profile: spies.perfil,
  refreshProfile: spies.refreshProfile,
  signOut: spies.signOut,
  loading: false,
};
// Manual, ativa e vigente: e o estado que mostra "Renovar agora".
const SUB = {
  subscription: spies.assinatura,
  isPro: true,
  isAdmin: false,
  loading: false,
  refreshSubscription: spies.refresh,
};
vi.mock("@/contexts/AuthContext", () => ({ useAuth: () => AUTH }));
vi.mock("@/contexts/SubscriptionContext", () => ({
  useSubscription: () => SUB,
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
vi.mock("@/services/profileService", () => ({ updateMyProfile: vi.fn() }));

import Perfil from "./Perfil";

const PERGUNTA = "Cancelar a cobrança da renovação?";
const CONFIRMAR = "Cancelar e renovar de novo";
const RENOVACAO_NOVA = {
  flow: "native_pix" as const,
  amountCents: 2990,
  dueDate: "2099-01-03",
  previousPeriodEnd: "2099-01-01T12:00:00.000Z",
  pixQrCode: {
    encodedImage: "aW1n",
    payload: "00020126pix",
    expirationDate: null,
  },
};

beforeEach(() => {
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
  spies.renovar.mockReset();
  spies.cancelar.mockReset();
  spies.refresh.mockClear();
  spies.erro.mockReset();
  spies.sucesso.mockReset();
  spies.sequencia = [];
  spies.renovar
    .mockRejectedValueOnce(new spies.CheckoutError("pix_pending"))
    .mockResolvedValue(RENOVACAO_NOVA);
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

async function clicarRenovar() {
  render(<Perfil />);
  const botao = await screen.findByRole("button", { name: "Renovar agora" });
  fireEvent.click(botao);
}

describe("renovacao com Pix pendente", () => {
  it("o 409 abre o dialogo em vez do aviso sem saida", async () => {
    await clicarRenovar();

    await screen.findByText(PERGUNTA);
    expect(spies.erro).not.toHaveBeenCalled();
    expect(spies.cancelar).not.toHaveBeenCalled();
  });

  it("confirmar cancela e SO DEPOIS refaz a renovacao", async () => {
    spies.cancelar.mockResolvedValue(undefined);
    await clicarRenovar();
    await screen.findByText(PERGUNTA);

    fireEvent.click(screen.getByRole("button", { name: CONFIRMAR }));

    await screen.findByText("MODAL_PIX_ABERTO");
    expect(spies.sequencia).toEqual(["renew", "cancel", "renew"]);
  });

  it("ja pago: NAO refaz a renovacao, so atualiza a assinatura", async () => {
    spies.cancelar.mockRejectedValue(
      new spies.CheckoutError("pagamento_ja_recebido"),
    );
    await clicarRenovar();
    await screen.findByText(PERGUNTA);

    fireEvent.click(screen.getByRole("button", { name: CONFIRMAR }));

    await waitFor(() => expect(spies.refresh).toHaveBeenCalled());
    expect(spies.sequencia).toEqual(["renew", "cancel"]);
    expect(screen.queryByText("MODAL_PIX_ABERTO")).toBeNull();
  });

  it("o 409 de novo logo depois de cancelar vira aviso, sem reabrir o dialogo", async () => {
    spies.renovar
      .mockReset()
      .mockRejectedValue(new spies.CheckoutError("pix_pending"));
    spies.cancelar.mockResolvedValue(undefined);
    await clicarRenovar();
    await screen.findByText(PERGUNTA);

    fireEvent.click(screen.getByRole("button", { name: CONFIRMAR }));

    await waitFor(() =>
      expect(spies.erro).toHaveBeenCalledWith(
        expect.stringContaining(
          "Ainda não foi possível liberar uma nova renovação",
        ),
      ),
    );
    expect(spies.sequencia).toEqual(["renew", "cancel", "renew"]);
    expect(screen.queryByText(PERGUNTA)).toBeNull();
  });
});
