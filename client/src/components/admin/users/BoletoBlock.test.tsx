import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { BoletoBlock } from "./BoletoBlock";
import type { BoletoEstado } from "./types";

afterEach(cleanup);

const EM_ABERTO: BoletoEstado = {
  estado: "ok",
  payment_status: "unpaid",
  amount_cents: 15540,
  currency: "brl",
  expires_at: "2026-08-01T02:59:00.000Z",
  pago: false,
};

describe("BoletoBlock: boleto a caminho", () => {
  it("mostra valor, vencimento e o status da cobrança", () => {
    render(<BoletoBlock boleto={EM_ABERTO} />);
    const texto = screen.getByText(/Vence em/).parentElement?.textContent ?? "";
    expect(texto).toMatch(/\d{2}\/\d{2}\/\d{4}/);
    expect(screen.getByText(/R\$ 155,40/)).toBeTruthy();
    expect(screen.getByText(/unpaid/)).toBeTruthy();
    // A data EXATA não é asserida de propósito: fmtDate usa o fuso da máquina,
    // e 2026-08-01T02:59Z é 31/07 em Brasília. Travar "01/08" faria o teste
    // depender do fuso de quem roda, e travar "31/07" faria ele afirmar um
    // fuso que o CI não garante. O que importa aqui é que o vencimento do
    // BOLETO aparece formatado, e não o expires_at da sessão.
  });

  it("não é o aviso alto: boleto em aberto é situação normal", () => {
    const { container } = render(<BoletoBlock boleto={EM_ABERTO} />);
    expect(screen.queryByTestId("boleto-pago-sem-acesso")).toBeNull();
    expect(container.textContent).toContain("Boleto aguardando pagamento");
  });
});

describe("BoletoBlock: pago sem acesso liberado", () => {
  const PAGO: BoletoEstado = {
    ...EM_ABERTO,
    payment_status: "paid",
    expires_at: null,
    pago: true,
  };

  it("dispara o aviso ALTO, visualmente distinto do pendente normal", () => {
    render(<BoletoBlock boleto={PAGO} />);
    const aviso = screen.getByTestId("boleto-pago-sem-acesso");
    expect(aviso).toBeTruthy();
    // Distinto no DOM, não só no texto: pendente normal é âmbar, este é rose.
    expect(aviso.className).toContain("rose");
  });

  it("diz o que FAZER, não só o que aconteceu", () => {
    render(<BoletoBlock boleto={PAGO} />);
    const texto =
      screen.getByTestId("boleto-pago-sem-acesso").textContent ?? "";
    expect(texto).toContain("Reenvie");
    expect(texto).toContain("async_payment_succeeded");
  });

  it("o valor recebido aparece: é a quantia que entrou sem contrapartida", () => {
    render(<BoletoBlock boleto={PAGO} />);
    expect(screen.getByText(/R\$ 155,40/)).toBeTruthy();
  });
});

describe("BoletoBlock: estado não verificável", () => {
  const INDISPONIVEL: BoletoEstado = {
    estado: "indisponivel",
    motivo: "rede caiu",
  };

  it("diz que não pôde verificar, sem afirmar que está morto", () => {
    render(<BoletoBlock boleto={INDISPONIVEL} />);
    expect(screen.getByText(/não foi possível verificar/i)).toBeTruthy();
    // Não pode alegar pago nem vencido: ninguém checou.
    expect(screen.queryByTestId("boleto-pago-sem-acesso")).toBeNull();
  });

  it("não dispara o aviso alto por não saber", () => {
    const { container } = render(<BoletoBlock boleto={INDISPONIVEL} />);
    expect(container.textContent).not.toContain("Reenvie");
  });
});

describe("BoletoBlock: ausência", () => {
  it("sem boleto, não renderiza nada", () => {
    const { container } = render(<BoletoBlock boleto={null} />);
    expect(container.textContent).toBe("");
  });

  it("estado desconhecido do servidor não derruba o bloco", () => {
    // Janela de deploy: front novo, backend com outro shape.
    const { container } = render(
      <BoletoBlock
        boleto={{ estado: "coisa_nova" } as unknown as BoletoEstado}
      />,
    );
    expect(container.textContent).toBe("");
  });
});
