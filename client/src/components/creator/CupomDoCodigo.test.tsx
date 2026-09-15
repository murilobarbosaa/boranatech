import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

/**
 * CupomDoCodigo: o cartao do codigo do creator em formato de cupom.
 *
 * Os valores esperados sao LITERAIS escritos a mao, os mesmos do codigo ANA30
 * do teste do CreatorDashboardView: 100 cliques, 3 vendas, R$ 62,79 de receita
 * e R$ 18,84 a receber.
 */

import type { CreatorDashboardCodigo } from "@shared/creatorDashboard";
import { CupomDoCodigo } from "./CupomDoCodigo";

function codigo(parcial: Partial<CreatorDashboardCodigo> = {}): CreatorDashboardCodigo {
  return {
    id: "a1",
    code: "ANA30",
    status: "active",
    discount_percent: 10,
    commission_percent: 30,
    link: "https://boranatech.com.br/planos?ref=ANA30",
    clicks: 100,
    sales: 3,
    revenue_cents: 6279,
    commission_due_cents: 1884,
    commission_paid_cents: 0,
    created_at: "2026-09-01T12:00:00Z",
    ...parcial,
  };
}

afterEach(() => {
  cleanup();
});

describe("CupomDoCodigo", () => {
  it("renderiza o codigo, o link, os dois selos e os quatro numeros", () => {
    render(<CupomDoCodigo codigo={codigo()} visao="creator" />);
    const cupom = screen.getByTestId("creator-codigo-ANA30");
    expect(within(cupom).getByText("ANA30")).toBeTruthy();
    expect(
      within(cupom).getByText("https://boranatech.com.br/planos?ref=ANA30"),
    ).toBeTruthy();
    expect(cupom.textContent).toContain("10% de desconto para quem usar");
    expect(cupom.textContent).toContain("Comissão de 30%");

    const numeros = screen.getByTestId("creator-cupom-numeros-ANA30");
    const pares = Array.from(numeros.querySelectorAll("dt")).map((dt) => [
      dt.textContent,
      dt.nextElementSibling?.textContent,
    ]);
    expect(pares).toEqual([
      ["Cliques", "100"],
      ["Vendas", "3"],
      ["Receita", "R$ 62,79"],
      ["A receber", "R$ 18,84"],
    ]);
  });

  it("sem desconto, o selo diz isso em vez de 0%", () => {
    render(
      <CupomDoCodigo codigo={codigo({ discount_percent: 0 })} visao="creator" />,
    );
    const cupom = screen.getByTestId("creator-codigo-ANA30");
    expect(cupom.textContent).toContain("Sem desconto para quem usar");
    expect(cupom.textContent).not.toContain("0% de desconto");
  });

  it("copiar chama o clipboard com o link exato e mostra Copiado", async () => {
    const writeText = vi.fn(async () => {});
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText },
      configurable: true,
    });
    render(<CupomDoCodigo codigo={codigo()} visao="creator" />);
    fireEvent.click(screen.getByRole("button", { name: "Copiar" }));
    await waitFor(() =>
      expect(writeText).toHaveBeenCalledWith(
        "https://boranatech.com.br/planos?ref=ANA30",
      ),
    );
    await screen.findByRole("button", { name: "Copiado" });
  });

  it("clipboard recusado avisa para copiar a mao", async () => {
    Object.defineProperty(navigator, "clipboard", {
      value: {
        writeText: vi.fn(async () => {
          throw new Error("negado");
        }),
      },
      configurable: true,
    });
    render(<CupomDoCodigo codigo={codigo()} visao="creator" />);
    fireEvent.click(screen.getByRole("button", { name: "Copiar" }));
    await screen.findByText(
      "Não deu para copiar. Selecione o link e copie à mão.",
    );
  });

  it("status pausado mostra o selo; ativo nao", () => {
    render(<CupomDoCodigo codigo={codigo({ status: "paused" })} visao="creator" />);
    expect(screen.getByTestId("creator-codigo-ANA30").textContent).toContain(
      "Pausado",
    );
    cleanup();
    render(<CupomDoCodigo codigo={codigo()} visao="creator" />);
    expect(
      screen.getByTestId("creator-codigo-ANA30").textContent,
    ).not.toContain("Pausado");
  });

  it("a nota interna so aparece na visao admin", () => {
    const comNota = codigo({ notes: "contrato assinado" });
    render(<CupomDoCodigo codigo={comNota} visao="admin" />);
    expect(
      screen.getByTestId("creator-codigo-notas-ANA30").textContent,
    ).toBe("contrato assinado");
    cleanup();
    render(<CupomDoCodigo codigo={comNota} visao="creator" />);
    expect(screen.queryByTestId("creator-codigo-notas-ANA30")).toBeNull();
  });

  it("o corpo tem os dois recortes laterais, e o cupom nao corta o que transborda", () => {
    render(<CupomDoCodigo codigo={codigo()} visao="creator" />);
    const corpo = screen.getByTestId("creator-cupom-corpo-ANA30").className;
    expect(corpo).toContain("before:-left-4");
    expect(corpo).toContain("after:-right-4");
    expect(corpo).toContain("before:bg-[var(--brand-cream)]");
    expect(corpo).toContain("after:bg-[var(--brand-cream)]");
    const cupom = screen.getByTestId("creator-codigo-ANA30").className;
    expect(cupom).toContain("bg-[var(--brand-yellow)]");
    expect(cupom).not.toContain("overflow-hidden");
  });
});
