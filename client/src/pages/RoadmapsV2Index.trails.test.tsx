import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, within } from "@testing-library/react";

/**
 * VITRINE /roadmaps: grupos de trilha de linguagem e de ferramenta (Lote 03).
 *
 * Os grupos saem de trailGroups, derivado do meta: o teste usa o meta real,
 * entao afirma o estado do registro de hoje (JavaScript e Python em
 * linguagens, Git em ferramentas) e quebra se uma trilha registrada sumir da
 * vitrine. Tambem afirma a ordem curada da vitrine (carreiras, linguagens,
 * ferramentas e as areas por ultimo, Lote 03b) e que o card de carreira nao
 * mudou.
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
    whileInView: _v,
    viewport: _p,
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

import RoadmapsV2Index from "./RoadmapsV2Index";

afterEach(() => cleanup());

function grupo(container: HTMLElement, chave: string): HTMLElement {
  const el = container.querySelector<HTMLElement>(
    `[data-testid="vitrine-grupo-${chave}"]`,
  );
  if (!el) throw new Error(`grupo ${chave} ausente`);
  return el;
}

function links(el: HTMLElement): string[] {
  return Array.from(el.querySelectorAll("a")).map(
    (a) => a.getAttribute("href") ?? "",
  );
}

describe("vitrine /roadmaps: grupos de trilha de linguagem e de ferramenta", () => {
  it("os dois grupos saem com titulo e linha de apoio", () => {
    const { container } = render(<RoadmapsV2Index />);
    const linguagens = within(grupo(container, "linguagem"));
    expect(
      linguagens.getByRole("heading", { name: "Linguagens de programação" }),
    ).toBeTruthy();
    expect(
      linguagens.getByText(
        "Aprenda do zero, passo a passo, com provas e certificado.",
      ),
    ).toBeTruthy();
    const ferramentas = within(grupo(container, "ferramenta"));
    expect(
      ferramentas.getByRole("heading", { name: "Ferramentas" }),
    ).toBeTruthy();
    expect(
      ferramentas.getByText(
        "O que todo dev usa no dia a dia, do primeiro comando ao fluxo completo.",
      ),
    ).toBeTruthy();
  });

  it("3 cards, com os links certos e na ordem do registro", () => {
    const { container } = render(<RoadmapsV2Index />);
    // Lote 08: HTML entrou no grupo de linguagens, depois de Python.
    expect(links(grupo(container, "linguagem"))).toEqual([
      "/roadmaps/javascript",
      "/roadmaps/python",
      "/roadmaps/html",
    ]);
    // Lote 08: o card de HTML vem depois do de Python, na ordem do registro.
    const linguagens = links(grupo(container, "linguagem"));
    expect(linguagens.indexOf("/roadmaps/html")).toBe(
      linguagens.indexOf("/roadmaps/python") + 1,
    );
    expect(links(grupo(container, "ferramenta"))).toEqual(["/roadmaps/git"]);
  });

  it("o card traz o resumo, as contagens do meta e o selo de prova", () => {
    const { container } = render(<RoadmapsV2Index />);
    const git = container.querySelector<HTMLElement>('a[href="/roadmaps/git"]');
    if (!git) throw new Error("card git ausente");
    const card = within(git);
    expect(card.getByText("Git do Zero")).toBeTruthy();
    expect(
      card.getByText(
        "Versionamento do init ao pull request, direto no terminal.",
      ),
    ).toBeTruthy();
    expect(card.getByText("10 etapas")).toBeTruthy();
    expect(card.getByText("44 passos")).toBeTruthy();
    for (const slug of ["javascript", "python", "git", "html"]) {
      const a = container.querySelector<HTMLElement>(
        `a[href="/roadmaps/${slug}"]`,
      );
      expect(a && within(a).queryByText("Com prova")).toBeTruthy();
    }
  });

  it("ordem curada: carreiras, linguagens, ferramentas e as areas por ultimo", () => {
    const { container, getByRole } = render(<RoadmapsV2Index />);
    const carreiras = getByRole("heading", { name: "Trilhas de carreira" });
    const linguagens = grupo(container, "linguagem");
    const ferramentas = grupo(container, "ferramenta");
    const areas = grupo(container, "area");
    expect(
      carreiras.compareDocumentPosition(linguagens) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(
      linguagens.compareDocumentPosition(ferramentas) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    // Lote 03b: as areas deixaram de abrir a pagina e passaram a fecha-la.
    expect(
      ferramentas.compareDocumentPosition(areas) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it("o card de carreira nao mudou: fundo solido e icone branco", () => {
    const { container } = render(<RoadmapsV2Index />);
    const link = container.querySelector('a[href="/roadmaps/comecar-do-zero"]');
    const quadrado = link?.querySelector("span.h-9");
    expect(quadrado?.classList.contains("bg-emerald-500")).toBe(true);
    expect(quadrado?.querySelector("svg")?.getAttribute("class")).toContain(
      "text-white",
    );
  });
});
