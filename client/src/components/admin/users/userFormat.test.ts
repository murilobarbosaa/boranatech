import { describe, expect, it } from "vitest";

import {
  NAO_INFORMADO,
  PAYMENT_METHOD_LABELS,
  activityStatusLabelOf,
  displayName,
  fmtBool,
  fmtBrl,
  fmtDate,
  fmtDateTime,
  fmtText,
  labelFrom,
} from "./userFormat";

/**
 * Formatadores do modulo de Usuarios.
 *
 * Os testes de activityStatusLabelOf vieram da Fatia 0 (o resolver nasceu la);
 * os demais sao caracterizacao do comportamento que foi MOVIDO verbatim de
 * UsersDashboard.tsx nesta fatia. Servem de trava: a extracao nao pode ter
 * mudado o texto que a tela mostra, e a proxima fatia (redesign) vai mexer
 * nesses arquivos.
 *
 * Datas: os casos validos usam hora do meio-dia em UTC de proposito. Meia-noite
 * UTC cairia no dia anterior em qualquer fuso negativo (o Brasil e UTC-3) e o
 * teste passaria ou falharia dependendo da maquina.
 */

describe("activityStatusLabelOf", () => {
  it("mantem os rotulos atuais dos tres valores conhecidos", () => {
    // Trava contra mudanca visual: estes tres textos sao exatamente os que a
    // tela renderiza hoje.
    expect(activityStatusLabelOf("active")).toBe("Ativo");
    expect(activityStatusLabelOf("inactive")).toBe("Inativo");
    expect(activityStatusLabelOf("never")).toBe("Nunca acessou");
  });

  it("valor desconhecido do servidor devolve o valor cru, sem quebrar", () => {
    expect(activityStatusLabelOf("dormant")).toBe("dormant");
  });

  it("null e undefined viram Nao informado, como os demais campos vazios", () => {
    expect(activityStatusLabelOf(null)).toBe(NAO_INFORMADO);
    expect(activityStatusLabelOf(undefined)).toBe(NAO_INFORMADO);
  });

  it("string vazia tambem e campo vazio, nao rotulo vazio", () => {
    expect(activityStatusLabelOf("")).toBe(NAO_INFORMADO);
  });
});

describe("fmtText", () => {
  it("devolve o texto sem espaco nas pontas", () => {
    expect(fmtText("  Ana  ")).toBe("Ana");
  });

  it("null, undefined e so-espacos viram Nao informado", () => {
    expect(fmtText(null)).toBe(NAO_INFORMADO);
    expect(fmtText(undefined)).toBe(NAO_INFORMADO);
    expect(fmtText("   ")).toBe(NAO_INFORMADO);
  });
});

describe("fmtDate", () => {
  it("formata em pt-BR", () => {
    expect(fmtDate("2026-07-29T12:00:00Z")).toBe("29/07/2026");
  });

  it("null e undefined viram Nao informado", () => {
    expect(fmtDate(null)).toBe(NAO_INFORMADO);
    expect(fmtDate(undefined)).toBe(NAO_INFORMADO);
  });

  it("data invalida vira Nao informado em vez de Invalid Date", () => {
    expect(fmtDate("nao é uma data")).toBe(NAO_INFORMADO);
  });
});

describe("fmtDateTime", () => {
  it("inclui hora junto da data", () => {
    const saida = fmtDateTime("2026-07-29T12:00:00Z");
    expect(saida).toContain("29/07/2026");
    // A hora depende do fuso da maquina; o que importa e que ela aparece.
    expect(saida.length).toBeGreaterThan("29/07/2026".length);
  });

  it("null, undefined e lixo viram Nao informado", () => {
    expect(fmtDateTime(null)).toBe(NAO_INFORMADO);
    expect(fmtDateTime(undefined)).toBe(NAO_INFORMADO);
    expect(fmtDateTime("xxx")).toBe(NAO_INFORMADO);
  });
});

describe("fmtBool", () => {
  it("true e false viram Sim e Nao", () => {
    expect(fmtBool(true)).toBe("Sim");
    expect(fmtBool(false)).toBe("Não");
  });

  it("null e undefined NAO viram Nao: viram Nao informado", () => {
    // A diferenca importa: "Nao" e uma resposta, ausencia de dado nao e.
    expect(fmtBool(null)).toBe(NAO_INFORMADO);
    expect(fmtBool(undefined)).toBe(NAO_INFORMADO);
  });
});

describe("fmtBrl", () => {
  it("converte centavos para real", () => {
    //   = espaco nao separavel, que o Intl usa depois do R$.
    expect(fmtBrl(2990)).toBe("R$ 29,90");
  });

  it("zero e um valor, nao ausencia", () => {
    expect(fmtBrl(0)).toBe("R$ 0,00");
  });

  it("valor negativo (reembolso liquido) mantem o sinal", () => {
    expect(fmtBrl(-2990)).toBe("-R$ 29,90");
  });

  it("null e undefined viram Nao informado", () => {
    expect(fmtBrl(null)).toBe(NAO_INFORMADO);
    expect(fmtBrl(undefined)).toBe(NAO_INFORMADO);
  });
});

describe("labelFrom", () => {
  it("valor conhecido usa o rotulo do mapa", () => {
    expect(labelFrom(PAYMENT_METHOD_LABELS, "card")).toBe("Cartão");
  });

  it("valor desconhecido do servidor devolve o valor cru, sem quebrar", () => {
    expect(labelFrom(PAYMENT_METHOD_LABELS, "crypto")).toBe("crypto");
  });

  it("null, undefined e vazio viram Nao informado", () => {
    expect(labelFrom(PAYMENT_METHOD_LABELS, null)).toBe(NAO_INFORMADO);
    expect(labelFrom(PAYMENT_METHOD_LABELS, undefined)).toBe(NAO_INFORMADO);
    expect(labelFrom(PAYMENT_METHOD_LABELS, "")).toBe(NAO_INFORMADO);
  });
});

describe("displayName", () => {
  it("prefere o nome, sem espaco nas pontas", () => {
    expect(displayName({ name: "  Ana  ", email: "ana@x.com" })).toBe("Ana");
  });

  it("sem nome, usa a parte local do e-mail", () => {
    expect(displayName({ name: null, email: "ana.moura@x.com" })).toBe(
      "ana.moura",
    );
  });

  it("nome so com espacos nao conta como nome", () => {
    expect(displayName({ name: "   ", email: "ana@x.com" })).toBe("ana");
  });

  it("sem nome e sem e-mail utilizavel, cai no generico", () => {
    expect(displayName({})).toBe("Usuário");
    expect(displayName({ name: null, email: "sem-arroba" })).toBe("Usuário");
  });
});
