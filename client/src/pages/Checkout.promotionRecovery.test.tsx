import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const estado = vi.hoisted(() => ({
  checkoutError: "coupon_unavailable",
  checkoutBodies: [] as Array<Record<string, unknown>>,
  mensagens: [] as string[],
}));

vi.mock("sonner", () => ({
  toast: { error: (message: string) => estado.mensagens.push(message) },
}));
vi.mock("@/lib/supabase", () => ({
  supabase: {
    auth: {
      getSession: async () => ({
        data: { session: { access_token: "token-teste" } },
      }),
    },
  },
}));
vi.mock("@/services/nfseStatus", () => ({ useNfseEnabled: () => false }));
vi.mock("@/services/profileService", () => ({ getMyProfile: vi.fn() }));
vi.mock("@/components/Layout", () => ({
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));
vi.mock("@/components/SEO", () => ({ default: () => null }));
vi.mock("@/components/shared/CeuEstrelado", () => ({ default: () => null }));
vi.mock("@/components/certificates/CompleteProfileModal", () => ({
  default: () => null,
}));
vi.mock("@/components/fiscal/FiscalDataModal", () => ({
  default: () => null,
}));
vi.mock("@/components/pro/PixCheckoutModal", () => ({ default: () => null }));
vi.mock("@/components/pro/PaymentMethodDialog", () => ({
  default: ({
    open,
    onSelect,
  }: {
    open: boolean;
    onSelect: (method: "pix") => void;
  }) =>
    open ? (
      <button type="button" onClick={() => onSelect("pix")}>
        ESCOLHER_PIX
      </button>
    ) : null,
}));
vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({
    user: { id: "u1", email: "pessoa@exemplo.com" },
    profile: { email: "pessoa@exemplo.com" },
    session: { access_token: "token-teste" },
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
vi.mock("posthog-js", () => ({ default: { capture: vi.fn() } }));

import { AFFILIATE_STORAGE_KEY } from "@/hooks/useAffiliate";
import { COUPON_STORAGE_KEY } from "@/hooks/useCoupon";
import Checkout from "./Checkout";

function resposta(ok: boolean, body: unknown) {
  return { ok, json: async () => body } as Response;
}

function armazenarPromocoes(couponPlans: string[] | null = null) {
  const expires = Date.now() + 60_000;
  window.localStorage.setItem(
    AFFILIATE_STORAGE_KEY,
    JSON.stringify({
      code: "AFILIADO20",
      discount_percent: 20,
      expires,
    }),
  );
  window.localStorage.setItem(
    COUPON_STORAGE_KEY,
    JSON.stringify({
      code: "PROMO30",
      discount_percent: 30,
      applicable_plans: couponPlans,
      expires,
    }),
  );
}

async function clicarAssinar() {
  const button = await screen.findByRole("button", {
    name: /Assinar Semestral/i,
  });
  fireEvent.click(button);
  fireEvent.click(await screen.findByRole("button", { name: "ESCOLHER_PIX" }));
}

beforeEach(() => {
  estado.checkoutError = "coupon_unavailable";
  estado.checkoutBodies = [];
  estado.mensagens = [];
  window.localStorage.clear();
  window.sessionStorage.clear();
  window.history.replaceState({}, "", "/planos");
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
      if (url.includes("/api/launch-state")) {
        return resposta(true, { billingEnabled: true });
      }
      if (url.includes("/api/coupons/PROMO30")) {
        const stored = JSON.parse(
          window.localStorage.getItem(COUPON_STORAGE_KEY) || "null",
        ) as { applicable_plans?: string[] | null } | null;
        return resposta(true, {
          code: "PROMO30",
          discount_percent: 30,
          applicable_plans: stored?.applicable_plans ?? null,
        });
      }
      if (url.includes("/api/billing/checkout")) {
        estado.checkoutBodies.push(JSON.parse(String(init?.body)));
        if (estado.checkoutBodies.length === 1) {
          return resposta(false, {
            error: {
              code: estado.checkoutError,
              message: "Promoção indisponível.",
            },
          });
        }
        return resposta(true, {
          data: {
            flow: "native_pix",
            subscriptionId: "pay_1",
            amountCents: 10320,
          },
        });
      }
      return resposta(true, { count: 0 });
    }) as typeof fetch,
  );
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("recuperacao de promocao rejeitada no Pix", () => {
  it("remove apenas o cupom, recalcula com afiliado e espera nova acao", async () => {
    armazenarPromocoes();
    render(<Checkout />);

    expect(
      await screen.findByRole("button", {
        name: /Assinar Semestral.*90,30/i,
      }),
    ).toBeTruthy();
    await clicarAssinar();

    await waitFor(() => expect(estado.mensagens).toHaveLength(1));
    expect(estado.mensagens[0]).toContain("cupom não está mais disponível");
    expect(window.localStorage.getItem(COUPON_STORAGE_KEY)).toBeNull();
    expect(window.localStorage.getItem(AFFILIATE_STORAGE_KEY)).not.toBeNull();
    expect(
      screen.getByRole("button", { name: /Assinar Semestral.*103,20/i }),
    ).toBeTruthy();
    expect(estado.checkoutBodies).toHaveLength(1);

    await clicarAssinar();
    await waitFor(() => expect(estado.checkoutBodies).toHaveLength(2));
    expect(estado.checkoutBodies[1]).toMatchObject({
      affiliateCode: "AFILIADO20",
      planId: "pro_semiannual",
      payment_method: "pix",
    });
    expect(estado.checkoutBodies[1].couponCode).toBeUndefined();
  });

  it("remove apenas o afiliado e preserva o cupom valido fora do plano", async () => {
    estado.checkoutError = "affiliate_unavailable";
    armazenarPromocoes(["pro_annual"]);
    render(<Checkout />);

    expect(
      await screen.findByRole("button", {
        name: /Assinar Semestral.*103,20/i,
      }),
    ).toBeTruthy();
    await clicarAssinar();

    await waitFor(() => expect(estado.mensagens).toHaveLength(1));
    expect(estado.mensagens[0]).toContain(
      "desconto de afiliado não está mais disponível",
    );
    expect(window.localStorage.getItem(AFFILIATE_STORAGE_KEY)).toBeNull();
    expect(window.localStorage.getItem(COUPON_STORAGE_KEY)).not.toBeNull();
    expect(
      screen.getByRole("button", { name: /Assinar Semestral.*129,00/i }),
    ).toBeTruthy();
    expect(estado.checkoutBodies).toHaveLength(1);

    await clicarAssinar();
    await waitFor(() => expect(estado.checkoutBodies).toHaveLength(2));
    expect(estado.checkoutBodies[1]).toMatchObject({
      couponCode: "PROMO30",
      planId: "pro_semiannual",
      payment_method: "pix",
    });
    expect(estado.checkoutBodies[1].affiliateCode).toBeUndefined();
  });
});
