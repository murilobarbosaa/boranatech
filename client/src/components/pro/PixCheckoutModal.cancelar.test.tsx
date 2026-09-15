import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";

/**
 * A ACAO DE CANCELAR DENTRO DO MODAL PIX, e o que o modal faz com cada desfecho.
 *
 * O dialog de confirmacao tem os proprios testes; aqui ele e um duble que so
 * devolve o desfecho escolhido, porque o que se trava e a DECISAO do modal:
 * `already_paid` nao fecha sobre um pagamento (atualiza e deixa o polling
 * confirmar), `canceled` e `gone` devolvem ao chamador. A confirmacao vem por
 * `checkPaid`, e nao pelo contexto, para o `refreshSubscription` do teste so
 * contar a chamada que o desfecho faz.
 */

const spies = vi.hoisted(() => ({ refresh: vi.fn(async () => {}) }));

vi.mock("@/contexts/SubscriptionContext", () => ({
  useSubscription: () => ({
    isPro: false,
    refreshSubscription: spies.refresh,
  }),
}));
vi.mock("framer-motion", () => ({ useReducedMotion: () => true }));
vi.mock("@/lib/proConfetti", () => ({ fireProCelebration: () => () => {} }));
vi.mock("./CancelPendingPixDialog", () => ({
  default: ({
    open,
    onResolved,
  }: {
    open: boolean;
    onResolved: (resultado: string) => void;
  }) =>
    open ? (
      <div>
        <button type="button" onClick={() => onResolved("canceled")}>
          RESOLVER_CANCELED
        </button>
        <button type="button" onClick={() => onResolved("already_paid")}>
          RESOLVER_ALREADY_PAID
        </button>
        <button type="button" onClick={() => onResolved("gone")}>
          RESOLVER_GONE
        </button>
      </div>
    ) : null,
}));

import PixCheckoutModal from "./PixCheckoutModal";

const QR = {
  encodedImage: "aW1n",
  payload: "00020126copiaecola",
  expirationDate: null,
};
const ACAO = "Cancelar e escolher outro plano";

function montar(props: { dueDate?: string; semCancelar?: boolean } = {}) {
  const cbs = {
    onDismiss: vi.fn(),
    onConfirmedContinue: vi.fn(),
    onExpiredRestart: vi.fn(),
    onChargeCanceled: vi.fn(),
  };
  render(
    <PixCheckoutModal
      open
      qr={QR}
      amountCents={2990}
      dueDate={props.dueDate ?? "2026-09-08"}
      checkPaid={async () => ({ paid: false })}
      onDismiss={cbs.onDismiss}
      onConfirmedContinue={cbs.onConfirmedContinue}
      onExpiredRestart={cbs.onExpiredRestart}
      onChargeCanceled={props.semCancelar ? undefined : cbs.onChargeCanceled}
    />,
  );
  return cbs;
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-09-06T12:00:00Z"));
  spies.refresh.mockClear();
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe("PixCheckoutModal: cancelar a cobranca", () => {
  it("sem onChargeCanceled (renovacao, /renovar) a acao nao aparece", () => {
    montar({ semCancelar: true });
    expect(screen.getByText("Pix copia e cola")).toBeTruthy();
    expect(screen.queryByRole("button", { name: ACAO })).toBeNull();
  });

  it("cancelada: devolve ao chamador e fecha a confirmacao", () => {
    const { onChargeCanceled } = montar();
    fireEvent.click(screen.getByRole("button", { name: ACAO }));
    fireEvent.click(screen.getByText("RESOLVER_CANCELED"));

    expect(onChargeCanceled).toHaveBeenCalledTimes(1);
    expect(screen.queryByText("RESOLVER_CANCELED")).toBeNull();
    expect(spies.refresh).not.toHaveBeenCalled();
  });

  it("ja pago: NAO devolve ao chamador; atualiza em silencio e o modal segue aberto", () => {
    const { onChargeCanceled, onDismiss } = montar();
    fireEvent.click(screen.getByRole("button", { name: ACAO }));
    fireEvent.click(screen.getByText("RESOLVER_ALREADY_PAID"));

    expect(onChargeCanceled).not.toHaveBeenCalled();
    expect(onDismiss).not.toHaveBeenCalled();
    expect(spies.refresh).toHaveBeenCalledWith({ silent: true });
    expect(screen.getByText("Pix copia e cola")).toBeTruthy();
  });

  it("ja nao pendente (gone): devolve ao chamador, como a cancelada", () => {
    const { onChargeCanceled } = montar();
    fireEvent.click(screen.getByRole("button", { name: ACAO }));
    fireEvent.click(screen.getByText("RESOLVER_GONE"));

    expect(onChargeCanceled).toHaveBeenCalledTimes(1);
  });

  it("codigo expirado: a acao some, porque nao ha cobranca viva para cancelar", () => {
    montar({ dueDate: "2026-09-05" });
    expect(screen.getByText(/Este código Pix expirou/)).toBeTruthy();
    expect(screen.queryByRole("button", { name: ACAO })).toBeNull();
  });
});
