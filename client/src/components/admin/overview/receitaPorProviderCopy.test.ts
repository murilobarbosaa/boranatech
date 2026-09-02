import { describe, expect, it } from "vitest";

import { detalheDeReceitaPorProvider } from "./receitaPorProviderCopy";

const fmt = (cents: number) =>
  (cents / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });

describe("detalheDeReceitaPorProvider", () => {
  it("dois provedores com receita: a linha aparece, na ordem recebida", () => {
    const linha = detalheDeReceitaPorProvider(
      [
        { provider: "asaas", brutaCents: 1290 },
        { provider: "stripe", brutaCents: 2990 },
      ],
      fmt,
    );

    expect(linha).toContain("Pix");
    expect(linha).toContain("Stripe");
    expect(linha).toContain("12,90");
    expect(linha).toContain("29,90");
  });

  it("BACKEND ANTIGO (campo ausente): null, nunca 'undefined'", () => {
    // Janela de deploy: a Vercel sobe antes do Railway.
    expect(detalheDeReceitaPorProvider(undefined, fmt)).toBeNull();
    expect(detalheDeReceitaPorProvider(null, fmt)).toBeNull();
  });

  it("um provedor so: null, porque a quebra nao diz nada", () => {
    // "Stripe R$ 29,90" ao lado de um total identico e ruido.
    expect(
      detalheDeReceitaPorProvider([{ provider: "stripe", brutaCents: 2990 }], fmt),
    ).toBeNull();
  });

  it("lista vazia e periodo sem receita: null", () => {
    expect(detalheDeReceitaPorProvider([], fmt)).toBeNull();
    expect(
      detalheDeReceitaPorProvider(
        [
          { provider: "stripe", brutaCents: 0 },
          { provider: "asaas", brutaCents: 0 },
        ],
        fmt,
      ),
    ).toBeNull();
  });

  it("provedor com ZERO some da frase, e o outro sozinho a cancela", () => {
    // "Pix R$ 0,00" faria alguem procurar um pagamento que nao existe.
    expect(
      detalheDeReceitaPorProvider(
        [
          { provider: "stripe", brutaCents: 2990 },
          { provider: "asaas", brutaCents: 0 },
        ],
        fmt,
      ),
    ).toBeNull();
  });

  it("provedor DESCONHECIDO entra com o codigo cru, sem quebrar", () => {
    const linha = detalheDeReceitaPorProvider(
      [
        { provider: "stripe", brutaCents: 2990 },
        { provider: "mercadopago", brutaCents: 500 },
      ],
      fmt,
    );

    expect(linha).toContain("mercadopago");
    expect(linha).toContain("Stripe");
  });

  it("o separador e o mesmo do resto dos detalhes de card", () => {
    const linha = detalheDeReceitaPorProvider(
      [
        { provider: "stripe", brutaCents: 2990 },
        { provider: "asaas", brutaCents: 1290 },
      ],
      fmt,
    );
    expect(linha).toContain(" · ");
  });
});
