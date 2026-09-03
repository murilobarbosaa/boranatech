import { describe, expect, it } from "vitest";

import { areasTI } from "@/lib/data";
import {
  labelForProjectArea,
  labelForProjectSubarea,
  normalizeProjectAreaParam,
} from "@/lib/projectAreaGroup";
import { projetos } from "@shared/projects/catalog";

// Guard do invariante "areaSlug e SEMPRE area-mae" do catalogo de projetos.
//
// Verifica nos DOIS sentidos, porque "o que declarei existe?" e "o que existe
// esta declarado?" sao perguntas diferentes: o item 1 pergunta se todo
// areaSlug e uma area conhecida, e o item 3 pergunta se algum areaSlug e, na
// verdade, slug de subarea. Um catalogo pode passar no primeiro e falhar no
// segundo se alguem cadastrar a subarea tambem como area.
//
// As mensagens de falha listam os slugs ofensores por nome. Guard que so diz
// "esperava 0, recebeu 40" obriga quem quebrou a refazer a medicao a mao.

const AREA_SLUGS = new Set(areasTI.map((a) => a.slug));
// Area-mae valida = area de areasTI ou o especial `carreira` (agrupamento
// editorial, ver projectAreaGroup.ts).
const PARENT_SLUGS = new Set(Array.from(AREA_SLUGS).concat(["carreira"]));

const SUB_TO_PARENT = new Map<string, string>();
for (const area of areasTI)
  for (const sub of area.subareas ?? []) SUB_TO_PARENT.set(sub.slug, area.slug);

describe("catalogo de projetos: areaSlug e sempre area-mae", () => {
  it("1. todo areaSlug esta em {slugs de areasTI} uniao {carreira}", () => {
    const fora = Array.from(
      new Set(
        projetos
          .map((p) => p.areaSlug)
          .filter((s): s is string => s !== null && !PARENT_SLUGS.has(s)),
      ),
    ).sort();
    expect(
      fora,
      `areaSlug que nao sao area-mae (${fora.length}): ${fora.join(", ")}`,
    ).toEqual([]);
  });

  it("2. todo subareaSlug existe sob o areaSlug do proprio projeto", () => {
    const invalidos = projetos
      .filter((p) => p.subareaSlug !== undefined)
      .filter(
        (p) =>
          labelForProjectSubarea(p.areaSlug, p.subareaSlug) === null ||
          SUB_TO_PARENT.get(p.subareaSlug as string) !== p.areaSlug,
      )
      .map((p) => `${p.id}: subareaSlug=${p.subareaSlug} areaSlug=${p.areaSlug}`)
      .sort();
    expect(
      invalidos,
      `subareaSlug que nao e filha do areaSlug (${invalidos.length}): ${invalidos.join(" | ")}`,
    ).toEqual([]);
  });

  it("3. nenhum areaSlug do catalogo e slug de subarea de qualquer area", () => {
    const subareaComoArea = Array.from(
      new Set(
        projetos
          .map((p) => p.areaSlug)
          .filter((s): s is string => s !== null && SUB_TO_PARENT.has(s)),
      ),
    )
      .sort()
      .map((s) => `${s} (subarea de ${SUB_TO_PARENT.get(s)})`);
    expect(
      subareaComoArea,
      `areaSlug que sao slug de subarea (${subareaComoArea.length}): ${subareaComoArea.join(", ")}`,
    ).toEqual([]);
  });

  it("4. labelForProjectArea nunca devolve o proprio slug nem o fallback", () => {
    const crus = Array.from(
      new Set(
        projetos
          .map((p) => p.areaSlug)
          .filter((s): s is string => s !== null)
          .filter((s) => {
            const label = labelForProjectArea(s);
            return label === s || label === "Outras áreas";
          }),
      ),
    ).sort();
    expect(
      crus,
      `areaSlug que chegam crus ao cabecalho da pagina (${crus.length}): ${crus.join(", ")}`,
    ).toEqual([]);
  });

  it("5. normalizeProjectAreaParam mapeia subarea para a area-mae", () => {
    expect(normalizeProjectAreaParam("qa-automacao")).toBe("qa");
    expect(normalizeProjectAreaParam("qa")).toBe("qa");
    expect(normalizeProjectAreaParam("carreira")).toBe("carreira");
    expect(normalizeProjectAreaParam("nao-existe")).toBe("nao-existe");
  });
});
