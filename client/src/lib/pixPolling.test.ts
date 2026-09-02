import { describe, expect, it } from "vitest";

import {
  nextPixPollStep,
  PIX_POLL_INTERVAL_MS,
  PIX_POLL_TIMEOUT_MS,
} from "./pixPolling";

/**
 * REGRA DE PARADA do polling que confirma o Pix.
 *
 * Ela foi extraida do componente porque as duas maneiras de errar aqui sao
 * INVISIVEIS na tela: um polling que nunca para vira requisicao infinita numa
 * aba esquecida, e um que para cedo demais deixa a tela dizendo que o pagamento
 * nao chegou depois de ele ter chegado. Nenhuma das duas produz sintoma visual,
 * entao nenhuma seria pega por inspecao.
 */

describe("quando parar", () => {
  it("confirmado: para e sinaliza sucesso", () => {
    expect(nextPixPollStep({ isPro: true, elapsedMs: 0 })).toEqual({
      action: "confirmed",
    });
  });

  it("ainda nao confirmado e dentro do prazo: espera o intervalo", () => {
    expect(nextPixPollStep({ isPro: false, elapsedMs: 8000 })).toEqual({
      action: "wait",
      delayMs: PIX_POLL_INTERVAL_MS,
    });
  });

  it("passou do teto sem confirmar: para por timeout", () => {
    expect(
      nextPixPollStep({ isPro: false, elapsedMs: PIX_POLL_TIMEOUT_MS }),
    ).toEqual({ action: "stop", reason: "timeout" });
  });

  it("um milissegundo antes do teto ainda tenta", () => {
    // Fronteira: a parada e NO teto, nao antes dele.
    expect(
      nextPixPollStep({ isPro: false, elapsedMs: PIX_POLL_TIMEOUT_MS - 1 }),
    ).toMatchObject({ action: "wait" });
  });
});

describe("confirmacao vence timeout, e isso importa", () => {
  it("confirmado E estourado: reporta CONFIRMADO", () => {
    // A ordem das checagens e o que decide. Se o timeout viesse primeiro, quem
    // pagou no ultimo instante veria "expirou" depois de ter pago, que e a pior
    // mentira que esta tela pode contar.
    expect(
      nextPixPollStep({ isPro: true, elapsedMs: PIX_POLL_TIMEOUT_MS * 2 }),
    ).toEqual({ action: "confirmed" });
  });
});

describe("os numeros sao plausiveis para o meio de pagamento", () => {
  it("o intervalo esta na faixa de segundos, nao de minutos", () => {
    // Pix confirma em segundos. Um intervalo longo transformaria uma
    // confirmacao instantanea numa espera artificial.
    expect(PIX_POLL_INTERVAL_MS).toBeGreaterThanOrEqual(3000);
    expect(PIX_POLL_INTERVAL_MS).toBeLessThanOrEqual(5000);
  });

  it("o teto e muito maior que um Pix e muito menor que o prazo do QR", () => {
    // O QR vale 2 dias (PIX_DUE_DAYS no provedor). O polling nao pode durar
    // isso; ele cobre a janela em que a pessoa esta olhando a tela.
    expect(PIX_POLL_TIMEOUT_MS).toBeGreaterThan(60_000);
    expect(PIX_POLL_TIMEOUT_MS).toBeLessThan(2 * 24 * 60 * 60 * 1000);
  });
});
