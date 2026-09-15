import { describe, expect, it } from "vitest";

import { nomeDaConcessao } from "./creatorConcessao";

describe("nomeDaConcessao", () => {
  it("os dois kinds conhecidos, em minuscula para ir no meio da frase", () => {
    expect(nomeDaConcessao("influencer")).toBe("influencer");
    expect(nomeDaConcessao("afiliado")).toBe("afiliado");
  });

  it("kind desconhecido ou ausente vira creator, nunca um tipo inventado", () => {
    expect(nomeDaConcessao("embaixador")).toBe("creator");
    expect(nomeDaConcessao("")).toBe("creator");
    expect(nomeDaConcessao(null)).toBe("creator");
    expect(nomeDaConcessao(undefined)).toBe("creator");
  });

  it("chave do prototipo nao vaza para a frase", () => {
    expect(nomeDaConcessao("toString")).toBe("creator");
    expect(nomeDaConcessao("constructor")).toBe("creator");
  });
});
