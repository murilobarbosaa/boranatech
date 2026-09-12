import { afterAll, describe, expect, it } from "vitest";

import { formatarVencimentoPix } from "./pixVencimento";

/**
 * VENCIMENTO DO PIX POR EXTENSO, independente do fuso do processo.
 *
 * O `vitest.config.ts` fixa `TZ=America/Sao_Paulo` para a suite inteira. Este
 * arquivo troca para UTC, que e o fuso do container em producao, e alterna os
 * dois dentro do mesmo teste para provar que a saida nao depende de qual deles
 * esta valendo. Cada troca e conferida pelo `getTimezoneOffset`, porque uma
 * troca de fuso que nao pegou deixaria o teste de "mesma saida nos dois"
 * verde sobre uma condicao que nunca existiu.
 */

const TZ_ORIGINAL = process.env.TZ;
process.env.TZ = "UTC";

afterAll(() => {
  process.env.TZ = TZ_ORIGINAL;
});

function usarFuso(tz: string, offsetEsperadoMin: number) {
  process.env.TZ = tz;
  // Instante fixo fora de qualquer horario de verao: o offset e o do fuso puro.
  expect(new Date("2026-09-10T12:00:00Z").getTimezoneOffset()).toBe(
    offsetEsperadoMin,
  );
}

describe("formatarVencimentoPix", () => {
  it("2026-09-10 com TZ=UTC e dia 10, nao 9", () => {
    usarFuso("UTC", 0);
    expect(formatarVencimentoPix("2026-09-10")).toBe(
      "10 de setembro de 2026",
    );
  });

  it("a mesma entrada da a mesma saida com TZ=UTC e TZ=America/Sao_Paulo", () => {
    for (const entrada of ["2026-09-10", "2026-01-01", "2026-12-31"]) {
      usarFuso("UTC", 0);
      const emUtc = formatarVencimentoPix(entrada);
      usarFuso("America/Sao_Paulo", 180);
      const emBrasilia = formatarVencimentoPix(entrada);
      expect(emBrasilia).toBe(emUtc);
    }
    usarFuso("UTC", 0);
  });

  it("virada de ano nao recua para o ano anterior em Brasilia", () => {
    usarFuso("America/Sao_Paulo", 180);
    expect(formatarVencimentoPix("2026-01-01")).toBe("1 de janeiro de 2026");
    usarFuso("UTC", 0);
  });

  it("entrada invalida devolve null, nunca um texto com Invalid Date", () => {
    for (const entrada of [
      "",
      "abc",
      "10/09/2026",
      "2026-9-10",
      "2026-09-10T00:00:00Z",
      "2026-02-30",
      "2026-13-01",
      "2026-00-10",
    ]) {
      expect(formatarVencimentoPix(entrada)).toBeNull();
    }
  });
});
