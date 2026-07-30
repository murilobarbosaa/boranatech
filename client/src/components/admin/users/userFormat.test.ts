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
  safeHttpUrl,
  semValor,
  subscriptionStatusBadgeOf,
  subscriptionStatusLabelOf,
  planLabelOf,
  cancellationReasonLabelOf,
  CANCELLATION_REASON_LABELS,
} from "./userFormat";
import { REASON_LABELS } from "@/components/admin/CancellationReasonsDashboard";

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

describe("safeHttpUrl: o que pode virar href", () => {
  it("http e https passam", () => {
    expect(safeHttpUrl("https://github.com/ana")).toBe(
      "https://github.com/ana",
    );
    expect(safeHttpUrl("http://exemplo.com.br")).toBe("http://exemplo.com.br");
  });

  it("espacos nas pontas nao invalidam", () => {
    expect(safeHttpUrl("  https://x.com  ")).toBe("https://x.com");
  });

  it("javascript: NAO vira href", () => {
    // O valor vem do banco, escrito pelo proprio usuario em /api/me. Confiar
    // nele para montar href e entregar XSS ao admin, que e quem tem mais a
    // perder na plataforma.
    expect(safeHttpUrl("javascript:alert(document.cookie)")).toBeNull();
  });

  it("data: e outros esquemas NAO viram href", () => {
    expect(safeHttpUrl("data:text/html,<script>alert(1)</script>")).toBeNull();
    expect(safeHttpUrl("file:///etc/passwd")).toBeNull();
    expect(safeHttpUrl("vbscript:msgbox(1)")).toBeNull();
  });

  it("sem esquema NAO vira href: nao adivinhamos https", () => {
    // "github.com/ana" pode ser o que a pessoa quis, mas inventar o esquema e
    // inventar dado. Vira texto cru.
    expect(safeHttpUrl("github.com/ana")).toBeNull();
  });

  it("lixo, vazio e nulo devolvem null", () => {
    expect(safeHttpUrl("nao é url")).toBeNull();
    expect(safeHttpUrl("")).toBeNull();
    expect(safeHttpUrl(null)).toBeNull();
    expect(safeHttpUrl(undefined)).toBeNull();
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

describe("valores de servidor que chegavam crus na tela", () => {
  // O inventario de frases da aba (aba.frases.test.tsx) pegou estes quatro
  // aparecendo em snake_case no DOM: superseded, missing_feature, pro_annual e
  // os irmaos de plan_code. A correcao e preencher o mapa, NUNCA remover o
  // fallback: valor novo tem que continuar aparecendo cru em vez de quebrar a
  // pagina.

  describe("subscriptionStatusLabelOf", () => {
    it("traduz os 7 status que subscriptions.status pode guardar", () => {
      // O TOTAL e afirmado, nao a pertinencia. Os 5 primeiros sao a saida de
      // mapStatus (server/providers/stripe.ts), que colapsa os 8 status da
      // Stripe; os 2 ultimos sao escritos como literal pelo proprio projeto.
      expect({
        active: subscriptionStatusLabelOf("active"),
        trialing: subscriptionStatusLabelOf("trialing"),
        past_due: subscriptionStatusLabelOf("past_due"),
        canceled: subscriptionStatusLabelOf("canceled"),
        incomplete: subscriptionStatusLabelOf("incomplete"),
        pending: subscriptionStatusLabelOf("pending"),
        superseded: subscriptionStatusLabelOf("superseded"),
      }).toEqual({
        active: "Ativa",
        trialing: "Em teste",
        past_due: "Inadimplente",
        canceled: "Cancelada",
        incomplete: "Incompleta",
        pending: "Aguardando pagamento",
        superseded: "Substituída",
      });
    });

    it("status novo continua aparecendo cru, sem quebrar", () => {
      expect(subscriptionStatusLabelOf("status_do_futuro")).toBe(
        "status_do_futuro",
      );
    });

    it("sem assinatura, nao inventa", () => {
      expect(subscriptionStatusLabelOf(null)).toBe(NAO_INFORMADO);
      expect(subscriptionStatusLabelOf(undefined)).toBe(NAO_INFORMADO);
    });

    it("o selo da lista e o rotulo do detalhe dizem a MESMA coisa", () => {
      // Eram dois caminhos: a lista resolvia pelo selo e o detalhe passava
      // fmtText no valor cru. Divergir de novo e o defeito que esta fatia
      // conserta.
      for (const s of ["active", "pending", "superseded", "canceled"]) {
        expect(subscriptionStatusBadgeOf(s)?.label).toBe(
          subscriptionStatusLabelOf(s),
        );
      }
    });
  });

  describe("planLabelOf", () => {
    it("usa o nome que a propria tabela plans guarda", () => {
      // Nao sao textos inventados: sao os `plans.name` de producao, conferidos
      // em 2026-07-30. Inventar nome de plano seria inventar dado.
      expect({
        free: planLabelOf("free"),
        pro_monthly: planLabelOf("pro_monthly"),
        pro_semiannual: planLabelOf("pro_semiannual"),
        pro_annual: planLabelOf("pro_annual"),
      }).toEqual({
        free: "Gratuito",
        pro_monthly: "Pro Mensal",
        pro_semiannual: "Pro Semestral",
        pro_annual: "Pro Anual",
      });
    });

    it("plano novo aparece cru", () => {
      expect(planLabelOf("pro_bienal")).toBe("pro_bienal");
    });

    it("sem plano, nao inventa", () => {
      expect(planLabelOf(null)).toBe(NAO_INFORMADO);
    });
  });

  describe("cancellationReasonLabelOf", () => {
    it("traduz os 6 reason_code que o CHECK do banco permite", () => {
      expect({
        expensive: cancellationReasonLabelOf("expensive"),
        unused: cancellationReasonLabelOf("unused"),
        missing_feature: cancellationReasonLabelOf("missing_feature"),
        paused: cancellationReasonLabelOf("paused"),
        other: cancellationReasonLabelOf("other"),
        admin: cancellationReasonLabelOf("admin"),
      }).toEqual({
        expensive: "Está caro",
        unused: "Não estava usando",
        missing_feature: "Faltou funcionalidade",
        paused: "Vai pausar, volta depois",
        other: "Outro motivo",
        admin: "Cancelado pelo admin",
      });
    });

    it("motivo novo aparece cru", () => {
      expect(cancellationReasonLabelOf("motivo_do_futuro")).toBe(
        "motivo_do_futuro",
      );
    });

    it("nao diverge do mapa da aba Retenção", () => {
      // Os dois mapas existem separados de propósito (a aba Retenção não é
      // escopo desta fatia), mas divergir em silêncio seria a mesma frase
      // significando coisas diferentes em duas telas do mesmo admin. Este
      // teste é o que torna a divergência barulhenta.
      expect(CANCELLATION_REASON_LABELS).toEqual(REASON_LABELS);
    });
  });
});
