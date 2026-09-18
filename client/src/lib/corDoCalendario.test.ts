import { describe, expect, it } from "vitest";

import { CORES_DO_CALENDARIO } from "@shared/creatorProfile";
import { classeDoMarcador, MARCADOR_DA_COR } from "./corDoCalendario";

/**
 * O mapa de classes do marcador (lote 10c) e LITERAL de proposito, e este
 * teste e o que impede a lista do shared e o mapa do client de divergirem em
 * silencio: uma cor nova no shared sem classe aqui cairia no fallback e o
 * creator escolheria uma cor que a grade desenha em violeta.
 */
describe("MARCADOR_DA_COR", () => {
  it("tem exatamente as 15 chaves de CORES_DO_CALENDARIO", () => {
    expect(Object.keys(MARCADOR_DA_COR).sort()).toEqual(
      [...CORES_DO_CALENDARIO].sort(),
    );
    expect(CORES_DO_CALENDARIO).toHaveLength(15);
  });

  it("cada valor tem fundo pastel da propria familia e a borda de tinta", () => {
    for (const cor of CORES_DO_CALENDARIO) {
      const classes = MARCADOR_DA_COR[cor];
      expect(classes, cor).toContain(`bg-${cor}-200`);
      expect(classes, cor).toContain("border-");
      expect(classes, cor).toContain("border-slate-900");
      // Sem `dark:`: a inversao e da folha de estilo, nao da classe.
      expect(classes, cor).not.toContain("dark:");
    }
  });
});

describe("classeDoMarcador", () => {
  it("cor conhecida devolve o par dela; desconhecida ou ausente cai no violeta", () => {
    expect(classeDoMarcador("emerald")).toBe(MARCADOR_DA_COR.emerald);
    expect(classeDoMarcador("magenta")).toBe(MARCADOR_DA_COR.violet);
    expect(classeDoMarcador(null)).toBe(MARCADOR_DA_COR.violet);
    expect(classeDoMarcador(undefined)).toBe(MARCADOR_DA_COR.violet);
  });
});
