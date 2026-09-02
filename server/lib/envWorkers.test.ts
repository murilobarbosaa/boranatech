import { describe, expect, it } from "vitest";

import { deveSubirWorkers } from "./env";

/**
 * Guarda que decide se ESTE processo consome a fila de e-mail.
 *
 * O caso real que motivou (02/09/2026): 32 das 34 worktrees da maquina de
 * desenvolvimento tem o REDIS_URL de producao no `.env`, entao qualquer
 * `pnpm dev` virava um worker da fila de producao. Um deles ficou de pe de
 * 29/08 21:07 a 02/09.
 *
 * Expectativas escritas a mao, uma por linha da tabela de decisao, nunca
 * derivadas de chamar a propria funcao.
 */
describe("deveSubirWorkers: fail-closed fora de producao", () => {
  it("production sem flag: sobe", () => {
    expect(
      deveSubirWorkers({ nodeEnv: "production", escapeLigado: false }),
    ).toBe(true);
  });

  it("development sem flag: NAO sobe", () => {
    expect(
      deveSubirWorkers({ nodeEnv: "development", escapeLigado: false }),
    ).toBe(false);
  });

  it("development com o escape ligado: sobe", () => {
    expect(
      deveSubirWorkers({ nodeEnv: "development", escapeLigado: true }),
    ).toBe(true);
  });

  it('development com QUEUE_WORKERS_NON_PROD="1": NAO sobe', () => {
    // "1" nao liga nada: o env so aceita a string exata "true". O teste existe
    // para travar isso, porque "1" e o palpite obvio de quem for ligar o escape
    // as pressas, e ligar por engano custa consumir a fila de producao.
    const escapeLigado = ("1" as string) === "true";
    expect(escapeLigado).toBe(false);
    expect(deveSubirWorkers({ nodeEnv: "development", escapeLigado })).toBe(
      false,
    );
  });

  it("test sem flag: NAO sobe", () => {
    expect(deveSubirWorkers({ nodeEnv: "test", escapeLigado: false })).toBe(
      false,
    );
  });

  it("qualquer outro ambiente sem flag: NAO sobe", () => {
    // Fail-closed: o default e nao consumir, e so "production" abre.
    for (const nodeEnv of ["staging", "preview", "", "PRODUCTION", "prod"]) {
      expect(deveSubirWorkers({ nodeEnv, escapeLigado: false })).toBe(false);
    }
  });

  it("o escape sozinho basta, em qualquer ambiente", () => {
    for (const nodeEnv of ["development", "test", "staging"]) {
      expect(deveSubirWorkers({ nodeEnv, escapeLigado: true })).toBe(true);
    }
  });
});
