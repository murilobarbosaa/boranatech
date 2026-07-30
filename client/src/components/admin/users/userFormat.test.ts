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
  avatarModeLabelOf,
  initialsOf,
  labelFrom,
  proBadgeOf,
  semValor,
  subscriptionStatusBadgeOf,
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

describe("proBadgeOf", () => {
  it("Pro por assinatura e Pro por influencer sao distinguiveis na lista", () => {
    // Nao e cosmetica: a Fatia 6 vai cancelar assinatura, e cancelar a de um
    // influencer NAO tira o Pro. Se a lista mostrasse o mesmo selo para os
    // dois, o admin cancelaria e nao entenderia o resultado.
    expect(proBadgeOf("subscription").label).toBe("Pro");
    expect(proBadgeOf("influencer").label).toBe("Influencer");
    expect(proBadgeOf("subscription").label).not.toBe(
      proBadgeOf("influencer").label,
    );
  });

  it("quem tem os DOIS mostra os dois", () => {
    expect(proBadgeOf("both").label).toBe("Pro + Influencer");
  });

  it("sem origem de Pro, o selo e Grátis", () => {
    expect(proBadgeOf(null).label).toBe("Grátis");
    expect(proBadgeOf(undefined).label).toBe("Grátis");
  });

  it("origem desconhecida do servidor cai num selo neutro, sem quebrar", () => {
    // Uma terceira origem de Pro (cortesia, cupom vitalicio) pode nascer no
    // backend antes de o bundle do front subir.
    const badge = proBadgeOf("cortesia");
    expect(badge.label).toBe("cortesia");
    expect(badge.className.length).toBeGreaterThan(0);
  });

  it("todo selo tem classe de cor: nenhum caminho devolve undefined", () => {
    for (const origem of ["subscription", "influencer", "both", "xpto", null]) {
      expect(typeof proBadgeOf(origem).className).toBe("string");
    }
  });
});

describe("subscriptionStatusBadgeOf", () => {
  it("traduz os status conhecidos da Stripe", () => {
    expect(subscriptionStatusBadgeOf("active")?.label).toBe("Ativa");
    expect(subscriptionStatusBadgeOf("canceled")?.label).toBe("Cancelada");
    expect(subscriptionStatusBadgeOf("past_due")?.label).toBe("Inadimplente");
  });

  it("status NOVO da Stripe nao quebra a tela: devolve o valor cru", () => {
    // Foi um acesso direto a mapa por valor do servidor que derrubou o admin em
    // producao. A Stripe pode introduzir status a qualquer momento.
    const badge = subscriptionStatusBadgeOf("paused_by_provider");
    expect(badge?.label).toBe("paused_by_provider");
    expect(typeof badge?.className).toBe("string");
  });

  it("sem assinatura devolve null, para a coluna ficar vazia em vez de mentir", () => {
    expect(subscriptionStatusBadgeOf(null)).toBeNull();
    expect(subscriptionStatusBadgeOf(undefined)).toBeNull();
    expect(subscriptionStatusBadgeOf("")).toBeNull();
  });
});

describe("initialsOf", () => {
  it("usa as iniciais do primeiro e do ultimo nome", () => {
    expect(initialsOf("Ana Ferreira Moura")).toBe("AM");
  });

  it("nome unico usa so a primeira letra", () => {
    expect(initialsOf("Ana")).toBe("A");
  });

  it("vazio nao vira string vazia no circulo", () => {
    expect(initialsOf("")).toBe("?");
    expect(initialsOf("   ")).toBe("?");
  });

  it("sempre em maiuscula e no maximo duas letras", () => {
    const saida = initialsOf("ana ferreira moura");
    expect(saida).toBe("AM");
    expect(saida.length).toBeLessThanOrEqual(2);
  });
});

describe("semValor: decide o esmaecido a partir do DADO, nao do texto", () => {
  it("null, undefined e string em branco sao ausencia de dado", () => {
    expect(semValor(null)).toBe(true);
    expect(semValor(undefined)).toBe(true);
    expect(semValor("")).toBe(true);
    expect(semValor("   ")).toBe(true);
  });

  it("false NAO e ausencia: e uma resposta", () => {
    // A armadilha que motivou o helper. Um `empty={!valor}` no call site
    // esmaeceria o "Não" de um opt-in recusado, que e dado de verdade.
    expect(semValor(false)).toBe(false);
  });

  it("zero NAO e ausencia", () => {
    // "Valor pago: R$ 0,00" e informacao; "passo do onboarding: 0" tambem.
    expect(semValor(0)).toBe(false);
  });

  it("texto e numero comuns nao sao ausencia", () => {
    expect(semValor("Ana")).toBe(false);
    expect(semValor(22200)).toBe(false);
  });
});

describe("avatarModeLabelOf", () => {
  it("traduz os modos conhecidos", () => {
    expect(avatarModeLabelOf("photo")).toBe("Foto");
    expect(avatarModeLabelOf("icon")).toBe("Ícone");
  });

  it("modo desconhecido mostra o valor cru em vez de mentir Ícone", () => {
    // Antes, QUALQUER coisa diferente de "photo" virava "Ícone", inclusive um
    // modo novo do backend. A tela afirmava com confianca algo que nao sabia.
    expect(avatarModeLabelOf("gravatar")).toBe("gravatar");
  });

  it("ausente vira Nao informado", () => {
    expect(avatarModeLabelOf(null)).toBe(NAO_INFORMADO);
    expect(avatarModeLabelOf(undefined)).toBe(NAO_INFORMADO);
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
