import { describe, expect, it } from "vitest";
import { TRAIL_PALETTE, tagPaletteOf, trailPaletteOf } from "./tagPalette";

describe("trailPaletteOf: paleta dos cards de trilha na vitrine", () => {
  it("slug conhecido sai com o par pastel literal", () => {
    expect(trailPaletteOf("javascript")).toEqual({
      bg: "bg-amber-200",
      text: "text-amber-900",
    });
    expect(trailPaletteOf("python")).toEqual({
      bg: "bg-sky-200",
      text: "text-sky-900",
    });
    expect(trailPaletteOf("git")).toEqual({
      bg: "bg-orange-200",
      text: "text-orange-900",
    });
    expect(trailPaletteOf("html")).toEqual({
      bg: "bg-rose-200",
      text: "text-rose-900",
    });
    expect(trailPaletteOf("css")).toEqual({
      bg: "bg-purple-200",
      text: "text-purple-900",
    });
    expect(trailPaletteOf("typescript")).toEqual({
      bg: "bg-blue-200",
      text: "text-blue-900",
    });
  });

  it("trilha sem entrada cai no teal e continua com par legivel", () => {
    const teal = { bg: "bg-teal-200", text: "text-teal-900" };
    expect(trailPaletteOf("docker")).toEqual(teal);
    // Chave herdada de Object nao pode virar paleta.
    expect(trailPaletteOf("toString")).toEqual(teal);
  });

  it("todo par do mapa e literal no formato bg-<familia>-200 / text-<familia>-900", () => {
    for (const palette of Object.values(TRAIL_PALETTE)) {
      const familia = /^bg-([a-z]+)-200$/.exec(palette.bg)?.[1];
      expect(familia).toBeTruthy();
      expect(palette.text).toBe(`text-${familia}-900`);
    }
  });

  it("o mapa das areas continua fechado: trilha nao vira tag_class", () => {
    expect(tagPaletteOf("javascript")).toEqual({
      bg: "bg-slate-200",
      text: "text-slate-900",
    });
  });
});
