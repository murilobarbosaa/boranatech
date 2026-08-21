import { beforeEach, describe, expect, it } from "vitest";

import { ONBOARDING_TOUR_STORAGE_KEY } from "@shared/onboarding/schema";
import {
  TOUR_VALIDADE_MS,
  encerrarTour,
  iniciarTour,
  lerEstadoDoTour,
  tourAtivo,
} from "./tour";

const AGORA = Date.parse("2026-08-08T12:00:00.000Z");

beforeEach(() => {
  window.localStorage.clear();
});

describe("estado do tour", () => {
  it("comeca inativo", () => {
    expect(tourAtivo(AGORA)).toBe(false);
    expect(lerEstadoDoTour(AGORA)).toBeNull();
  });

  it("iniciar grava e encerrar limpa", () => {
    iniciarTour("2026-08-08T11:59:00.000Z");
    expect(tourAtivo(AGORA)).toBe(true);
    expect(lerEstadoDoTour(AGORA)).toEqual({
      active: true,
      startedAt: "2026-08-08T11:59:00.000Z",
    });

    encerrarTour();
    expect(tourAtivo(AGORA)).toBe(false);
    expect(window.localStorage.getItem(ONBOARDING_TOUR_STORAGE_KEY)).toBeNull();
  });

  it("dado corrompido conta como inativo e e limpo", () => {
    window.localStorage.setItem(ONBOARDING_TOUR_STORAGE_KEY, "{nao e json");
    expect(tourAtivo(AGORA)).toBe(false);
    expect(window.localStorage.getItem(ONBOARDING_TOUR_STORAGE_KEY)).toBeNull();
  });

  it("active:false nao e estado valido", () => {
    // O registro so existe enquanto o tour roda. Gravado assim, seria lido como
    // ativo por qualquer checagem de existencia.
    window.localStorage.setItem(
      ONBOARDING_TOUR_STORAGE_KEY,
      JSON.stringify({ active: false, startedAt: "2026-08-08T11:59:00.000Z" }),
    );
    expect(tourAtivo(AGORA)).toBe(false);
  });

  it("tour vencido conta como inativo e e limpo", () => {
    iniciarTour(new Date(AGORA - TOUR_VALIDADE_MS - 1000).toISOString());
    expect(tourAtivo(AGORA)).toBe(false);
    expect(window.localStorage.getItem(ONBOARDING_TOUR_STORAGE_KEY)).toBeNull();
  });

  it("tour dentro da validade continua ativo", () => {
    iniciarTour(new Date(AGORA - TOUR_VALIDADE_MS + 60_000).toISOString());
    expect(tourAtivo(AGORA)).toBe(true);
  });

  it("startedAt ilegivel conta como vencido", () => {
    // Sem instante de inicio nao da para afirmar que o tour e recente, e "nao
    // da para afirmar" nao pode virar "sim".
    window.localStorage.setItem(
      ONBOARDING_TOUR_STORAGE_KEY,
      JSON.stringify({ active: true, startedAt: "ontem de manha" }),
    );
    expect(tourAtivo(AGORA)).toBe(false);
    expect(window.localStorage.getItem(ONBOARDING_TOUR_STORAGE_KEY)).toBeNull();
  });
});
