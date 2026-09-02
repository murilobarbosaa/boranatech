import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * O GATE FISCAL DO CHECKOUT NAO PODE EXISTIR COM A EMISSAO DESLIGADA.
 *
 * Com o kill-switch desligado, pedir CPF ou CNPJ antes do pagamento cobra
 * cadastro por uma nota que nao vai ser emitida, e coloca um formulario entre a
 * pessoa e a compra. O desfecho correto e seguir direto, que e exatamente o que
 * a pagina JA faz quando a leitura do perfil falha: a venda nao e barrada por
 * um problema do lado fiscal.
 *
 * O plano default da pagina e o semestral, entao o caminho exercitado e o do
 * dialog de metodo de pagamento.
 */

const estado = vi.hoisted(() => ({ nfseEnabled: false }));
vi.mock("@/services/nfseStatus", () => ({
  useNfseEnabled: () => estado.nfseEnabled,
}));

const getMyProfile = vi.hoisted(() => vi.fn());
vi.mock("@/services/profileService", () => ({ getMyProfile }));

vi.mock("@/components/fiscal/FiscalDataModal", () => ({
  default: ({ open }: { open: boolean }) =>
    open ? <div>MODAL_FISCAL_ABERTA</div> : null,
}));
vi.mock("@/components/pro/PaymentMethodDialog", () => ({
  default: ({ open }: { open: boolean }) =>
    open ? <div>DIALOG_PAGAMENTO_ABERTO</div> : null,
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

// O Checkout passou a ler `refreshSubscription` quando a main trouxe o modal de
// Pix, e sem este duble o componente nem monta: o teste do gate fiscal quebraria
// por uma dependencia que nao tem nada a ver com o gate. `refreshSubscription`
// nao e exercitado aqui de proposito; quem cobre o fluxo do Pix e o teste dele.
vi.mock("@/contexts/SubscriptionContext", () => ({
  useSubscription: () => ({
    isPro: false,
    isAdmin: false,
    loading: false,
    refreshSubscription: vi.fn(async () => {}),
  }),
}));

import Checkout from "./Checkout";

beforeEach(() => {
  // jsdom nao implementa IntersectionObserver, que o framer-motion usa via
  // whileInView. Stub no-op restrito a este arquivo, no mesmo padrao de
  // `pages/home/sections/LogoLoop.test.tsx`.
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
  // A pagina so mostra os planos com o billing LIGADO (fail-closed proprio,
  // independente do fiscal): sem isto ela renderiza a lista de espera e nao ha
  // botao de assinar para clicar.
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
  estado.nfseEnabled = false;
  getMyProfile.mockReset();
  // Perfil SEM dados fiscais: com a emissao ligada, isto abriria a modal.
  getMyProfile.mockResolvedValue({ full_name: null, cpf: null, cnpj: null });
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

// O CTA so existe depois de o estado de billing resolver (a pagina comeca em
// "loading" e mostra a lista de espera ate saber).
async function clicarAssinar() {
  await waitFor(() => expect(acharAssinar()).toBeTruthy());
  fireEvent.click(acharAssinar()!);
}

describe("gate fiscal do checkout", () => {
  it("com a emissao desligada segue ao pagamento sem abrir a modal fiscal", async () => {
    render(<Checkout />);
    await clicarAssinar();

    await waitFor(() =>
      expect(screen.getByText("DIALOG_PAGAMENTO_ABERTO")).toBeTruthy(),
    );
    expect(screen.queryByText("MODAL_FISCAL_ABERTA")).toBeNull();
    // Nem le o perfil: nao ha decisao fiscal a tomar.
    expect(getMyProfile).not.toHaveBeenCalled();
  });

  it("com a emissao ligada mantem o gate atual e abre a modal fiscal", async () => {
    estado.nfseEnabled = true;
    render(<Checkout />);
    await clicarAssinar();

    await waitFor(() =>
      expect(screen.getByText("MODAL_FISCAL_ABERTA")).toBeTruthy(),
    );
    expect(screen.queryByText("DIALOG_PAGAMENTO_ABERTO")).toBeNull();
    expect(getMyProfile).toHaveBeenCalledTimes(1);
  });
});
