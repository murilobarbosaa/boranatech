import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * GATE DE KILL-SWITCH NAS SUPERFICIES FISCAIS DE USUARIO.
 *
 * Duas superficies moram aqui, e cada uma obedece a UM switch: o banner (que
 * atravessa toda pagina pelo Layout) e COLETA, a secao de notas do perfil e
 * EMISSAO. A secao tem uma exigencia a mais: desligada, nao pode nem CHAMAR o
 * backend, porque era essa chamada, disparada a cada abertura do /perfil por
 * qualquer usuario logado, que ia ao banco perguntar por uma tabela que pode
 * nem existir.
 *
 * Os dois hooks estao dublados: a resolucao do estado (incluindo o fail-closed
 * da janela de deploy) e exercitada em `services/nfseStatus.test.tsx`. Aqui a
 * pergunta e outra: dado o estado, o que a tela monta.
 */

const estado = vi.hoisted(() => ({
  nfseEnabled: false,
  coletaEnabled: false,
}));

vi.mock("@/services/nfseStatus", () => ({
  useNfseEnabled: () => estado.nfseEnabled,
  useFiscalCollectionEnabled: () => estado.coletaEnabled,
}));

const getMyFiscalInvoices = vi.hoisted(() => vi.fn());
vi.mock("@/services/subscriptionService", () => ({
  getMyFiscalInvoices,
}));

const auth = vi.hoisted(() => ({
  user: { id: "u1" } as { id: string } | null,
  profile: {} as Record<string, unknown> | null,
}));
vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({
    user: auth.user,
    profile: auth.profile,
    refreshProfile: vi.fn(),
  }),
}));

const assinatura = vi.hoisted(() => ({
  subscription: { status: "active" } as { status: string } | null,
  loading: false,
}));
vi.mock("@/contexts/SubscriptionContext", () => ({
  useSubscription: () => assinatura,
}));

vi.mock("@/components/fiscal/FiscalDataModal", () => ({
  default: () => null,
}));

import FiscalDataBanner from "./FiscalDataBanner";
import FiscalInvoicesSection from "./FiscalInvoicesSection";

beforeEach(() => {
  estado.nfseEnabled = false;
  estado.coletaEnabled = false;
  auth.user = { id: "u1" };
  // Perfil SEM dados fiscais: e a condicao em que o banner apareceria.
  auth.profile = { full_name: null, cpf: null };
  assinatura.subscription = { status: "active" };
  assinatura.loading = false;
  getMyFiscalInvoices.mockReset();
  getMyFiscalInvoices.mockResolvedValue([]);
});

afterEach(() => {
  cleanup();
});

describe("FiscalDataBanner", () => {
  it("com a coleta desligada nao renderiza, mesmo com assinante ativo sem dado fiscal", () => {
    const { container } = render(<FiscalDataBanner />);
    expect(container.innerHTML).toBe("");
  });

  it("com a emissao ligada (que implica coleta ligada) renderiza o aviso", () => {
    estado.nfseEnabled = true;
    estado.coletaEnabled = true;
    render(<FiscalDataBanner />);
    expect(screen.getByText(/complete seus dados fiscais/i)).toBeTruthy();
  });

  it("coleta ligada e emissao DESLIGADA: assinante ativo sem documento ve o aviso", () => {
    estado.coletaEnabled = true;
    estado.nfseEnabled = false;
    render(<FiscalDataBanner />);
    expect(screen.getByText(/complete seus dados fiscais/i)).toBeTruthy();
  });

  it("coleta ligada e emissao desligada: status free NAO ve o aviso", () => {
    // Cortesia de admin e influencer tem status 'free': nao ha cobranca, nao
    // ha nota, nao ha por que pedir documento.
    estado.coletaEnabled = true;
    estado.nfseEnabled = false;
    assinatura.subscription = { status: "free" };
    const { container } = render(<FiscalDataBanner />);
    expect(container.innerHTML).toBe("");
  });

  it("coleta ligada e emissao desligada: assinante ativo COM documento nao ve o aviso", () => {
    estado.coletaEnabled = true;
    auth.profile = { full_name: "Maria da Silva", cpf: "52998224725" };
    const { container } = render(<FiscalDataBanner />);
    expect(container.innerHTML).toBe("");
  });

  it("so a emissao ligada NAO mostra o aviso: quem manda e o switch da coleta", () => {
    // Estado que o servidor nao produz (emissao implica coleta), usado aqui
    // para provar QUAL hook o banner le.
    estado.nfseEnabled = true;
    estado.coletaEnabled = false;
    const { container } = render(<FiscalDataBanner />);
    expect(container.innerHTML).toBe("");
  });
});

describe("FiscalInvoicesSection", () => {
  it("com a emissao desligada nao renderiza E nao chama o backend", async () => {
    const { container } = render(<FiscalInvoicesSection />);

    expect(container.innerHTML).toBe("");
    // A prova que importa: zero chamadas. Esconder a secao depois de ja ter
    // perguntado deixaria o 500 acontecendo em silencio.
    expect(getMyFiscalInvoices).not.toHaveBeenCalled();
  });

  it("coleta ligada NAO liga a secao de notas: continua ausente e sem chamar o backend", async () => {
    estado.coletaEnabled = true;
    estado.nfseEnabled = false;
    const { container } = render(<FiscalInvoicesSection />);

    expect(container.innerHTML).toBe("");
    expect(getMyFiscalInvoices).not.toHaveBeenCalled();
  });

  it("com a emissao ligada renderiza e busca as notas, como hoje", async () => {
    estado.nfseEnabled = true;
    render(<FiscalInvoicesSection />);

    expect(screen.getByText("Suas notas")).toBeTruthy();
    await waitFor(() => expect(getMyFiscalInvoices).toHaveBeenCalledTimes(1));
  });
});
