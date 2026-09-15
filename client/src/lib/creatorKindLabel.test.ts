import { describe, expect, it } from "vitest";

import { rotuloDoKind } from "./creatorKindLabel";

describe("rotuloDoKind", () => {
  it("os dois kinds conhecidos", () => {
    expect(rotuloDoKind("influencer")).toBe("Influencer");
    expect(rotuloDoKind("afiliado")).toBe("Afiliado");
  });

  it("kind desconhecido ou ausente cai em Creator, nunca num tipo inventado", () => {
    expect(rotuloDoKind("embaixador")).toBe("Creator");
    expect(rotuloDoKind("")).toBe("Creator");
    expect(rotuloDoKind(null)).toBe("Creator");
    expect(rotuloDoKind(undefined)).toBe("Creator");
  });

  it("chave do prototipo nao vaza como rotulo", () => {
    expect(rotuloDoKind("toString")).toBe("Creator");
    expect(rotuloDoKind("constructor")).toBe("Creator");
  });
});
