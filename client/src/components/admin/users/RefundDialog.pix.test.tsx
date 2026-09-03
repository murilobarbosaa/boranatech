import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * O DIALOGO DE REEMBOLSO NO CAMINHO DO PIX.
 *
 * O que estes casos travam nao e aparencia. Sao tres coisas que, erradas,
 * produzem tela plausivel e efeito errado:
 *
 * 1. O ID ENVIADO. A cobranca do Asaas nao tem `stripe_charge_id`; mandar ele
 *    (null) faria a rota responder 404 sobre uma cobranca que esta na tela.
 * 2. A AUSENCIA DO PARCIAL. O webhook so trata `PAYMENT_REFUNDED`; um parcial
 *    sairia do provedor e nunca viraria linha de ledger, entao o dinheiro
 *    voltaria e o painel diria que nao.
 * 3. A MENSAGEM DE SUCESSO. O extrato NAO reflete a devolucao ainda, e um
 *    "reembolso emitido" sem ressalva faria o admin procurar a linha e nao achar.
 */

const spies = vi.hoisted(() => ({
  adminFetch: vi.fn(),
  showActionToast: vi.fn(),
  showErrorToast: vi.fn(),
}));

vi.mock("@/lib/adminApi", () => ({ adminFetch: spies.adminFetch }));
vi.mock("@/lib/notify", () => ({
  showActionToast: spies.showActionToast,
  showErrorToast: spies.showErrorToast,
}));

import { RefundDialog } from "./RefundDialog";
import type { TransactionItem } from "./types";

const PIX = {
  id: "ft-pix",
  provider: "asaas",
  provider_transaction_id: "pay_abc",
  type: "charge",
  gross_cents: 1290,
  fee_cents: 199,
  net_cents: 1091,
  currency: "BRL",
  occurred_at: "2026-09-01T13:11:33.000Z",
  stripe_charge_id: null,
  stripe_invoice_id: null,
  plan_code: "pro_monthly",
  refunded_cents: 0,
  refunded_external_cents: 0,
  disputed_cents: 0,
  disputed: false,
  refund_state: "none",
  refundable_cents: 1290,
  estorno_pendente_cents: 0,
} as unknown as TransactionItem;

const STRIPE = {
  ...PIX,
  id: "ft-stripe",
  provider: "stripe",
  provider_transaction_id: "txn_1",
  stripe_charge_id: "ch_1",
} as unknown as TransactionItem;

function montar(charge: TransactionItem) {
  return render(
    <RefundDialog
      userId="u1"
      charge={charge}
      open
      onOpenChange={() => {}}
      onDone={() => {}}
    />,
  );
}

/**
 * Preenche o motivo, avanca, e redigita o valor no passo 2.
 *
 * A REDIGITACAO CONTINUA no caminho do Pix, de proposito: o estorno nao tem
 * desfazer, e o passo 2 existe para obrigar a LER o numero, nao para escolher.
 * Travar o valor no passo 1 nao diminui isso.
 */
function irAteOFim() {
  fireEvent.change(screen.getByLabelText(/Motivo/i), {
    target: { value: "cliente pediu" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Continuar" }));
  fireEvent.change(screen.getByLabelText("Digite o valor para liberar"), {
    target: { value: "12,90" },
  });
}

beforeEach(() => {
  spies.adminFetch.mockReset();
  spies.showActionToast.mockReset();
  spies.showErrorToast.mockReset();
  spies.adminFetch.mockResolvedValue({
    data: { refunded: true, status: "REFUNDED", statement_synced: false },
  });
});

afterEach(() => cleanup());

describe("RefundDialog no caminho do Pix", () => {
  it("NAO oferece parcial, e diz por que", () => {
    montar(PIX);

    expect(screen.getByTestId("asaas-integral").textContent).toContain(
      "Pix não aceita parcial",
    );
    expect(screen.queryByRole("button", { name: "Parcial" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Total" })).toBeNull();
  });

  it("CONTROLE NEGATIVO: a cobranca da Stripe mantem Total e Parcial", () => {
    montar(STRIPE);

    expect(screen.queryByTestId("asaas-integral")).toBeNull();
    expect(screen.getByRole("button", { name: "Parcial" })).toBeTruthy();
  });

  it("o botao final diz ESTORNAR PIX", () => {
    montar(PIX);
    irAteOFim();
    expect(screen.getByRole("button", { name: "Estornar Pix" })).toBeTruthy();
  });

  it("CONTROLE NEGATIVO: na Stripe o botao continua REEMBOLSAR AGORA", () => {
    montar(STRIPE);
    irAteOFim();
    expect(
      screen.getByRole("button", { name: "Reembolsar agora" }),
    ).toBeTruthy();
  });

  it("envia o id do PROVEDOR, nao o `stripe_charge_id` nulo", async () => {
    // Mandar `stripe_charge_id` (null) faria a rota responder 404 sobre uma
    // cobranca que esta na tela.
    montar(PIX);
    irAteOFim();
    fireEvent.click(screen.getByRole("button", { name: "Estornar Pix" }));

    await waitFor(() => expect(spies.adminFetch).toHaveBeenCalled());
    const [caminho, init] = spies.adminFetch.mock.calls[0] as [
      string,
      { body: string },
    ];
    expect(caminho).toBe("/users/u1/refunds");
    expect(JSON.parse(init.body)).toEqual({
      charge_id: "pay_abc",
      amount_cents: 1290,
      reason: "cliente pediu",
    });
  });

  it("a mensagem de sucesso NAO afirma que o extrato ja mudou", async () => {
    // `statement_synced: false` e o estado NORMAL aqui: a linha negativa do
    // ledger chega pelo webhook. Um "reembolso emitido" seco faria o admin
    // procurar a devolucao no extrato e nao achar.
    montar(PIX);
    irAteOFim();
    fireEvent.click(screen.getByRole("button", { name: "Estornar Pix" }));

    await waitFor(() => expect(spies.showActionToast).toHaveBeenCalled());
    const arg = spies.showActionToast.mock.calls[0][0] as { message: string };
    expect(arg.message).toContain("Estorno enviado ao Asaas");
    expect(arg.message).toContain("webhook");
    // E NAO vira toast de ERRO: `statement_synced: false` aqui nao e falha.
    expect(spies.showErrorToast).not.toHaveBeenCalled();
  });

  it("erro do provedor vira toast de ERRO, e o dialogo nao promete estorno", async () => {
    spies.adminFetch.mockRejectedValue(
      new Error("O Asaas nao confirmou o estorno. Nada foi devolvido."),
    );
    montar(PIX);
    irAteOFim();
    fireEvent.click(screen.getByRole("button", { name: "Estornar Pix" }));

    await waitFor(() => expect(spies.showErrorToast).toHaveBeenCalled());
    expect(spies.showActionToast).not.toHaveBeenCalled();
  });
});
