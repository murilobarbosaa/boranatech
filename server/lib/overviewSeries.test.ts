import { describe, expect, it } from "vitest";

import {
  calcularFrescor,
  contarCoortePaga,
  montarFunilDeCoorte,
  SNAPSHOT_MARGEM_HORAS,
} from "./overviewSeries";
import type { ObservedPayment } from "./registeredPayments";

const payment = (over: Partial<ObservedPayment> = {}): ObservedPayment => ({
  paymentKey: "stripe:charge:ch_1",
  rowId: "row-1",
  provider: "stripe",
  userId: "u1",
  occurredAt: "2026-09-10T13:00:00.000Z",
  grossCents: 1000,
  planCode: "pro_monthly",
  method: "Não identificado",
  classification: "first_observed",
  userEvidence: "representative",
  planEvidence: "representative",
  ...over,
});

describe("funil pago da Visão", () => {
  const cutoff = "2026-09-11T15:00:00.000Z";

  it("mantém cadastro -> pagamento elegível pós-cadastro -> success de IA pós-pagamento", () => {
    const counts = contarCoortePaga({
      pessoas: [
        { user_id: "u1", created_at: "2026-09-10T10:00:00Z" },
        { user_id: "u2", created_at: "2026-09-10T10:00:00Z" },
        { user_id: "u3", created_at: "2026-09-10T10:00:00Z" },
      ],
      pagamentos: [
        payment(),
        payment({
          paymentKey: "stripe:charge:ch_2",
          rowId: "row-2",
          userId: "u2",
        }),
      ],
      logs: [
        {
          user_id: "u1",
          status: "success",
          created_at: "2026-09-10T14:00:00Z",
        },
        { user_id: "u2", status: "error", created_at: "2026-09-10T14:00:00Z" },
        {
          user_id: "u3",
          status: "success",
          created_at: "2026-09-10T14:00:00Z",
        },
      ],
      cutoff,
    });
    expect(counts).toEqual({
      cadastro: 3,
      pagaram: 2,
      iniciaramIaComStatusSuccessNaConsulta: 1,
      cadastrosComMenosDe7Dias: 3,
    });
    const funnel = montarFunilDeCoorte({
      ...counts,
      limiteTemporalDosInicios: cutoff,
      consultaIniciadaEm: "2026-09-11T15:00:01Z",
      consultaConcluidaEm: "2026-09-11T15:00:02Z",
    });
    expect(funnel.passos.map((p) => p.valor)).toEqual([3, 2, 1]);
    expect(funnel.passos[2].taxaSobreAnterior).toBe(50);
  });

  it("exclui pagamento anterior ao cadastro e uso anterior, reservado, falho, inválido ou futuro", () => {
    const counts = contarCoortePaga({
      pessoas: [{ user_id: "u1", created_at: "2026-09-10T10:00:00Z" }],
      pagamentos: [
        payment({ occurredAt: "2026-09-10T09:00:00Z" }),
        payment({
          paymentKey: "asaas:payment:pay_1",
          rowId: "row-2",
          provider: "asaas",
          occurredAt: "2026-09-10T13:00:00Z",
        }),
      ],
      logs: [
        {
          user_id: "u1",
          status: "success",
          created_at: "2026-09-10T12:59:59Z",
        },
        {
          user_id: "u1",
          status: "reserved",
          created_at: "2026-09-10T14:00:00Z",
        },
        { user_id: "u1", status: "error", created_at: "2026-09-10T14:00:00Z" },
        { user_id: "u1", status: "success", created_at: "inválido" },
        {
          user_id: "u1",
          status: "success",
          created_at: "2026-09-11T16:00:00Z",
        },
      ],
      cutoff,
    });
    expect(counts).toEqual({
      cadastro: 1,
      pagaram: 1,
      iniciaramIaComStatusSuccessNaConsulta: 0,
      cadastrosComMenosDe7Dias: 1,
    });
  });

  it("não inventa conclusão posterior para reserva iniciada antes da compra", () => {
    const counts = contarCoortePaga({
      pessoas: [{ user_id: "u1", created_at: "2026-09-10T10:00:00Z" }],
      pagamentos: [payment()],
      logs: [
        {
          user_id: "u1",
          status: "success",
          created_at: "2026-09-10T12:00:00Z",
        },
      ],
      cutoff,
    });
    expect(counts.iniciaramIaComStatusSuccessNaConsulta).toBe(0);
  });

  it("mede status na consulta: a mesma reserva pode mudar sem datar a conclusão", () => {
    const base = {
      pessoas: [{ user_id: "u1", created_at: "2026-09-10T10:00:00Z" }],
      pagamentos: [payment()],
      cutoff,
    };
    const reserved = contarCoortePaga({
      ...base,
      logs: [
        {
          user_id: "u1",
          status: "reserved",
          created_at: "2026-09-10T14:00:00Z",
        },
      ],
    });
    const successLidoDepois = contarCoortePaga({
      ...base,
      logs: [
        {
          user_id: "u1",
          status: "success",
          created_at: "2026-09-10T14:00:00Z",
        },
      ],
    });
    expect(reserved.iniciaramIaComStatusSuccessNaConsulta).toBe(0);
    expect(successLidoDepois.iniciaramIaComStatusSuccessNaConsulta).toBe(1);

    const funnel = montarFunilDeCoorte({
      ...successLidoDepois,
      limiteTemporalDosInicios: cutoff,
      consultaIniciadaEm: "2026-09-12T10:00:00Z",
      consultaConcluidaEm: "2026-09-12T10:00:01Z",
    });
    expect(funnel.semanticaUso).toBe(
      "inicio_apos_pagamento_status_success_na_consulta",
    );
    expect(funnel.limiteTemporalDosInicios).toBe(cutoff);
    expect(funnel.passos[2].rotulo).not.toMatch(/ocorri|conclu/i);
  });

  it("exige ordem temporal demonstrável; empate cadastro/pagamento não é após", () => {
    const counts = contarCoortePaga({
      pessoas: [{ user_id: "u1", created_at: "2026-09-10T13:00:00Z" }],
      pagamentos: [payment()],
      logs: [],
      cutoff,
    });
    expect(counts.pagaram).toBe(0);
  });

  it("deixa taxa indisponível com denominador zero", () => {
    const counts = contarCoortePaga({
      pessoas: [],
      pagamentos: [],
      logs: [],
      cutoff,
    });
    const funnel = montarFunilDeCoorte({
      ...counts,
      limiteTemporalDosInicios: cutoff,
      consultaIniciadaEm: "2026-09-11T15:00:01Z",
      consultaConcluidaEm: "2026-09-11T15:00:02Z",
    });
    expect(funnel.passos.map((p) => p.taxaSobreAnterior)).toEqual([
      null,
      null,
      null,
    ]);
    expect(funnel.destaque).toBeNull();
  });

  it("desativa comparação entre coortes com exposição desigual", () => {
    const funnel = montarFunilDeCoorte({
      cadastro: 10,
      pagaram: 2,
      iniciaramIaComStatusSuccessNaConsulta: 1,
      cadastrosComMenosDe7Dias: 10,
      limiteTemporalDosInicios: cutoff,
      consultaIniciadaEm: "2026-09-11T15:00:01Z",
      consultaConcluidaEm: "2026-09-11T15:00:02Z",
    });
    expect(funnel.anterior).toBeNull();
    expect(funnel.deltaPp).toBeNull();
    expect(funnel.motivoSemDelta).toBe(
      "janelas_de_observacao_nao_equivalentes",
    );
  });
});

describe("frescor do snapshot", () => {
  it("não acusa atraso antes da execução esperada do dia", () => {
    expect(
      calcularFrescor("2026-08-13", new Date("2026-08-14T01:30:00Z")),
    ).toMatchObject({
      atrasado: false,
      horasDesdeOEsperado: 0,
    });
  });

  it("acusa uma execução inteira perdida e preserva margem finita", () => {
    expect(
      calcularFrescor("2026-08-12", new Date("2026-08-14T06:00:00Z")).atrasado,
    ).toBe(true);
    expect(SNAPSHOT_MARGEM_HORAS).toBeGreaterThan(0);
    expect(SNAPSHOT_MARGEM_HORAS).toBeLessThan(24);
  });

  it("sem snapshot é ausência, não zero", () => {
    expect(
      calcularFrescor(null, new Date("2026-08-14T06:00:00Z")),
    ).toMatchObject({
      ultimoSnapshot: null,
      horasDesdeOEsperado: null,
    });
  });
});
