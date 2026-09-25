import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * CODIGO DE AFILIADO DIGITADO NO CAMPO DE CUPOM (lote 11b).
 *
 * O caso que originou o lote: o creator diz "usa meu cupom FULANO10", a pessoa
 * DIGITA no campo do checkout, e recebia "Cupom invalido ou expirado", porque o
 * campo so conhecia a tabela de cupons de marketing. Agora, quando o cupom nao
 * existe, o campo tenta o codigo como afiliado, pelo MESMO caminho da URL, sem
 * registrar clique.
 *
 * O duble e o `fetch`, como em Checkout.cupom.test.tsx: o que se afirma e a
 * sequencia de requisicoes e o que ficou no `localStorage`, que e o que o
 * `createCheckout` le na hora de assinar.
 */

const estado = vi.hoisted(() => ({
  chamadas: [] as Array<{ url: string; method: string }>,
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
  default: () => null,
}));
vi.mock("@/components/pro/PixCheckoutModal", () => ({
  default: () => null,
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

import { AFFILIATE_STORAGE_KEY } from "@/hooks/useAffiliate";
import { COUPON_STORAGE_KEY } from "@/hooks/useCoupon";
import Checkout from "./Checkout";

const CUPOM = "PROMO10";
const CODIGO_DO_CREATOR = "ANACRIA";

function resposta(ok: boolean, corpo: unknown, status = ok ? 200 : 404) {
  return { ok, status, json: async () => corpo } as unknown as Response;
}

beforeEach(() => {
  window.localStorage.clear();
  window.history.replaceState({}, "", "/checkout");
  estado.chamadas = [];
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
      estado.chamadas.push({ url, method: init?.method ?? "GET" });

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
      if (url.includes("/api/coupons/")) {
        return resposta(false, { error: { code: "not_found" } }, 404);
      }
      if (url.includes("/click")) {
        return resposta(true, { recorded: true });
      }
      if (url.includes(`/api/affiliates/${CODIGO_DO_CREATOR}`)) {
        return resposta(true, {
          valid: true,
          code: CODIGO_DO_CREATOR,
          discount_percent: 15,
        });
      }
      if (url.includes("/api/affiliates/")) {
        // A rota publica responde 200 com valid:false, sem distinguir.
        return resposta(true, { valid: false });
      }
      return resposta(false, {}, 404);
    }) as unknown as typeof fetch,
  );
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

function urls(filtro: string) {
  return estado.chamadas.filter((c) => c.url.includes(filtro));
}

async function digitarNoCampo(codigo: string) {
  await waitFor(() =>
    expect(screen.getByText("Tem um cupom de desconto?")).toBeTruthy(),
  );
  fireEvent.click(screen.getByText("Tem um cupom de desconto?"));
  fireEvent.change(screen.getByLabelText("Código do cupom"), {
    target: { value: codigo },
  });
  fireEvent.click(screen.getByRole("button", { name: "Aplicar" }));
}

describe("campo de cupom do checkout: codigo de creator (lote 11b)", () => {
  it("cupom de marketing valido segue o caminho de hoje, sem consultar afiliados", async () => {
    render(<Checkout />);
    await digitarNoCampo(CUPOM);
    expect((await screen.findByRole("status")).textContent).toContain(CUPOM);
    expect(urls("/api/affiliates/")).toEqual([]);
    expect(
      JSON.parse(window.localStorage.getItem(COUPON_STORAGE_KEY)!).code,
    ).toBe(CUPOM);
    expect(window.localStorage.getItem(AFFILIATE_STORAGE_KEY)).toBeNull();
  });

  it("codigo de creator digitado vira afiliado aplicado, com banner e SEM clique", async () => {
    render(<Checkout />);
    await digitarNoCampo(CODIGO_DO_CREATOR);

    const chip = await screen.findByTestId("checkout-afiliado-aplicado");
    expect(chip.textContent).toContain(CODIGO_DO_CREATOR);
    expect(chip.textContent).toContain("15% de desconto na primeira compra");

    // Primeiro a tabela de cupons (404), depois a rota publica de afiliados.
    expect(urls("/api/coupons/").map((c) => c.method)).toEqual(["GET"]);
    expect(urls(`/api/affiliates/${CODIGO_DO_CREATOR}`)).toHaveLength(1);
    // Nao houve clique em link nenhum: nada de /click.
    expect(urls("/click")).toEqual([]);

    // Gravado pelo MESMO caminho da URL: e o que o createCheckout le.
    const guardado = JSON.parse(
      window.localStorage.getItem(AFFILIATE_STORAGE_KEY)!,
    );
    expect(guardado.code).toBe(CODIGO_DO_CREATOR);
    expect(guardado.discount_percent).toBe(15);
    expect(window.localStorage.getItem(COUPON_STORAGE_KEY)).toBeNull();

    // O banner de afiliado que ja existia acorda (outra instancia do hook).
    await waitFor(() =>
      expect(
        screen.getByText(/Código ANACRIA aplicado, 15% de desconto/),
      ).toBeTruthy(),
    );

    // Remover apaga o afiliado e devolve o campo ao inicio.
    fireEvent.click(
      screen.getByRole("button", {
        name: `Remover código ${CODIGO_DO_CREATOR}`,
      }),
    );
    expect(window.localStorage.getItem(AFFILIATE_STORAGE_KEY)).toBeNull();
    expect(screen.queryByTestId("checkout-afiliado-aplicado")).toBeNull();
    // O campo volta aberto e vazio, pronto para outro codigo.
    expect(await screen.findByLabelText("Código do cupom")).toBeTruthy();
    expect(screen.queryByText(/Código ANACRIA aplicado/)).toBeNull();
  });

  it("codigo que nao existe em nenhuma das duas tabelas continua invalido", async () => {
    render(<Checkout />);
    await digitarNoCampo("NAOEXISTE");
    expect(await screen.findByText("Cupom inválido ou expirado.")).toBeTruthy();
    expect(urls("/api/coupons/NAOEXISTE")).toHaveLength(1);
    expect(urls("/api/affiliates/NAOEXISTE")).toHaveLength(1);
    expect(urls("/click")).toEqual([]);
    expect(window.localStorage.getItem(AFFILIATE_STORAGE_KEY)).toBeNull();
    expect(window.localStorage.getItem(COUPON_STORAGE_KEY)).toBeNull();
  });

  it("?ref= na URL continua igual: valida, grava e registra o clique", async () => {
    window.history.replaceState({}, "", `/checkout?ref=${CODIGO_DO_CREATOR}`);
    render(<Checkout />);
    await waitFor(() =>
      expect(urls(`/api/affiliates/${CODIGO_DO_CREATOR}/click`)).toHaveLength(
        1,
      ),
    );
    expect(urls("/click")[0].method).toBe("POST");
    expect(
      JSON.parse(window.localStorage.getItem(AFFILIATE_STORAGE_KEY)!).code,
    ).toBe(CODIGO_DO_CREATOR);
    await waitFor(() =>
      expect(
        screen.getByText(/Código ANACRIA aplicado, 15% de desconto/),
      ).toBeTruthy(),
    );
    // O campo de cupom continua no inicio: pela URL nao passou por ele.
    expect(screen.queryByTestId("checkout-afiliado-aplicado")).toBeNull();
  });
});
