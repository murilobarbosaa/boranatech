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
 * O CUPOM SOBREVIVE AO CANCELAMENTO DA COBRANCA PIX PENDENTE.
 *
 * E o caso que originou o lote: a pessoa gerou um Pix sem cupom, recebeu o
 * cupom depois e quer assinar com desconto. A cadeia inteira precisa fechar, e
 * ela passa pelo `localStorage`: `useCoupon` grava ao aplicar, e `createCheckout`
 * le a cada chamada.
 *
 * POR ISSO O `createCheckout` NAO E DUBLADO AQUI. Dublando-o, o `localStorage`
 * sai do teste e o que sobra e a afirmacao de que a pagina chamou a funcao de
 * novo, que e outra coisa. O duble e o `fetch`, uma camada abaixo, e o que se
 * afirma e o CORPO da segunda requisicao ao backend.
 */

const estado = vi.hoisted(() => ({
  chamadas: [] as Array<{ url: string; body: unknown }>,
  checkouts: 0,
}));

vi.mock("@/services/nfseStatus", () => ({
  useNfseEnabled: () => false,
  useFiscalCollectionEnabled: () => false,
}));
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
vi.mock("sonner", () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}));
// Sem sessao do Supabase o cabecalho sai vazio, e o corpo, que e o que este
// teste afirma, e montado igual.
vi.mock("@/lib/supabase", () => ({ supabase: null }));
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

import { COUPON_STORAGE_KEY } from "@/hooks/useCoupon";
import Checkout from "./Checkout";

const CUPOM = "PROMO10";

function resposta(ok: boolean, corpo: unknown, status = ok ? 200 : 409) {
  return { ok, status, json: async () => corpo } as unknown as Response;
}

beforeEach(() => {
  window.localStorage.clear();
  window.history.replaceState({}, "", "/checkout");
  estado.chamadas = [];
  estado.checkouts = 0;
  vi.spyOn(console, "error").mockImplementation(() => {});
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
    vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      const body = init?.body ? JSON.parse(String(init.body)) : null;
      estado.chamadas.push({ url, body });

      if (url.includes("/api/launch-state")) {
        return resposta(true, { billingEnabled: true });
      }
      if (url.includes(`/api/coupons/${CUPOM}`)) {
        return resposta(true, {
          code: CUPOM,
          discount_percent: 10,
          applicable_plans: null,
        });
      }
      if (url.includes("/api/billing/cancel-pending")) {
        return resposta(true, { data: { canceled: true } });
      }
      if (url.includes("/api/billing/checkout")) {
        estado.checkouts += 1;
        // A primeira tentativa bate no guard: ja existe um Pix pendente.
        if (estado.checkouts === 1) {
          return resposta(false, { error: { code: "pix_pending" } });
        }
        return resposta(true, {
          data: {
            flow: "native_pix",
            amountCents: 10449,
            dueDate: "2026-09-20",
          },
        });
      }
      return resposta(false, {}, 404);
    }) as unknown as typeof fetch,
  );
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

function checkoutsEnviados() {
  return estado.chamadas.filter((c) => c.url.includes("/api/billing/checkout"));
}

describe("cupom aplicado depois do primeiro Pix", () => {
  it("aplicar o cupom JA grava no localStorage, sem clicar em assinar", async () => {
    render(<Checkout />);
    await waitFor(() => expect(acharAssinar()).toBeTruthy());

    fireEvent.click(screen.getByText("Tem um cupom de desconto?"));
    fireEvent.change(screen.getByLabelText("Código do cupom"), {
      target: { value: CUPOM },
    });
    fireEvent.click(screen.getByRole("button", { name: "Aplicar" }));

    // O chip do cupom aplicado e o unico `role="status"` da tela.
    expect((await screen.findByRole("status")).textContent).toContain(CUPOM);
    const guardado = window.localStorage.getItem(COUPON_STORAGE_KEY);
    expect(guardado).toBeTruthy();
    expect(JSON.parse(guardado!).code).toBe(CUPOM);
    expect(checkoutsEnviados()).toEqual([]);
  });

  it("o checkout refeito depois do cancelamento carrega o MESMO cupom", async () => {
    render(<Checkout />);
    await waitFor(() => expect(acharAssinar()).toBeTruthy());

    // 1. A pessoa aplica o cupom que recebeu depois do primeiro Pix.
    fireEvent.click(screen.getByText("Tem um cupom de desconto?"));
    fireEvent.change(screen.getByLabelText("Código do cupom"), {
      target: { value: CUPOM },
    });
    fireEvent.click(screen.getByRole("button", { name: "Aplicar" }));
    expect((await screen.findByRole("status")).textContent).toContain(CUPOM);

    // 2. Tenta assinar: o backend recusa com o Pix ainda pendente.
    fireEvent.click(acharAssinar()!);
    fireEvent.click(await screen.findByText("ESCOLHER_PIX"));
    await screen.findByText("Você já tem um Pix aguardando pagamento");

    // 3. Cancela a cobranca anterior e o checkout e refeito sozinho.
    fireEvent.click(
      within(screen.getByRole("dialog")).getByRole("button", {
        name: "Cancelar e gerar novo Pix",
      }),
    );
    await screen.findByText("MODAL_PIX_ABERTO");

    const enviados = checkoutsEnviados();
    expect(enviados).toHaveLength(2);
    // A primeira tentativa ja levava o cupom; a SEGUNDA e a que este lote
    // criou, e e ela que precisava ser provada.
    expect(enviados[1].body).toMatchObject({
      couponCode: CUPOM,
      planId: "pro_semiannual",
      payment_method: "pix",
    });
    // E o cancelamento aconteceu ENTRE as duas.
    const ordem = estado.chamadas
      .map((c) => c.url)
      .filter((u) => u.includes("/api/billing/"))
      .map((u) => (u.includes("cancel-pending") ? "cancel" : "checkout"));
    expect(ordem).toEqual(["checkout", "cancel", "checkout"]);
  });
});
