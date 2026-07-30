import { describe, expect, it } from "vitest";

import { activityStatusLabelOf } from "./UsersDashboard";

/**
 * Resolver de rotulo do activity_status, no molde do notificationTypeMetaOf.
 *
 * O acesso direto `ACTIVITY_STATUS_LABELS[detail.activity_status]` era a mesma
 * forma que ja derrubou o admin em producao com
 * `Cannot read properties of undefined (reading 'label')`: basta o servidor
 * passar a devolver um valor que o bundle em execucao ainda nao conhece. O
 * frontend nao e redeployado junto com o backend, entao essa janela existe em
 * todo deploy.
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
    expect(activityStatusLabelOf(null)).toBe("Não informado");
    expect(activityStatusLabelOf(undefined)).toBe("Não informado");
  });

  it("string vazia tambem e campo vazio, nao rotulo vazio", () => {
    expect(activityStatusLabelOf("")).toBe("Não informado");
  });
});
