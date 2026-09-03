import { describe, expect, it } from "vitest";

import { projetos } from "./catalog";
import {
  PROJECT_ID_ALIASES,
  aliasesOf,
  dedupeByCanonicalId,
  resolveProjectId,
} from "./aliases";

// Guard do mapa de alias. Afirma o TOTAL e os DOIS SENTIDOS, nao a
// pertinencia: "os que eu conheco estao la" passaria com o mapa pela metade.
// Alterar o numero 54 e ato deliberado, no mesmo commit que muda o mapa.

const VIVOS = new Set(projetos.map((p) => p.id));

describe("aliases de id de projeto", () => {
  it("1. o mapa tem exatamente 54 entradas", () => {
    expect(Object.keys(PROJECT_ID_ALIASES).length).toBe(54);
  });

  it("2. todo valor e id vivo do catalogo", () => {
    const mortos = Array.from(
      new Set(Object.values(PROJECT_ID_ALIASES).filter((v) => !VIVOS.has(v))),
    ).sort();
    expect(
      mortos,
      `alvos de alias que nao existem no catalogo (${mortos.length}): ${mortos.join(", ")}`,
    ).toEqual([]);
  });

  it("3. nenhuma chave e id vivo do catalogo", () => {
    const aindaVivos = Object.keys(PROJECT_ID_ALIASES)
      .filter((k) => VIVOS.has(k))
      .sort();
    expect(
      aindaVivos,
      `ids que sao alias E continuam no catalogo (${aindaVivos.length}): ${aindaVivos.join(", ")}`,
    ).toEqual([]);
  });

  it("4. nenhuma chave aparece como valor (mapa raso, sem cadeia)", () => {
    const valores = new Set(Object.values(PROJECT_ID_ALIASES));
    const cadeias = Object.keys(PROJECT_ID_ALIASES)
      .filter((k) => valores.has(k))
      .sort();
    expect(
      cadeias,
      `chaves que tambem sao alvo, formando cadeia (${cadeias.length}): ${cadeias.join(", ")}`,
    ).toEqual([]);
  });

  it("5. aliasesOf e a inversa exata do mapa", () => {
    // Reconstroi o mapa a partir do indice reverso e compara. Um alvo que o
    // reverso esquecesse sumiria aqui.
    const reconstruido: Record<string, string> = {};
    for (const canonico of Array.from(new Set(Object.values(PROJECT_ID_ALIASES))))
      for (const antigo of aliasesOf(canonico)) reconstruido[antigo] = canonico;
    expect(reconstruido).toEqual(PROJECT_ID_ALIASES);
    // E o inverso: id sem alias devolve lista vazia, nao undefined.
    expect(aliasesOf("landing-page-pessoal")).toContain(
      "portfolio-pessoal-html-css",
    );
    expect(aliasesOf("id-que-nao-existe")).toEqual([]);
  });

  it("6. resolveProjectId traduz alias e devolve o proprio nos demais casos", () => {
    expect(resolveProjectId("portfolio-pessoal-html-css")).toBe(
      "landing-page-pessoal",
    );
    expect(resolveProjectId("landing-page-pessoal")).toBe(
      "landing-page-pessoal",
    );
    expect(resolveProjectId("id-que-nao-existe")).toBe("id-que-nao-existe");
  });

  it("7. dedupeByCanonicalId colapsa mantendo a primeira ocorrencia", () => {
    type Linha = { id: string; marca: string };
    const linhas: Linha[] = [
      { id: "portfolio-pessoal-html-css", marca: "antiga" },
      { id: "landing-page-pessoal", marca: "nova" },
      { id: "todo-list", marca: "outra" },
    ];
    const saida = dedupeByCanonicalId(
      linhas,
      (r) => r.id,
      (r, id) => ({ ...r, id }),
    );
    // A primeira ocorrencia vence e ja sai com o id canonico reescrito.
    expect(saida).toEqual([
      { id: "landing-page-pessoal", marca: "antiga" },
      { id: "todo-list", marca: "outra" },
    ]);
  });

  it("7b. dedupeByCanonicalId com [novo, antigo] mantem o novo", () => {
    type Linha = { id: string; marca: string };
    const saida = dedupeByCanonicalId(
      [
        { id: "landing-page-pessoal", marca: "nova" },
        { id: "portfolio-pessoal-html-css", marca: "antiga" },
      ] as Linha[],
      (r) => r.id,
      (r, id) => ({ ...r, id }),
    );
    expect(saida).toEqual([{ id: "landing-page-pessoal", marca: "nova" }]);
  });
});
