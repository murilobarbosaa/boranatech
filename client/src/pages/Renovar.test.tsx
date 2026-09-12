import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";

/**
 * A PAGINA /renovar COM PIX.
 *
 * Ate o lote 2b.2 a pagina so sabia redirecionar para a Stripe: o backend ja
 * devolvia o QR no POST e a UI o jogava fora. Os casos aqui travam o caminho
 * Pix inteiro: preview com o meio certo, QR na tela, polling por token ate a
 * confirmacao, e a frase final com a data do novo periodo.
 */
const spies = vi.hoisted(() => ({
  preview: vi.fn(),
  checkout: vi.fn(),
  status: vi.fn(),
}));

vi.mock("@/services/renewalService", async (importOriginal) => {
  const real =
    await importOriginal<typeof import("@/services/renewalService")>();
  return {
    ...real,
    getRenewalPreview: (...a: unknown[]) => spies.preview(...a),
    createRenewalCheckout: (...a: unknown[]) => spies.checkout(...a),
    getRenewalStatus: (...a: unknown[]) => spies.status(...a),
  };
});
vi.mock("@/components/Layout", () => ({
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));
vi.mock("@/components/SEO", () => ({ default: () => null }));
vi.mock("@/contexts/SubscriptionContext", () => ({
  useSubscription: () => ({
    isPro: false,
    isAdmin: false,
    subscription: null,
    loading: false,
    refreshSubscription: vi.fn(async () => {}),
  }),
}));
vi.mock("framer-motion", () => ({ useReducedMotion: () => true }));
vi.mock("@/lib/proConfetti", () => ({ fireProCelebration: () => () => {} }));

import Renovar from "./Renovar";

const PREVIEW_PIX = {
  planId: "pro_monthly",
  planLabel: "Mensal",
  priceLabel: "R$ 29,90",
  periodEnd: "2026-09-21T00:00:00.000Z",
  paymentMethod: "pix",
};
const QR = {
  encodedImage: "aW1n",
  payload: "00020126copiaecola",
  expirationDate: null,
};

beforeEach(() => {
  window.history.replaceState({}, "", "/renovar?t=tok");
  spies.preview.mockReset();
  spies.checkout.mockReset();
  spies.status.mockReset();
  spies.preview.mockResolvedValue(PREVIEW_PIX);
  spies.status.mockResolvedValue({ status: "pending" });
});

afterEach(() => cleanup());

describe("preview", () => {
  it("meio Pix: o botao diz Pagar com Pix, nao Gerar boleto", async () => {
    render(<Renovar />);
    expect(
      await screen.findByRole("button", { name: "Pagar com Pix" }),
    ).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Gerar boleto" })).toBeNull();
  });

  it("meio boleto: o botao continua Gerar boleto", async () => {
    spies.preview.mockResolvedValue({
      ...PREVIEW_PIX,
      paymentMethod: "boleto",
    });
    render(<Renovar />);
    expect(
      await screen.findByRole("button", { name: "Gerar boleto" }),
    ).toBeTruthy();
  });
});

describe("pagamento por Pix", () => {
  // RELOGIO FIXO antes do `dueDate` das fixtures (2026-09-08). Com o relogio
  // real, a partir desse dia o modal abria direto em "expirado" e o QR nao
  // renderizava: o teste virou vermelho sozinho em 2026-09-09, sem mudanca de
  // codigo. So `Date` e falso; os timers ficam reais para o `findBy` e o polling.
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-09-06T12:00:00Z"));
  });
  afterEach(() => vi.useRealTimers());

  it("resposta com pixQrCode renderiza o QR, o copia e cola e a frase de retorno", async () => {
    spies.checkout.mockResolvedValue({
      checkoutUrl: "https://asaas.test/i/1",
      subscriptionId: "pay_novo",
      flow: "native_pix",
      amountCents: 2990,
      dueDate: "2026-09-08",
      pixQrCode: QR,
    });
    render(<Renovar />);
    fireEvent.click(
      await screen.findByRole("button", { name: "Pagar com Pix" }),
    );

    const img = (await screen.findByAltText(
      "QR Code do Pix",
    )) as HTMLImageElement;
    expect(img.src).toBe(`data:image/png;base64,${QR.encodedImage}`);
    expect(screen.getByText(QR.payload)).toBeTruthy();
    expect(
      screen.getByText(
        "Assim que o Pix cair, seu acesso volta em instantes. Você recebe um e-mail de confirmação.",
      ),
    ).toBeTruthy();
    expect(spies.status).toHaveBeenCalledWith("tok");
  });

  it("polling active mostra a data do novo periodo e o link para o perfil", async () => {
    spies.checkout.mockResolvedValue({
      subscriptionId: "pay_novo",
      flow: "native_pix",
      amountCents: 2990,
      dueDate: "2026-09-08",
      pixQrCode: QR,
    });
    spies.status.mockResolvedValue({
      status: "active",
      periodEnd: "2026-10-21T12:00:00.000Z",
    });
    render(<Renovar />);
    fireEvent.click(
      await screen.findByRole("button", { name: "Pagar com Pix" }),
    );

    expect(
      await screen.findByText(
        "Renovado. Seu Pro vai até 21 de outubro de 2026.",
      ),
    ).toBeTruthy();
    const link = screen.getByRole("link", {
      name: "Ir para o perfil",
    }) as HTMLAnchorElement;
    expect(link.getAttribute("href")).toBe("/perfil");
  });

  it("resposta Stripe (sem pixQrCode) continua redirecionando", async () => {
    spies.preview.mockResolvedValue({
      ...PREVIEW_PIX,
      paymentMethod: "boleto",
    });
    spies.checkout.mockResolvedValue({
      checkoutUrl: "https://stripe.test/cs",
      subscriptionId: "cs_1",
    });
    const original = window.location;
    const destino = { href: "" };
    Object.defineProperty(window, "location", {
      value: {
        ...original,
        search: "?t=tok",
        set href(v: string) {
          destino.href = v;
        },
        get href() {
          return destino.href;
        },
      },
      writable: true,
    });
    try {
      render(<Renovar />);
      fireEvent.click(
        await screen.findByRole("button", { name: "Gerar boleto" }),
      );
      await waitFor(() => expect(destino.href).toBe("https://stripe.test/cs"));
    } finally {
      Object.defineProperty(window, "location", {
        value: original,
        writable: true,
      });
    }
  });
});

describe("erros", () => {
  it("erro desconhecido mostra a copy generica COM o codigo visivel", async () => {
    spies.preview.mockRejectedValue(
      new (await import("@/services/renewalService")).RenewalError(
        "plan_unavailable",
      ),
    );
    render(<Renovar />);
    expect(
      await screen.findByText("Não conseguimos processar este link"),
    ).toBeTruthy();
    expect(screen.getByText(/plan_unavailable/)).toBeTruthy();
  });
});
