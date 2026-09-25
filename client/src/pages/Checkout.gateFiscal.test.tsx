import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * O GATE FISCAL DO CHECKOUT OBEDECE AO SWITCH DA COLETA, NAO AO DA EMISSAO.
 *
 * A coleta de nome civil e documento antecede a emissao, para o backlog de
 * notas sair com tomador identificado: o estado que importa e coleta LIGADA com
 * emissao DESLIGADA. Com a coleta desligada, pedir CPF ou CNPJ antes do
 * pagamento coloca um formulario entre a pessoa e a compra sem o produto ter
 * decidido coletar; o desfecho correto e seguir direto, que e exatamente o que
 * a pagina JA faz quando a leitura do perfil falha: a venda nao e barrada por
 * um problema do lado fiscal.
 *
 * O plano default da pagina e o semestral, entao o caminho exercitado e o do
 * dialog de metodo de pagamento.
 */

const estado = vi.hoisted(() => ({
  nfseEnabled: false,
  coletaEnabled: false,
}));
vi.mock("@/services/nfseStatus", () => ({
  useNfseEnabled: () => estado.nfseEnabled,
  useFiscalCollectionEnabled: () => estado.coletaEnabled,
}));

const getMyProfile = vi.hoisted(() => vi.fn());
vi.mock("@/services/profileService", () => ({ getMyProfile }));

const createCheckout = vi.hoisted(() => vi.fn());
vi.mock("@/services/subscriptionService", async (importOriginal) => {
  const real =
    await importOriginal<typeof import("@/services/subscriptionService")>();
  return { ...real, createCheckout };
});

vi.mock("@/components/fiscal/FiscalDataModal", () => ({
  default: ({ open, onSaved }: { open: boolean; onSaved: () => void }) =>
    open ? (
      <div>
        MODAL_FISCAL_ABERTA
        <button type="button" onClick={onSaved}>
          SALVAR_MODAL_FISCAL
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
      <div>
        DIALOG_PAGAMENTO_ABERTO
        <button type="button" onClick={() => onSelect("card")}>
          ESCOLHER_CARTAO
        </button>
        <button type="button" onClick={() => onSelect("boleto")}>
          ESCOLHER_BOLETO
        </button>
      </div>
    ) : null,
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
  estado.coletaEnabled = false;
  createCheckout.mockReset();
  // Sem `checkoutUrl`: o ramo de redirecionar para a Stripe nao navega.
  createCheckout.mockResolvedValue({ flow: "redirect" });
  getMyProfile.mockReset();
  // Perfil SEM dados fiscais: com a coleta ligada, isto abre a modal.
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
  it("com a coleta desligada segue ao pagamento sem abrir a modal fiscal", async () => {
    render(<Checkout />);
    await clicarAssinar();

    await waitFor(() =>
      expect(screen.getByText(/DIALOG_PAGAMENTO_ABERTO/)).toBeTruthy(),
    );
    expect(screen.queryByText(/MODAL_FISCAL_ABERTA/)).toBeNull();
    // Nem le o perfil: nao ha decisao fiscal a tomar.
    expect(getMyProfile).not.toHaveBeenCalled();
  });

  it("com a emissao ligada (que implica coleta ligada) abre a modal fiscal", async () => {
    // O servidor entrega a implicacao resolvida: emissao ligada chega ao
    // cliente como `nfse` E `coleta` enabled.
    estado.nfseEnabled = true;
    estado.coletaEnabled = true;
    render(<Checkout />);
    await clicarAssinar();

    await waitFor(() =>
      expect(screen.getByText(/MODAL_FISCAL_ABERTA/)).toBeTruthy(),
    );
    expect(screen.queryByText(/DIALOG_PAGAMENTO_ABERTO/)).toBeNull();
    expect(getMyProfile).toHaveBeenCalledTimes(1);
  });

  // O estado que este lote existe para ligar. O gate vem ANTES da escolha do
  // meio, entao a prova por meio e a ordem inteira: modal fiscal primeiro, sem
  // dialogo e sem checkout; salvar abre o dialogo; o meio escolhido segue ao
  // checkout sem a modal voltar.
  it.each([
    ["cartao", "ESCOLHER_CARTAO", "card"],
    ["boleto", "ESCOLHER_BOLETO", "boleto"],
  ])(
    "coleta ligada e emissao DESLIGADA: perfil sem documento ve a modal fiscal antes do pagamento (%s)",
    async (_rotulo, botao, metodo) => {
      estado.coletaEnabled = true;
      estado.nfseEnabled = false;
      render(<Checkout />);
      await clicarAssinar();

      await waitFor(() =>
        expect(screen.getByText(/MODAL_FISCAL_ABERTA/)).toBeTruthy(),
      );
      expect(screen.queryByText(/DIALOG_PAGAMENTO_ABERTO/)).toBeNull();
      expect(createCheckout).not.toHaveBeenCalled();

      fireEvent.click(screen.getByText("SALVAR_MODAL_FISCAL"));

      await waitFor(() =>
        expect(screen.getByText(/DIALOG_PAGAMENTO_ABERTO/)).toBeTruthy(),
      );
      expect(screen.queryByText(/MODAL_FISCAL_ABERTA/)).toBeNull();

      fireEvent.click(screen.getByText(botao));

      await waitFor(() => expect(createCheckout).toHaveBeenCalledTimes(1));
      expect(createCheckout).toHaveBeenCalledWith("pro_semiannual", metodo);
      expect(screen.queryByText(/MODAL_FISCAL_ABERTA/)).toBeNull();
    },
  );

  it("coleta ligada e emissao desligada: perfil COM documento vai direto ao pagamento", async () => {
    estado.coletaEnabled = true;
    getMyProfile.mockResolvedValue({
      full_name: "Maria da Silva",
      cpf: "52998224725",
      cnpj: null,
    });
    render(<Checkout />);
    await clicarAssinar();

    await waitFor(() =>
      expect(screen.getByText(/DIALOG_PAGAMENTO_ABERTO/)).toBeTruthy(),
    );
    expect(screen.queryByText(/MODAL_FISCAL_ABERTA/)).toBeNull();
    expect(getMyProfile).toHaveBeenCalledTimes(1);
  });

  it("so a emissao ligada NAO abre o gate: quem manda e o switch da coleta", async () => {
    // Estado que o servidor nao produz (emissao implica coleta), usado aqui
    // para provar QUAL hook o gate le.
    estado.nfseEnabled = true;
    estado.coletaEnabled = false;
    render(<Checkout />);
    await clicarAssinar();

    await waitFor(() =>
      expect(screen.getByText(/DIALOG_PAGAMENTO_ABERTO/)).toBeTruthy(),
    );
    expect(screen.queryByText(/MODAL_FISCAL_ABERTA/)).toBeNull();
    expect(getMyProfile).not.toHaveBeenCalled();
  });
});
