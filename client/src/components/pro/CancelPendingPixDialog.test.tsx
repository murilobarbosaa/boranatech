import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";

/**
 * O dialog traduz os desfechos do POST /cancel-pending. O que importa travar:
 * so sucesso, "ja pago" e "ja nao pendente" chamam `onResolved`; a falha
 * generica deixa tudo como esta, porque a cobranca continua viva.
 */

const dubles = vi.hoisted(() => {
  class CheckoutError extends Error {
    code: string;
    constructor(code: string) {
      super(code);
      this.code = code;
    }
  }
  return {
    CheckoutError,
    cancelar: vi.fn<() => Promise<void>>(),
    sucesso: vi.fn(),
    erro: vi.fn(),
  };
});

vi.mock("@/services/subscriptionService", () => ({
  CheckoutError: dubles.CheckoutError,
  cancelPendingPixCharge: () => dubles.cancelar(),
}));
vi.mock("@/lib/notify", () => ({
  showActionToast: (o: { message: string }) => dubles.sucesso(o.message),
  showErrorToast: (m: string) => dubles.erro(m),
}));

import CancelPendingPixDialog from "./CancelPendingPixDialog";

function montar() {
  const onClose = vi.fn();
  const onResolved = vi.fn();
  render(
    <CancelPendingPixDialog open onClose={onClose} onResolved={onResolved} />,
  );
  return { onClose, onResolved };
}

function confirmar() {
  fireEvent.click(screen.getByRole("button", { name: "Cancelar cobrança" }));
}

beforeEach(() => {
  dubles.cancelar.mockReset();
  dubles.sucesso.mockReset();
  dubles.erro.mockReset();
});
afterEach(() => cleanup());

describe("CancelPendingPixDialog", () => {
  it("avisa que o QR atual deixa de valer", () => {
    montar();
    expect(screen.getByText(/O código Pix atual deixa de valer/)).toBeTruthy();
  });

  it("sucesso: toast de sucesso e onResolved('canceled')", async () => {
    dubles.cancelar.mockResolvedValue(undefined);
    const { onResolved } = montar();
    confirmar();

    await waitFor(() => expect(onResolved).toHaveBeenCalledWith("canceled"));
    expect(dubles.sucesso).toHaveBeenCalledTimes(1);
    expect(dubles.erro).not.toHaveBeenCalled();
  });

  it("pagamento_ja_recebido: mensagem propria e onResolved('already_paid')", async () => {
    dubles.cancelar.mockRejectedValue(
      new dubles.CheckoutError("pagamento_ja_recebido"),
    );
    const { onResolved } = montar();
    confirmar();

    await waitFor(() =>
      expect(onResolved).toHaveBeenCalledWith("already_paid"),
    );
    expect(dubles.sucesso).toHaveBeenCalledWith(
      expect.stringContaining("já foi pago"),
    );
  });

  it("sem_cobranca_pendente: onResolved('gone'), para o chamador atualizar a tela", async () => {
    dubles.cancelar.mockRejectedValue(
      new dubles.CheckoutError("sem_cobranca_pendente"),
    );
    const { onResolved } = montar();
    confirmar();

    await waitFor(() => expect(onResolved).toHaveBeenCalledWith("gone"));
    // Sem `goneEhSucesso`, a cobranca ter sumido e novidade: o aviso sai.
    expect(dubles.erro).toHaveBeenCalledTimes(1);
  });

  it("com goneEhSucesso (checkout): resolve 'gone' SEM toast de erro", async () => {
    dubles.cancelar.mockRejectedValue(
      new dubles.CheckoutError("sem_cobranca_pendente"),
    );
    const onResolved = vi.fn();
    render(
      <CancelPendingPixDialog
        open
        goneEhSucesso
        onClose={vi.fn()}
        onResolved={onResolved}
      />,
    );
    confirmar();

    await waitFor(() => expect(onResolved).toHaveBeenCalledWith("gone"));
    expect(dubles.erro).not.toHaveBeenCalled();
    expect(dubles.sucesso).not.toHaveBeenCalled();
  });

  it("falha generica: so o toast de erro, sem onResolved, e o dialog continua aberto", async () => {
    dubles.cancelar.mockRejectedValue(
      new dubles.CheckoutError("cancelamento_falhou"),
    );
    const { onResolved, onClose } = montar();
    confirmar();

    await waitFor(() => expect(dubles.erro).toHaveBeenCalledTimes(1));
    expect(onResolved).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "Cancelar cobrança" }),
      ).toBeTruthy(),
    );
  });

  it("erro que nao e CheckoutError (rede): tratado como falha generica", async () => {
    dubles.cancelar.mockRejectedValue(new TypeError("Failed to fetch"));
    const { onResolved } = montar();
    confirmar();

    await waitFor(() => expect(dubles.erro).toHaveBeenCalledTimes(1));
    expect(onResolved).not.toHaveBeenCalled();
  });

  it("Voltar fecha sem chamar o servidor", () => {
    const { onClose } = montar();
    fireEvent.click(screen.getByRole("button", { name: "Voltar" }));

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(dubles.cancelar).not.toHaveBeenCalled();
  });
});
