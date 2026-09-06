import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";

import ManualRenewalCard from "./ManualRenewalCard";

afterEach(() => cleanup());

describe("ManualRenewalCard", () => {
  it("vigente: diz a data e os dias, mostra Renovar agora e a nota da ancora", () => {
    const onRenew = vi.fn();
    render(
      <ManualRenewalCard
        estado={{
          kind: "vigente",
          periodEnd: "2026-09-21T12:00:00.000Z",
          days: 7,
        }}
        paymentMethod="pix"
        renewing={false}
        onRenew={onRenew}
      />,
    );

    expect(
      screen.getByText(
        "Renovação manual. Vence em 21 de setembro de 2026 (7 dias).",
      ),
    ).toBeTruthy();
    expect(
      screen.getByText(
        "Pagar antes não perde dias: o novo período começa quando o atual termina.",
      ),
    ).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Renovar agora" }));
    expect(onRenew).toHaveBeenCalledTimes(1);
  });

  it("vigente com 1 dia: singular", () => {
    render(
      <ManualRenewalCard
        estado={{
          kind: "vigente",
          periodEnd: "2026-09-15T12:00:00.000Z",
          days: 1,
        }}
        paymentMethod="boleto"
        renewing={false}
        onRenew={() => {}}
      />,
    );
    expect(
      screen.getByText(
        "Renovação manual. Vence em 15 de setembro de 2026 (1 dia).",
      ),
    ).toBeTruthy();
  });

  it("expired: o cartao de termino, com a data e o mesmo botao", () => {
    const onRenew = vi.fn();
    render(
      <ManualRenewalCard
        estado={{ kind: "expired", periodEnd: "2026-09-13T12:00:00.000Z" }}
        paymentMethod="pix"
        renewing={false}
        onRenew={onRenew}
      />,
    );

    expect(
      screen.getByText(
        "Seu Pro terminou em 13 de setembro de 2026. Renove por Pix para voltar.",
      ),
    ).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Renovar agora" }));
    expect(onRenew).toHaveBeenCalledTimes(1);
  });

  it("renovando: o botao trava e muda o rotulo", () => {
    render(
      <ManualRenewalCard
        estado={{
          kind: "vigente",
          periodEnd: "2026-09-21T12:00:00.000Z",
          days: 7,
        }}
        paymentMethod="pix"
        renewing
        onRenew={() => {}}
      />,
    );
    const botao = screen.getByRole("button", {
      name: "Gerando...",
    }) as HTMLButtonElement;
    expect(botao.disabled).toBe(true);
  });
});
