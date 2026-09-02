import { describe, expect, it } from "vitest";

import { providerLabelOf, providerMetaOf } from "./providerMeta";

/**
 * O QUE ESTE ARQUIVO TRAVA e a REGRA de fallback, nao os dois rotulos que
 * existem hoje. `provider` vem do servidor, e o defeito que este resolver
 * existe para nao repetir derrubou o admin em producao com "Cannot read
 * properties of undefined (reading 'label')": bastou o banco ganhar um valor
 * que o bundle em execucao nao conhecia.
 */

describe("providerMetaOf", () => {
  it("os dois provedores conhecidos", () => {
    expect(providerLabelOf("stripe")).toBe("Stripe");
    // O provedor e o Asaas; o que a pessoa ve e o meio de pagamento.
    expect(providerLabelOf("asaas")).toBe("Pix");
  });

  it("provedor DESCONHECIDO mostra o codigo cru, e NAO quebra", () => {
    const meta = providerMetaOf("mercadopago");
    expect(meta.label).toBe("mercadopago");
    expect(meta.conhecido).toBe(false);
  });

  it.each([
    ["null", null],
    ["undefined", undefined],
  ])("%s cai em stripe, o default da coluna", (_rotulo, entrada) => {
    // Linha gravada entre a migration e o deploy do codigo que escreve a
    // coluna: ela e da Stripe por construcao.
    expect(providerLabelOf(entrada)).toBe("Stripe");
    expect(providerMetaOf(entrada).conhecido).toBe(true);
  });

  it("NUNCA devolve undefined, para nenhuma entrada", () => {
    for (const v of ["", "  ", "STRIPE", "asaas ", "x"]) {
      expect(providerMetaOf(v)).toBeDefined();
      expect(typeof providerMetaOf(v).label).toBe("string");
    }
  });

  it("a comparacao e EXATA: maiuscula nao casa e vira desconhecido", () => {
    // Declarado em vez de normalizado: o CHECK do banco so aceita minusculas,
    // entao um "STRIPE" chegando aqui e sinal de outro problema, e escondê-lo
    // com um toLowerCase apagaria o sinal.
    expect(providerMetaOf("STRIPE").conhecido).toBe(false);
  });
});
