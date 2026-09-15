import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  act,
  cleanup,
  fireEvent,
  render,
  within,
} from "@testing-library/react";

/**
 * VITRINE /roadmaps: seletor por grupo e ordem curada (Lote 03b).
 *
 * Filtro, nao ancora: o estado mora na URL (?grupo=), lido no load para o link
 * ser compartilhavel. Ordem do Todos: carreiras, linguagens, ferramentas e as
 * areas fechando a pagina.
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

const ORDEM = ["carreira", "linguagem", "ferramenta", "area"];
const BARRA = "Filtrar trilhas por grupo";

function irPara(url: string) {
  window.history.replaceState({}, "", url);
}

function blocos(container: HTMLElement): string[] {
  return Array.from(
    container.querySelectorAll<HTMLElement>('[data-testid^="vitrine-grupo-"]'),
  ).map((el) => (el.dataset.testid ?? "").replace("vitrine-grupo-", ""));
}

beforeEach(() => irPara("/roadmaps"));
afterEach(() => {
  cleanup();
  irPara("/");
});

describe("seletor da vitrine /roadmaps", () => {
  it("default Todos: os 4 blocos na ordem nova e a pilula Todos pressionada", () => {
    const { container, getByRole } = render(<RoadmapsV2Index />);
    expect(blocos(container)).toEqual(ORDEM);
    const barra = within(getByRole("group", { name: BARRA }));
    expect(barra.getAllByRole("button").map((b) => b.textContent)).toEqual([
      "Todos",
      "Carreiras",
      "Linguagens",
      "Ferramentas",
      "Áreas",
    ]);
    expect(
      barra.getByRole("button", { name: "Todos" }).getAttribute("aria-pressed"),
    ).toBe("true");
  });

  it("cada pilula filtra para o seu grupo, com titulo, e grava ?grupo= na URL", () => {
    const casos: [string, string, string, string][] = [
      ["Carreiras", "carreira", "carreiras", "Trilhas de carreira"],
      ["Linguagens", "linguagem", "linguagens", "Linguagens de programação"],
      ["Ferramentas", "ferramenta", "ferramentas", "Ferramentas"],
      ["Áreas", "area", "areas", "Trilhas por área"],
    ];
    for (const [rotulo, bloco, param, titulo] of casos) {
      irPara("/roadmaps");
      const { container, getByRole } = render(<RoadmapsV2Index />);
      const barra = within(getByRole("group", { name: BARRA }));
      act(() => {
        fireEvent.click(barra.getByRole("button", { name: rotulo }));
      });
      expect(blocos(container)).toEqual([bloco]);
      expect(window.location.search).toBe(`?grupo=${param}`);
      expect(
        barra
          .getByRole("button", { name: rotulo })
          .getAttribute("aria-pressed"),
      ).toBe("true");
      expect(
        barra
          .getByRole("button", { name: "Todos" })
          .getAttribute("aria-pressed"),
      ).toBe("false");
      const secao = container.querySelector<HTMLElement>(
        `[data-testid="vitrine-grupo-${bloco}"]`,
      );
      expect(
        secao && within(secao).getByRole("heading", { name: titulo }),
      ).toBeTruthy();
      cleanup();
    }
  });

  it("?grupo=linguagens no load abre filtrado, com a pilula ativa", () => {
    irPara("/roadmaps?grupo=linguagens");
    const { container, getByRole } = render(<RoadmapsV2Index />);
    expect(blocos(container)).toEqual(["linguagem"]);
    const barra = within(getByRole("group", { name: BARRA }));
    expect(
      barra
        .getByRole("button", { name: "Linguagens" })
        .getAttribute("aria-pressed"),
    ).toBe("true");
  });

  it("Todos limpa o parametro e volta a ordem completa", () => {
    irPara("/roadmaps?grupo=linguagens");
    const { container, getByRole } = render(<RoadmapsV2Index />);
    act(() => {
      fireEvent.click(
        within(getByRole("group", { name: BARRA })).getByRole("button", {
          name: "Todos",
        }),
      );
    });
    expect(blocos(container)).toEqual(ORDEM);
    expect(window.location.search).toBe("");
  });

  it("?grupo desconhecido cai no Todos", () => {
    irPara("/roadmaps?grupo=xyz");
    const { container } = render(<RoadmapsV2Index />);
    expect(blocos(container)).toEqual(ORDEM);
  });
});
