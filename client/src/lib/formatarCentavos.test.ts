import { describe, expect, it } from "vitest";

import { formatarCentavos } from "./formatarCentavos";

// O espaco entre "R$" e o numero e o NBSP (U+00A0) que o Intl pt-BR produz,
// escrito como escape para ficar visivel: um espaco comum no literal falharia
// sem que o motivo aparecesse na tela.
describe("formatarCentavos", () => {
  it("formata centavos como reais, com duas casas", () => {
    expect(formatarCentavos(0)).toBe("R$\u00a00,00");
    expect(formatarCentavos(2093)).toBe("R$\u00a020,93");
    expect(formatarCentavos(6279)).toBe("R$\u00a062,79");
  });

  it("null e ausencia de valor, nunca zero", () => {
    expect(formatarCentavos(null)).toBe("valor não registrado");
  });
});
