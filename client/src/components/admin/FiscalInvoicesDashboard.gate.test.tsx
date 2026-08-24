import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * O PAINEL DO ADMIN NAO SOME, ele DECLARA.
 *
 * Decisao deliberada, e o oposto do que as superficies de usuario fazem: quem
 * abre o financeiro precisa distinguir "nao ha nota nenhuma" de "a emissao esta
 * desligada". Um espaco vazio no lugar dos cartoes diria a primeira coisa
 * enquanto a verdade e a segunda, e mandaria o operador procurar defeito no
 * pipeline.
 *
 * A segunda afirmacao do arquivo: desligado nao pergunta nada ao backend.
 */

const estado = vi.hoisted(() => ({ nfseEnabled: false }));

vi.mock("@/services/nfseStatus", () => ({
  useNfseEnabled: () => estado.nfseEnabled,
}));

const adminFetch = vi.hoisted(() => vi.fn());
vi.mock("@/lib/adminApi", () => ({ adminFetch }));

import { FiscalInvoicesDashboard } from "./FiscalInvoicesDashboard";

const SUMMARY = {
  data: {
    porStatus: {
      pending: 0,
      processing: 0,
      issued: 3,
      failed: 1,
      canceled: 0,
      blocked_missing_data: 2,
    },
    precisaRevisao: 1,
    total: 6,
    ultimaReconciliacao: null,
  },
};

beforeEach(() => {
  estado.nfseEnabled = false;
  adminFetch.mockReset();
  adminFetch.mockImplementation(async (caminho: string) =>
    caminho.startsWith("/fiscal-invoices/summary") ? SUMMARY : { data: [] },
  );
});

afterEach(() => {
  cleanup();
});

describe("FiscalInvoicesDashboard", () => {
  it("com a emissao desligada mostra o estado nomeado, sem cartoes nem tabela e sem pedir nada", () => {
    render(<FiscalInvoicesDashboard />);

    expect(screen.getByText(/Emissão de NFS-e desligada/i)).toBeTruthy();
    // Nenhum cartao de contagem e nenhum cabecalho de tabela.
    expect(screen.queryAllByText("Bloqueadas")).toHaveLength(0);
    expect(screen.queryAllByText("Precisam de revisão")).toHaveLength(0);
    expect(screen.queryAllByText("Usuário")).toHaveLength(0);
    expect(adminFetch).not.toHaveBeenCalled();
  });

  it("com a emissao ligada carrega e mostra os cartoes, como hoje", async () => {
    estado.nfseEnabled = true;
    render(<FiscalInvoicesDashboard />);

    // "Bloqueadas" aparece duas vezes com a emissao ligada: o cartao de
    // contagem e o botao de filtro. As duas sao superficie fiscal, e o que o
    // teste afirma e que elas EXISTEM.
    await waitFor(() =>
      expect(screen.getAllByText("Bloqueadas").length).toBeGreaterThan(0),
    );
    expect(screen.getAllByText("Precisam de revisão").length).toBeGreaterThan(
      0,
    );
    expect(screen.getAllByText("Emitidas").length).toBeGreaterThan(0);
    expect(screen.queryByText(/Emissão de NFS-e desligada/i)).toBeNull();
    expect(adminFetch).toHaveBeenCalled();
  });

  it("celula sem dado mostra texto NOMEADO, nunca um traco", async () => {
    // A ausencia de e-mail e de documento e um estado, e estado tem nome. O
    // placeholder anterior era um em-dash, caractere proibido no repositorio, e
    // um simbolo solto tambem nao diz a quem le se o dado falta ou se a celula
    // quebrou.
    estado.nfseEnabled = true;
    adminFetch.mockImplementation(async (caminho: string) =>
      caminho.startsWith("/fiscal-invoices/summary")
        ? SUMMARY
        : {
            data: [
              {
                id: "nota-1",
                userId: "u9",
                email: null,
                status: "failed",
                precisaRevisao: false,
                amountCents: 4990,
                planCode: "pro_monthly",
                numero: null,
                attempts: 1,
                errorCode: null,
                errorMessage: null,
                issuedAt: null,
                createdAt: "2026-08-01T00:00:00.000Z",
                tomadorNome: null,
                tomadorDocumento: null,
              },
            ],
          },
    );

    render(<FiscalInvoicesDashboard />);

    // Duas celulas: a de usuario (sem e-mail e sem nome) e a de documento.
    await waitFor(() =>
      expect(screen.getAllByText("sem dado")).toHaveLength(2),
    );
  });
});
