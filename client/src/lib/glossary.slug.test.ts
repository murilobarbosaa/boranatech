import { describe, expect, it } from "vitest";

import { getGlossaryTerm, normalizeTermKey } from "@/lib/glossary";
import { dictionaryTerms } from "@/lib/platformData";

/**
 * A ancora do dicionario (`id="termo-<slug>"`) usa `normalizeTermKey`, a MESMA
 * funcao que resolve `?termo=`. Se as duas divergissem, o link levaria a pagina
 * certa e rolaria para lugar nenhum.
 */
describe("normalizeTermKey como slug de ancora", () => {
  it("tira acento, caixa e espaco", () => {
    expect(normalizeTermKey("Integração Contínua")).toBe("integracao-continua");
    expect(normalizeTermKey("  API  ")).toBe("api");
    expect(normalizeTermKey("Node.js")).toBe("node.js");
  });

  it("o slug do termo resolvido bate com o slug do proprio nome", () => {
    // E o que amarra a ancora: getGlossaryTerm("html") devolve a entrada cujo
    // id no DOM e `termo-${normalizeTermKey(item.term)}`.
    for (const item of dictionaryTerms.slice(0, 50)) {
      const entrada = getGlossaryTerm(item.term);
      expect(entrada, `termo sem entrada: ${item.term}`).not.toBeNull();
      expect(entrada!.slug).toBe(normalizeTermKey(entrada!.term));
    }
  });

  it("chave com acento ou caixa diferente acha a mesma entrada", () => {
    const alvo = dictionaryTerms.find((t) => /[áéíóúãõç]/i.test(t.term));
    if (!alvo) return;
    expect(getGlossaryTerm(alvo.term.toUpperCase())?.slug).toBe(
      normalizeTermKey(alvo.term),
    );
  });
});
