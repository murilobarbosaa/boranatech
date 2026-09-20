import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * O PASSO DE IDENTIDADE DO PIX PEDE O NOME CIVIL JUNTO COM O CPF.
 *
 * O 422 `cpf_obrigatorio` continua sendo a UNICA coisa que abre o passo: o
 * cliente nao checa CPF. O que mudou e o que o passo pede. Quem chega aqui
 * passou pelo gate fiscal sem nome civil (pessoa juridica, ou leitura de perfil
 * que falhou no gate), e pedir so o CPF deixaria um pagante sem o nome que a
 * nota precisa.
 *
 * O perfil dos cenarios e de PESSOA JURIDICA de proposito: e o caso real em que
 * o gate fiscal deixa passar (razao social e CNPJ bastam) e o Pix ainda recusa
 * por falta de CPF.
 *
 * `CompleteProfileModal` esta dublada para declarar o que recebeu em `missing`:
 * a coleta em si (mascara, validacao, PATCH) e dela e nao muda aqui.
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
    checkout: vi.fn(),
    getMyProfile: vi.fn(),
    sequencia: [] as string[],
    coletaEnabled: true,
  };
});

vi.mock("@/services/subscriptionService", async (importOriginal) => {
  const real =
    await importOriginal<typeof import("@/services/subscriptionService")>();
  return {
    ...real,
    CheckoutError: spies.CheckoutError,
    createCheckout: (plano: string, metodo: string) => {
      spies.sequencia.push(`checkout:${plano}:${metodo}`);
      return spies.checkout(plano, metodo);
    },
  };
});
vi.mock("sonner", () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}));

vi.mock("@/services/nfseStatus", () => ({
  useNfseEnabled: () => false,
  useFiscalCollectionEnabled: () => spies.coletaEnabled,
}));
vi.mock("@/services/profileService", () => ({
  getMyProfile: spies.getMyProfile,
}));
vi.mock("@/components/fiscal/FiscalDataModal", () => ({
  default: ({ open }: { open: boolean }) =>
    open ? <div>MODAL_FISCAL_ABERTA</div> : null,
}));
vi.mock("@/components/certificates/CompleteProfileModal", () => ({
  default: ({
    open,
    missing,
    onSaved,
  }: {
    open: boolean;
    missing: string[];
    onSaved: () => void;
  }) =>
    open ? (
      <div>
        <span>{`PASSO_PIX_PEDE:${missing.join(",")}`}</span>
        <button type="button" onClick={onSaved}>
          SALVAR_PASSO_PIX
        </button>
      </div>
    ) : null,
}));
vi.mock("@/components/pro/PaymentMethodDialog", () => ({
  default: ({
    open,
    onSelect,
  }: {
    open: boolean;
    onSelect: (metodo: string) => void;
  }) =>
    open ? (
      <button type="button" onClick={() => onSelect("pix")}>
        ESCOLHER_PIX
      </button>
    ) : null,
}));
vi.mock("@/components/pro/PixCheckoutModal", () => ({
  default: ({ open }: { open: boolean }) =>
    open ? <div>MODAL_PIX_ABERTO</div> : null,
}));
vi.mock("@/components/Layout", () => ({
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));
vi.mock("@/components/SEO", () => ({ default: () => null }));
vi.mock("@/components/shared/CeuEstrelado", () => ({ default: () => null }));
vi.mock("posthog-js", () => ({ default: { capture: vi.fn() } }));
vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({
    user: { id: "u1", email: "a@b.c" },
    session: { access_token: "t" },
    loading: false,
  }),
}));
vi.mock("@/contexts/SubscriptionContext", () => ({
  useSubscription: () => ({
    isPro: false,
    isAdmin: false,
    loading: false,
    refreshSubscription: vi.fn(async () => {}),
  }),
}));

import Checkout from "./Checkout";

// Pessoa juridica com cadastro fiscal completo: passa no gate sem nome civil.
const PJ_SEM_NOME_CIVIL = {
  fiscal_documento_preferencia: "cnpj",
  cnpj: "11222333000181",
  razao_social: "Empresa Exemplo LTDA",
  full_name: null,
  cpf: null,
};
const PJ_COM_NOME_CIVIL = {
  ...PJ_SEM_NOME_CIVIL,
  full_name: "Maria da Silva",
};

const PIX_NOVO = {
  checkoutUrl: "https://asaas.test/i/novo",
  flow: "native_pix",
  amountCents: 11610,
  dueDate: "2026-09-27",
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
    vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes("/api/launch-state")) {
        return { ok: true, json: async () => ({ billingEnabled: true }) };
      }
      return { ok: false, json: async () => ({}) };
    }) as unknown as typeof fetch,
  );
  window.history.replaceState({}, "", "/checkout");
  // O Checkout loga todo createCheckout recusado; aqui a recusa e o cenario.
  vi.spyOn(console, "error").mockImplementation(() => {});
  spies.coletaEnabled = true;
  spies.sequencia = [];
  spies.getMyProfile.mockReset();
  spies.checkout.mockReset();
  spies.checkout
    .mockRejectedValueOnce(new spies.CheckoutError("cpf_obrigatorio"))
    .mockResolvedValue(PIX_NOVO);
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

function acharAssinar(): HTMLElement | undefined {
  return screen
    .getAllByRole("button")
    .find((b) => /assinar/i.test(b.textContent ?? ""));
}

/** Plano default (semestral), Pix no dialog de meio, e o 422 do servidor. */
async function chegarNo422DoPix() {
  render(<Checkout />);
  await waitFor(() => expect(acharAssinar()).toBeTruthy());
  fireEvent.click(acharAssinar()!);
  fireEvent.click(await screen.findByText("ESCOLHER_PIX"));
  await screen.findByText(/^PASSO_PIX_PEDE:/);
}

describe("passo de identidade do Pix (422 cpf_obrigatorio)", () => {
  it("perfil sem nome civil: pede nome E CPF", async () => {
    spies.getMyProfile.mockResolvedValue(PJ_SEM_NOME_CIVIL);

    await chegarNo422DoPix();

    expect(screen.getByText("PASSO_PIX_PEDE:full_name,cpf")).toBeTruthy();
    expect(screen.queryByText("MODAL_FISCAL_ABERTA")).toBeNull();
  });

  it("perfil com nome civil: pede so o CPF", async () => {
    spies.getMyProfile.mockResolvedValue(PJ_COM_NOME_CIVIL);

    await chegarNo422DoPix();

    expect(screen.getByText("PASSO_PIX_PEDE:cpf")).toBeTruthy();
  });

  it("salvar retoma o MESMO checkout de Pix, sem escolher o meio de novo", async () => {
    spies.getMyProfile.mockResolvedValue(PJ_SEM_NOME_CIVIL);
    await chegarNo422DoPix();

    fireEvent.click(screen.getByText("SALVAR_PASSO_PIX"));

    await screen.findByText("MODAL_PIX_ABERTO");
    expect(spies.sequencia).toEqual([
      "checkout:pro_semiannual:pix",
      "checkout:pro_semiannual:pix",
    ]);
    expect(screen.queryByText(/^PASSO_PIX_PEDE:/)).toBeNull();
  });

  it("leitura do perfil falha no 422: pede so o CPF, que e o que o servidor exigiu", async () => {
    // Primeira leitura (gate fiscal) responde; a segunda (handler do 422) cai.
    spies.getMyProfile
      .mockResolvedValueOnce(PJ_SEM_NOME_CIVIL)
      .mockRejectedValueOnce(new Error("rede caiu"));

    await chegarNo422DoPix();

    expect(screen.getByText("PASSO_PIX_PEDE:cpf")).toBeTruthy();
  });

  it("coleta desligada: o passo continua existindo e pede so o CPF, sem ler o perfil", async () => {
    // O CPF do Pix e exigencia do provedor e nao depende de switch nenhum. O
    // nome civil e coleta fiscal, e o kill-switch da coleta tem que desliga-la
    // em TODOS os pontos, inclusive neste.
    spies.coletaEnabled = false;
    spies.getMyProfile.mockResolvedValue(PJ_SEM_NOME_CIVIL);

    await chegarNo422DoPix();

    expect(screen.getByText("PASSO_PIX_PEDE:cpf")).toBeTruthy();
    expect(spies.getMyProfile).not.toHaveBeenCalled();
  });
});
