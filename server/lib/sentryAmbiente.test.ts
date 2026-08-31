import { describe, expect, it } from "vitest";

import { deveReportarAoSentry } from "./sentry";
import { deveReportarAoSentryNoCliente } from "../../client/src/lib/sentry";

/**
 * SENTRY NAO REPORTA DE FORA DE PRODUCAO.
 *
 * O defeito medido em 2026-08-31: a unica guarda era a presenca do DSN, e
 * `environment: env.nodeEnv` apenas rotula o evento. Rodar `pnpm dev` com o
 * `.env` de producao mandava erro da maquina local para o projeto de producao, e
 * de la para o CRM: `NODE-EXPRESS-6` (EADDRINUSE :::3100, 3 eventos, todos
 * `environment=development`, `server_name=s0ft-750QFG`) e `NODE-EXPRESS-J`
 * (2 eventos) sao cards que descrevem a maquina de quem programa.
 *
 * Os controles negativos aqui sao a metade que importa: uma guarda que nunca
 * deixa passar tambem "resolve" o vazamento, e desliga o Sentry de producao
 * junto. Por isso cada teste que afirma silencio tem um par que afirma envio.
 */

describe("deveReportarAoSentry (servidor)", () => {
  it("producao com DSN: REPORTA", () => {
    expect(
      deveReportarAoSentry({
        temDsn: true,
        isProd: true,
        escapeLigado: false,
      }),
    ).toBe(true);
  });

  it("fora de producao: NAO reporta", () => {
    expect(
      deveReportarAoSentry({
        temDsn: true,
        isProd: false,
        escapeLigado: false,
      }),
    ).toBe(false);
  });

  it("fora de producao COM o escape ligado: reporta", () => {
    // A valvula existe para dar para exercitar o pipeline localmente. Sem ela a
    // correcao tornaria o instrumento impossivel de testar.
    expect(
      deveReportarAoSentry({
        temDsn: true,
        isProd: false,
        escapeLigado: true,
      }),
    ).toBe(true);
  });

  it("CONTROLE NEGATIVO: sem DSN nao reporta, nem em producao", () => {
    expect(
      deveReportarAoSentry({
        temDsn: false,
        isProd: true,
        escapeLigado: false,
      }),
    ).toBe(false);
  });

  it("CONTROLE NEGATIVO: sem DSN o escape nao ressuscita nada", () => {
    // O escape libera o AMBIENTE, nunca a falta de destino. Sem esta ordem, uma
    // variavel ligada por engano faria o init rodar sem DSN.
    expect(
      deveReportarAoSentry({
        temDsn: false,
        isProd: false,
        escapeLigado: true,
      }),
    ).toBe(false);
  });

  it("CONTROLE NEGATIVO: producao nao depende do escape", () => {
    // Producao reporta com o escape em qualquer valor. Se este teste cair, a
    // guarda passou a exigir a variavel em producao, que e o defeito oposto.
    for (const escapeLigado of [true, false]) {
      expect(
        deveReportarAoSentry({ temDsn: true, isProd: true, escapeLigado }),
        `escape=${escapeLigado}`,
      ).toBe(true);
    }
  });
});

describe("deveReportarAoSentryNoCliente (browser)", () => {
  it("build de producao com DSN: REPORTA", () => {
    expect(deveReportarAoSentryNoCliente({ temDsn: true, isProd: true })).toBe(
      true,
    );
  });

  it("servidor de desenvolvimento do Vite: NAO reporta", () => {
    expect(deveReportarAoSentryNoCliente({ temDsn: true, isProd: false })).toBe(
      false,
    );
  });

  it("CONTROLE NEGATIVO: sem DSN nao reporta, nem em build de producao", () => {
    expect(deveReportarAoSentryNoCliente({ temDsn: false, isProd: true })).toBe(
      false,
    );
  });

  it("CONTROLE NEGATIVO: o cliente NAO tem escape, e isso e deliberado", () => {
    // A valvula do servidor existe porque quem programa roda o servidor local
    // com o `.env` de producao em maos. No browser o DSN e publico e vai no
    // bundle: um escape ali seria uma chave para qualquer build mandar evento,
    // e o caso de uso (exercitar o pipeline) ja e coberto pelo servidor.
    expect(deveReportarAoSentryNoCliente.length).toBe(1);
  });
});
