import { describe, expect, it } from "vitest";

/**
 * Regras do calendario compartilhado (lote 10).
 *
 * As datas sao LITERAIS escritas a mao. A grade de setembro de 2026 e o caso
 * que importa: o mes comeca numa terca, entao a primeira semana tem dois dias
 * de agosto na frente, e e justamente esse encaixe que uma grade errada acerta
 * por acaso quando o mes comeca no domingo.
 */

import {
  gerarGradeDoMes,
  JANELA_DE_DIAS,
  LIMITE_DE_PEDIDOS_POR_DIA,
  MENSAGEM_MAX,
  normalizarMensagemDeCollab,
  normalizarNota,
  NOTA_MAX,
  validarDataDeMarcacao,
} from "./creatorCalendar";

const HOJE = "2026-09-16";

describe("normalizarNota", () => {
  it("corta espaco, e vazio vira null (marcar sem assunto vale)", () => {
    expect(normalizarNota("  Bastidores do curso  ")).toEqual({
      ok: true,
      valor: "Bastidores do curso",
    });
    expect(normalizarNota("")).toEqual({ ok: true, valor: null });
    expect(normalizarNota("   ")).toEqual({ ok: true, valor: null });
    expect(normalizarNota(null)).toEqual({ ok: true, valor: null });
    expect(normalizarNota(undefined)).toEqual({ ok: true, valor: null });
  });

  it("no teto passa; um caractere acima e erro", () => {
    expect(normalizarNota("a".repeat(NOTA_MAX))).toEqual({
      ok: true,
      valor: "a".repeat(NOTA_MAX),
    });
    expect(normalizarNota("a".repeat(NOTA_MAX + 1))).toEqual({
      ok: false,
      code: "invalid_note",
    });
    expect(NOTA_MAX).toBe(140);
  });

  it("o que nem e texto e erro, nao null", () => {
    expect(normalizarNota(42)).toEqual({ ok: false, code: "invalid_note" });
    expect(normalizarNota({})).toEqual({ ok: false, code: "invalid_note" });
  });
});

describe("normalizarMensagemDeCollab", () => {
  it("mesma regra da nota, com o teto de 300", () => {
    expect(normalizarMensagemDeCollab("  bora?  ")).toEqual({
      ok: true,
      valor: "bora?",
    });
    expect(normalizarMensagemDeCollab("")).toEqual({ ok: true, valor: null });
    expect(normalizarMensagemDeCollab("a".repeat(MENSAGEM_MAX))).toEqual({
      ok: true,
      valor: "a".repeat(MENSAGEM_MAX),
    });
    expect(normalizarMensagemDeCollab("a".repeat(MENSAGEM_MAX + 1))).toEqual({
      ok: false,
      code: "invalid_message",
    });
    expect(MENSAGEM_MAX).toBe(300);
  });
});

describe("validarDataDeMarcacao", () => {
  it("hoje e o limite de 90 dias passam; um dia alem nao", () => {
    expect(validarDataDeMarcacao(HOJE, HOJE)).toEqual({
      ok: true,
      valor: HOJE,
    });
    // 16/09/2026 mais 90 dias.
    expect(validarDataDeMarcacao("2026-12-15", HOJE)).toEqual({
      ok: true,
      valor: "2026-12-15",
    });
    expect(validarDataDeMarcacao("2026-12-16", HOJE)).toEqual({
      ok: false,
      code: "date_out_of_window",
    });
    expect(JANELA_DE_DIAS).toBe(90);
  });

  it("ontem tem codigo PROPRIO, diferente de data invalida", () => {
    expect(validarDataDeMarcacao("2026-09-15", HOJE)).toEqual({
      ok: false,
      code: "date_out_of_window",
    });
    for (const ruim of ["16/09/2026", "2026-9-16", "amanha", "", 20260916]) {
      expect(validarDataDeMarcacao(ruim, HOJE)).toEqual({
        ok: false,
        code: "invalid_date",
      });
    }
  });

  it("hoje invalido LANCA: e erro de quem chama, nao do usuario", () => {
    expect(() => validarDataDeMarcacao("2026-09-20", "16/09/2026")).toThrow();
  });
});

describe("gerarGradeDoMes", () => {
  it("setembro de 2026: comeca na terca, entao a semana 1 abre em 30/08", () => {
    const grade = gerarGradeDoMes(2026, 9);
    expect(grade[0][0]).toEqual({ dia: "2026-08-30", doMes: false });
    expect(grade[0][1]).toEqual({ dia: "2026-08-31", doMes: false });
    expect(grade[0][2]).toEqual({ dia: "2026-09-01", doMes: true });
    const ultima = grade[grade.length - 1];
    expect(ultima[ultima.length - 1].dia).toBe("2026-10-03");
    expect(ultima[ultima.length - 1].doMes).toBe(false);
  });

  it("toda semana tem sete dias, em sequencia, sem buraco", () => {
    for (const ano of [2026, 2027]) {
      for (let mes = 1; mes <= 12; mes += 1) {
        const grade = gerarGradeDoMes(ano, mes);
        const dias = grade.flat();
        expect(grade.every((s) => s.length === 7)).toBe(true);
        // Sequencia continua: cada dia e o seguinte do anterior.
        for (let i = 1; i < dias.length; i += 1) {
          const anterior = new Date(`${dias[i - 1].dia}T00:00:00Z`).getTime();
          const atual = new Date(`${dias[i].dia}T00:00:00Z`).getTime();
          expect(atual - anterior).toBe(86400000);
        }
        // Comeca em domingo e termina em sabado.
        expect(new Date(`${dias[0].dia}T00:00:00Z`).getUTCDay()).toBe(0);
        expect(
          new Date(`${dias[dias.length - 1].dia}T00:00:00Z`).getUTCDay(),
        ).toBe(6);
      }
    }
  });

  it("todo dia do mes aparece exatamente uma vez, e marcado como do mes", () => {
    const grade = gerarGradeDoMes(2026, 2);
    const doMes = grade.flat().filter((d) => d.doMes);
    // 2026 nao e bissexto.
    expect(doMes).toHaveLength(28);
    expect(doMes[0].dia).toBe("2026-02-01");
    expect(doMes[27].dia).toBe("2026-02-28");
    expect(new Set(doMes.map((d) => d.dia)).size).toBe(28);
  });

  it("dezembro fecha o ano sem estourar para o mes 13", () => {
    const grade = gerarGradeDoMes(2026, 12);
    const doMes = grade.flat().filter((d) => d.doMes);
    expect(doMes).toHaveLength(31);
    expect(doMes[30].dia).toBe("2026-12-31");
  });

  it("mes ou ano invalido LANCA, em vez de devolver grade vazia", () => {
    expect(() => gerarGradeDoMes(2026, 0)).toThrow();
    expect(() => gerarGradeDoMes(2026, 13)).toThrow();
    expect(() => gerarGradeDoMes(1999, 5)).toThrow();
    expect(() => gerarGradeDoMes(2026.5, 5)).toThrow();
  });
});

describe("LIMITE_DE_PEDIDOS_POR_DIA", () => {
  it("e cinco, e e por creator por dia civil", () => {
    expect(LIMITE_DE_PEDIDOS_POR_DIA).toBe(5);
  });
});
