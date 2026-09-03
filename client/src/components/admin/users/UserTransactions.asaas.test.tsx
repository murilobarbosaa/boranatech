import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

/**
 * A LINHA DO EXTRATO NUMA COBRANCA DO ASAAS.
 *
 * O defeito que estes casos travam, achado no smoke em producao de 03/09/2026:
 * a linha de Pix de `refundable_cents = 1290` nao mostrava NADA. Nem o botao
 * "Reembolsar", nem a frase de estado. A causa era `acao = ehAsaas ? undefined
 * : ...`, sobra do Lote 1, quando `/refunds` respondia 409
 * `refund_provider_not_stripe`. O Lote 2a passou a aceitar Asaas no servidor e
 * o dialogo ja mandava o `provider_transaction_id`, mas ninguem tinha teste
 * desta linha com cobranca do Asaas, entao a trava sobreviveu ao motivo dela.
 *
 * O `acao &&` que envolve o bloco inteiro e o que transforma "sem botao" em
 * "sem nada": e por isso que o caso 3 afirma a FRASE, e nao so a ausencia do
 * botao. Uma correcao que devolvesse o botao e deixasse a frase de fora
 * passaria num teste que so procurasse o botao.
 */

import { UserTransactions } from "./UserTransactions";
import type { TransactionItem, TransactionsPayload } from "./types";

const PIX_BASE = {
  id: "ft-pix",
  provider: "asaas",
  provider_transaction_id: "pay_x",
  type: "charge",
  gross_cents: 1290,
  fee_cents: 199,
  net_cents: 1091,
  currency: "brl",
  occurred_at: "2026-09-02T12:00:00Z",
  stripe_charge_id: null,
  stripe_invoice_id: null,
  plan_code: "pro_monthly",
  refunded_cents: 0,
  disputed_cents: 0,
  disputed: false,
  refund_state: "none",
} as const;

function payload(item: TransactionItem): TransactionsPayload {
  return {
    items: [item],
    total_paid_cents: item.gross_cents,
    truncated: false,
    limit: 50,
  };
}

function montar(item: TransactionItem) {
  const onRefund = vi.fn();
  const onExternalRefund = vi.fn();
  render(
    <UserTransactions
      loading={false}
      error={null}
      payload={payload(item)}
      onRefund={onRefund}
      onExternalRefund={onExternalRefund}
    />,
  );
  return { onRefund, onExternalRefund };
}

afterEach(() => cleanup());

describe("linha do extrato: cobranca do Asaas", () => {
  it("(1) com saldo, oferece Reembolsar e chama onRefund", () => {
    const { onRefund, onExternalRefund } = montar({
      ...PIX_BASE,
      refundable_cents: 1290,
      estorno_pendente_cents: 0,
    });

    const botao = screen.getByRole("button", { name: "Reembolsar" });
    expect(botao).toBeTruthy();

    fireEvent.click(botao);

    // O item INTEIRO vai para o handler, e pelo caminho da API, nao pelo de
    // devolucao declarada.
    expect(onRefund).toHaveBeenCalledTimes(1);
    expect(onRefund.mock.calls[0][0].provider_transaction_id).toBe("pay_x");
    expect(onRefund.mock.calls[0][0].id).toBe("ft-pix");
    expect(onExternalRefund).not.toHaveBeenCalled();
  });

  it("(2) com estorno em voo, diz que aguarda o Asaas e nao oferece botao", () => {
    montar({
      ...PIX_BASE,
      refundable_cents: 0,
      estorno_pendente_cents: 1290,
    });

    expect(screen.getByTestId("estorno-pendente").textContent).toBe(
      "Estorno solicitado. Aguardando confirmação do Asaas.",
    );
    expect(screen.queryByRole("button", { name: "Reembolsar" })).toBeNull();
    // A frase de saldo NAO pode aparecer junto: ela diria o contrario.
    expect(screen.queryByTestId("sem-reembolso")).toBeNull();
  });

  it("(3) com os dois zerados, diz Sem saldo a reembolsar", () => {
    montar({
      ...PIX_BASE,
      refundable_cents: 0,
      estorno_pendente_cents: 0,
    });

    expect(screen.getByTestId("sem-reembolso").textContent).toBe(
      "Sem saldo a reembolsar",
    );
    expect(screen.queryByRole("button", { name: "Reembolsar" })).toBeNull();
    expect(screen.queryByTestId("estorno-pendente")).toBeNull();
  });

  it("(4) CONTROLE: boleto da Stripe continua em Registrar devolucao", () => {
    // Sem este caso, trocar `acao` por `onRefund` fixo passaria nos tres
    // primeiros e quebraria o boleto em silencio.
    const { onRefund, onExternalRefund } = montar({
      ...PIX_BASE,
      provider: "stripe",
      provider_transaction_id: null,
      stripe_charge_id: "py_x",
      refundable_cents: 1000,
    });

    const botao = screen.getByRole("button", { name: "Registrar devolução" });
    fireEvent.click(botao);

    expect(onExternalRefund).toHaveBeenCalledTimes(1);
    expect(onExternalRefund.mock.calls[0][0].stripe_charge_id).toBe("py_x");
    expect(onRefund).not.toHaveBeenCalled();
  });
});
