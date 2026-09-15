import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * A SAIDA DO 409 `pix_pending` NO CHECKOUT.
 *
 * Quem toma este 409 quer pagar: gerou um Pix, ganhou um cupom ou mudou de
 * plano, e o guard nao deixa gerar outro. Ate este lote a unica saida era
 * "confira seu e-mail". O que se trava aqui: o 409 abre o dialogo de cancelar a
 * cobranca anterior, e a confirmacao refaz o MESMO checkout, depois do
 * cancelamento e nunca antes.
 *
 * O servico e dublado por inteiro. O cupom nao aparece aqui porque nao passa
 * pela pagina: `createCheckout` o le do localStorage a cada chamada.
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
    cancelar: vi.fn(),
    refresh: vi.fn(async () => {}),
    toastErro: vi.fn(),
    toastOk: vi.fn(),
    sequencia: [] as string[],
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
    cancelPendingPixCharge: () => {
      spies.sequencia.push("cancel");
      return spies.cancelar();
    },
  };
});
vi.mock("sonner", () => ({
  toast: { error: spies.toastErro, success: spies.toastOk },
}));

vi.mock("@/services/nfseStatus", () => ({ useNfseEnabled: () => false }));
vi.mock("@/services/profileService", () => ({ getMyProfile: vi.fn() }));
vi.mock("@/components/fiscal/FiscalDataModal", () => ({
  default: () => null,
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
    refreshSubscription: spies.refresh,
  }),
}));

import Checkout from "./Checkout";

const PERGUNTA = "Você já tem um Pix aguardando pagamento";
const PIX_NOVO = {
  checkoutUrl: "https://asaas.test/i/novo",
  flow: "native_pix",
  amountCents: 11610,
  dueDate: "2026-09-20",
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
  spies.checkout.mockReset();
  spies.cancelar.mockReset();
  spies.refresh.mockClear();
  spies.toastErro.mockReset();
  spies.toastOk.mockReset();
  spies.sequencia = [];
  spies.checkout
    .mockRejectedValueOnce(new spies.CheckoutError("pix_pending"))
    .mockResolvedValue(PIX_NOVO);
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

function acharAssinar(): HTMLElement | undefined {
  return screen
    .getAllByRole("button")
    .find((b) => /assinar/i.test(b.textContent ?? ""));
}

/** Plano default (semestral), Pix no dialog de meio, e o 409 do servidor. */
async function chegarNoPixPendente() {
  render(<Checkout />);
  await waitFor(() => expect(acharAssinar()).toBeTruthy());
  fireEvent.click(acharAssinar()!);
  fireEvent.click(await screen.findByText("ESCOLHER_PIX"));
  await screen.findByText(PERGUNTA);
}

function noDialogo() {
  return within(screen.getByRole("dialog"));
}

describe("checkout com Pix ja pendente", () => {
  it("o 409 abre o dialogo de cancelar e continuar, sem mandar conferir o e-mail", async () => {
    await chegarNoPixPendente();

    expect(
      noDialogo().getByRole("button", { name: "Cancelar e gerar novo Pix" }),
    ).toBeTruthy();
    expect(spies.toastErro).not.toHaveBeenCalled();
    expect(spies.cancelar).not.toHaveBeenCalled();
  });

  it("confirmar cancela e SO DEPOIS refaz o mesmo checkout, que abre o Pix novo", async () => {
    spies.cancelar.mockResolvedValue(undefined);
    await chegarNoPixPendente();

    fireEvent.click(
      noDialogo().getByRole("button", { name: "Cancelar e gerar novo Pix" }),
    );

    await screen.findByText("MODAL_PIX_ABERTO");
    expect(spies.sequencia).toEqual([
      "checkout:pro_semiannual:pix",
      "cancel",
      "checkout:pro_semiannual:pix",
    ]);
    expect(screen.queryByText(PERGUNTA)).toBeNull();
  });

  it("cobranca que ja nao estava pendente (gone): refaz o checkout do mesmo jeito", async () => {
    spies.cancelar.mockRejectedValue(
      new spies.CheckoutError("sem_cobranca_pendente"),
    );
    await chegarNoPixPendente();

    fireEvent.click(
      noDialogo().getByRole("button", { name: "Cancelar e gerar novo Pix" }),
    );

    await screen.findByText("MODAL_PIX_ABERTO");
    expect(spies.sequencia).toEqual([
      "checkout:pro_semiannual:pix",
      "cancel",
      "checkout:pro_semiannual:pix",
    ]);
    // `gone` aqui e SUCESSO: a cobranca sumir era o objetivo, e o Pix novo
    // aparece em seguida. Um toast de erro contradiria a propria tela.
    expect(spies.toastErro).not.toHaveBeenCalled();
  });

  it("ja pago: NAO refaz o checkout, atualiza a assinatura e leva ao perfil", async () => {
    spies.cancelar.mockRejectedValue(
      new spies.CheckoutError("pagamento_ja_recebido"),
    );
    await chegarNoPixPendente();

    fireEvent.click(
      noDialogo().getByRole("button", { name: "Cancelar e gerar novo Pix" }),
    );

    await waitFor(() => expect(window.location.pathname).toBe("/perfil"));
    expect(spies.refresh).toHaveBeenCalled();
    expect(spies.sequencia).toEqual(["checkout:pro_semiannual:pix", "cancel"]);
  });

  it("falha ao cancelar: NAO refaz o checkout e o dialogo continua aberto", async () => {
    spies.cancelar.mockRejectedValue(
      new spies.CheckoutError("cancelamento_falhou"),
    );
    await chegarNoPixPendente();

    fireEvent.click(
      noDialogo().getByRole("button", { name: "Cancelar e gerar novo Pix" }),
    );

    await waitFor(() => expect(spies.toastErro).toHaveBeenCalledTimes(1));
    expect(spies.sequencia).toEqual(["checkout:pro_semiannual:pix", "cancel"]);
    await waitFor(() =>
      expect(
        noDialogo().getByRole("button", { name: "Cancelar e gerar novo Pix" }),
      ).toBeTruthy(),
    );
  });

  it("Voltar fecha sem cancelar e sem refazer nada", async () => {
    await chegarNoPixPendente();

    fireEvent.click(noDialogo().getByRole("button", { name: "Voltar" }));

    await waitFor(() => expect(screen.queryByText(PERGUNTA)).toBeNull());
    expect(spies.sequencia).toEqual(["checkout:pro_semiannual:pix"]);
  });

  it("o 409 de novo logo depois de cancelar vira aviso, e o dialogo NAO reabre em laco", async () => {
    spies.checkout
      .mockReset()
      .mockRejectedValue(new spies.CheckoutError("pix_pending"));
    spies.cancelar.mockResolvedValue(undefined);
    await chegarNoPixPendente();

    fireEvent.click(
      noDialogo().getByRole("button", { name: "Cancelar e gerar novo Pix" }),
    );

    await waitFor(() =>
      expect(spies.toastErro).toHaveBeenCalledWith(
        expect.stringContaining("Ainda não foi possível liberar um novo Pix"),
      ),
    );
    expect(spies.sequencia).toEqual([
      "checkout:pro_semiannual:pix",
      "cancel",
      "checkout:pro_semiannual:pix",
    ]);
    expect(screen.queryByText(PERGUNTA)).toBeNull();
  });
});
