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

  it("o cupom fica na superficie secondary, sem a camada ambar do ticket e sem classe ambar", () => {
    render(
      <CupomDoCodigo
        codigo={codigo({ status: "paused", notes: "contrato assinado" })}
        visao="admin"
      />,
    );
    const cupom = screen.getByTestId("creator-codigo-ANA30");
    expect(cupom.className.split(" ")).toContain("bg-secondary");
    expect(cupom.className).toContain("border-[var(--bnt-ink)]");
    expect(cupom.className).not.toContain("bg-[var(--brand-yellow)]");
    expect(screen.queryByTestId("creator-cupom-fundo-ANA30")).toBeNull();
    for (const el of [cupom, ...Array.from(cupom.querySelectorAll("*"))]) {
      expect(el.getAttribute("style") ?? "").not.toContain("--bnt-ticket-pro");
      expect(el.getAttribute("class") ?? "").not.toContain("amber");
    }
  });

  it("sem recortes e sem listras: nenhum before:, after: nem repeating-linear-gradient", () => {
    render(
      <CupomDoCodigo
        codigo={codigo({ status: "paused", notes: "contrato assinado" })}
        visao="admin"
      />,
    );
    const cupom = screen.getByTestId("creator-codigo-ANA30");
    for (const el of [cupom, ...Array.from(cupom.querySelectorAll("*"))]) {
      const classes = el.getAttribute("class") ?? "";
      const estilo = el.getAttribute("style") ?? "";
      expect(classes).not.toMatch(/(^|\s)(before|after):/);
      expect(classes).not.toContain("repeating-linear-gradient");
      expect(estilo).not.toContain("repeating-linear-gradient");
    }
    expect(screen.queryByTestId("creator-cupom-corpo-ANA30")).toBeNull();
  });

  it("os dois chips tem a forma neutra, e o pausado a rose", () => {
    render(
      <CupomDoCodigo codigo={codigo({ status: "paused" })} visao="creator" />,
    );
    const neutro =
      "rounded-full border-2 border-slate-900 bg-white px-2.5 py-0.5 text-xs font-black text-slate-900";
    expect(screen.getByText("10% de desconto para quem usar").className).toBe(
      neutro,
    );
    expect(screen.getByText("Comissão de 30%").className).toBe(neutro);
    const pausado = screen.getByTestId("creator-codigo-pausado-ANA30");
    expect(pausado.textContent).toBe("Pausado");
    expect(pausado.className).toContain("border-rose-700");
  });

  it("o codigo e display, nao mono, e os numeros vem depois do divisor tracejado", () => {
    render(<CupomDoCodigo codigo={codigo()} visao="creator" />);
    const cupom = screen.getByTestId("creator-codigo-ANA30");
    const code = within(cupom).getByText("ANA30");
    expect(code.className).toContain("font-display");
    expect(code.className).not.toContain("font-mono");
    // Codigos de producao chegam a 18 caracteres, e o overflow-hidden do
    // poster cortaria o que nao quebra.
    expect(code.className.split(" ")).toContain("break-all");
    const divisor = screen.getByTestId(
      "creator-cupom-numeros-ANA30",
    ).previousElementSibling;
    expect(divisor?.className).toBe(
      "my-6 border-t-2 border-dashed border-violet-200",
    );
  });
});
