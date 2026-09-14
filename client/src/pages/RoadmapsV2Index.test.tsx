import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render } from "@testing-library/react";

/**
 * VITRINE /roadmaps: cor do quadrado do icone e da faixa dos cards de area.
 *
 * As 17 classes `.tag-*` sairam do index.css em 2026-09-01 (2dae5521) e esta
 * vitrine ficou de fora da migracao para tagPaletteOf: o quadrado e a faixa
 * ficaram sem fundo, e o icone branco sumiu em producao. O teste afirma que
 * todo card sai com classe de fundo de verdade, e que uma tag_class
 * desconhecida degrada para o neutro sem tirar a cor dos vizinhos.
 */
vi.mock("@/components/Layout", () => ({
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));
vi.mock("@/components/SEO", () => ({ default: () => null }));
vi.mock("@/contexts/AuthContext", () => ({ useAuth: () => ({ user: null }) }));
vi.mock("@/services/certificateService", () => ({
  getCertificateStatuses: vi.fn(async () => ({})),
}));
vi.mock("framer-motion", () => {
  const Plain = ({
    children,
    initial: _i,
    animate: _a,
    transition: _t,
    whileHover: _h,
    whileTap: _w,
    ...rest
  }: Record<string, unknown> & { children?: React.ReactNode }) => (
    <div {...(rest as Record<string, unknown>)}>{children}</div>
  );
  return {
    motion: new Proxy({}, { get: () => Plain }),
    AnimatePresence: ({ children }: { children?: React.ReactNode }) => (
      <>{children}</>
    ),
    useReducedMotion: () => true,
  };
});
vi.mock("@/lib/data", async (importOriginal) => {
  const real = await importOriginal<typeof import("@/lib/data")>();
  return {
    ...real,
    areasTI: real.areasTI.map((area) =>
      area.slug === "frontend"
        ? { ...area, tagClass: "tag-que-nao-existe" }
        : area,
    ),
  };
});

import RoadmapsV2Index from "./RoadmapsV2Index";

afterEach(() => cleanup());

function cardDe(container: HTMLElement, slug: string) {
  const link = container.querySelector(`a[href="/roadmaps/${slug}"]`);
  if (!link) throw new Error(`card ${slug} ausente`);
  const quadrado = link.querySelector("span.h-9");
  const faixa = link.querySelector("span.h-2");
  if (!quadrado || !faixa)
    throw new Error(`card ${slug} sem quadrado ou faixa`);
  return { quadrado, faixa, icone: quadrado.querySelector("svg") };
}

describe("vitrine /roadmaps: cor dos cards", () => {
  it("nenhum quadrado de icone usa classe .tag-* crua, que nao existe mais no CSS", () => {
    const { container } = render(<RoadmapsV2Index />);
    const quadrados = Array.from(
      container.querySelectorAll('a[href^="/roadmaps/"] span.h-9'),
    );
    expect(quadrados.length).toBeGreaterThan(0);
    quadrados.forEach((q) => {
      const classes = Array.from(q.classList);
      expect(classes.filter((c) => c.startsWith("tag-"))).toEqual([]);
      expect(classes.some((c) => /^bg-[a-z]+-\d{3}$/.test(c))).toBe(true);
    });
  });

  it("backend sai com o par da paleta do chip de area e icone escuro", () => {
    const { container } = render(<RoadmapsV2Index />);
    const { quadrado, faixa, icone } = cardDe(container, "backend");
    expect(quadrado.classList.contains("bg-green-200")).toBe(true);
    expect(faixa.classList.contains("bg-green-200")).toBe(true);
    expect(icone?.getAttribute("class")).toContain("text-green-900");
    expect(icone?.getAttribute("class")).not.toContain("text-white");
  });

  it("tag_class desconhecida degrada para o neutro e nao apaga os vizinhos", () => {
    const { container } = render(<RoadmapsV2Index />);
    expect(
      cardDe(container, "frontend").quadrado.classList.contains("bg-slate-200"),
    ).toBe(true);
    expect(
      cardDe(container, "backend").quadrado.classList.contains("bg-green-200"),
    ).toBe(true);
  });
});
