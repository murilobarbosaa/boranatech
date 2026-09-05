import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";

/**
 * Lote 03 D: o projeto Pro passa a APARECER na lista para quem nao assina,
 * travado.
 *
 * O que este teste protege e a metade que a mudanca poe em risco: tornar o
 * card visivel nao pode tornar o CONTEUDO visivel. As tres formas de vazar
 * sao (1) o painel v1 renderizar mesmo travado, (2) o cabecalho continuar
 * clicavel e abrir, (3) o loader do detalhe v2 baixar o modulo pago. As tres
 * estao afirmadas aqui, e a terceira nao daria para ver no DOM.
 *
 * `filtrarPorEstado` (o filtro de estado do mesmo commit) e puro e esta
 * coberto em client/src/lib/projectState.test.ts.
 */

const assinatura = vi.hoisted(() => ({ isPro: false, loading: false }));
const rota = vi.hoisted(() => ({ id: undefined as string | undefined }));
const v2 = vi.hoisted(() => ({ loadProjetoV2: vi.fn() }));

const { PRO, GRATIS } = vi.hoisted(() => ({
  PRO: {
    id: "projeto-pro",
    nome: "Desafio Pago",
    areaSlug: "frontend",
    subareaSlug: null,
    nivel: "Avançado",
    objetivo: "Objetivo do desafio pago",
    ferramentas: ["React"],
    passosSimplificados: ["PASSO-SECRETO-DO-PRO"],
    entregavel: "ENTREGAVEL-SECRETO-DO-PRO",
    comoPublicar: "Vercel",
    sugestaoLinkedIn: "post pro",
    proximoProjeto: "outro",
    pro: true,
  },
  GRATIS: {
    id: "projeto-gratis",
    nome: "Desafio Aberto",
    areaSlug: "frontend",
    subareaSlug: null,
    nivel: "Iniciante",
    objetivo: "Objetivo do desafio aberto",
    ferramentas: ["HTML"],
    passosSimplificados: ["PASSO-DO-GRATIS"],
    entregavel: "entregavel gratis",
    comoPublicar: "GitHub Pages",
    sugestaoLinkedIn: "post gratis",
    proximoProjeto: "outro",
  },
}));

// `areasTI` entra vazio de proposito: quem resolve rotulo de area e
// labelForProjectArea, que tem teste proprio. Aqui o que importa e o card.
vi.mock("@/lib/data", () => ({ projetos: [PRO, GRATIS], areasTI: [] }));

vi.mock("@shared/projects/v2", () => ({
  // Os dois sao v2 de proposito: se o loader fosse chamado por engano, o
  // projeto pago seria o caso que vaza.
  isProjetoV2: () => true,
  loadProjetoV2: v2.loadProjetoV2,
}));

vi.mock("@/contexts/SubscriptionContext", () => ({
  useSubscription: () => assinatura,
}));

vi.mock("@/hooks/useProjectCompletion", () => ({
  useProjectCompletion: () => ({
    done: new Set<string>(),
    stages: new Map<string, Record<string, string>>(),
    ready: true,
    toggle: vi.fn(),
    toggleStage: vi.fn(),
  }),
}));

vi.mock("@/services/projectValidationService", () => ({
  listProjectValidations: vi.fn(async () => []),
}));

vi.mock("@/components/Layout", () => ({
  default: ({ children }: { children?: unknown }) => (
    <div>{children as never}</div>
  ),
}));
vi.mock("@/components/SEO", () => ({ default: () => null }));
vi.mock("@/components/FavoriteButton", () => ({ default: () => null }));
vi.mock("@/components/projects/ProjectValidationBlock", () => ({
  default: () => null,
}));

vi.mock("wouter", () => ({
  useParams: () => ({ id: rota.id }),
  useSearch: () => "",
  Link: ({ children, href }: { children?: unknown; href?: string }) => (
    <a href={href}>{children as never}</a>
  ),
}));

import Projetos from "@/pages/Projetos";

afterEach(cleanup);
beforeEach(() => {
  assinatura.isPro = false;
  assinatura.loading = false;
  rota.id = undefined;
  v2.loadProjetoV2.mockReset();
  v2.loadProjetoV2.mockResolvedValue(null);
});

function cabecalhoDe(nome: string): HTMLElement {
  const h = screen.getByText(nome).closest("div[class*='flex w-full']");
  if (!h) throw new Error(`cabecalho nao encontrado: ${nome}`);
  return h as HTMLElement;
}

describe("Projetos, projeto Pro para quem nao assina", () => {
  it("mostra o card do projeto pro na lista", () => {
    render(<Projetos />);
    expect(screen.getByText("Desafio Pago")).toBeTruthy();
    expect(screen.getByText("Objetivo do desafio pago")).toBeTruthy();
  });

  it("nao coloca nenhum campo do detalhe pago no DOM", () => {
    const { container } = render(<Projetos />);
    expect(container.innerHTML).not.toContain("PASSO-SECRETO-DO-PRO");
    expect(container.innerHTML).not.toContain("ENTREGAVEL-SECRETO-DO-PRO");
  });

  it("o cabecalho travado nao e clicavel e clicar nele nao abre nada", () => {
    const { container } = render(<Projetos />);
    const header = cabecalhoDe("Desafio Pago");
    expect(header.getAttribute("role")).toBeNull();
    expect(header.getAttribute("aria-expanded")).toBeNull();
    fireEvent.click(header);
    expect(container.innerHTML).not.toContain("PASSO-SECRETO-DO-PRO");
  });

  it("nunca chama loadProjetoV2 para projeto travado", () => {
    render(<Projetos />);
    fireEvent.click(cabecalhoDe("Desafio Pago"));
    expect(v2.loadProjetoV2).not.toHaveBeenCalled();
  });

  it("trava enquanto o status Pro nao resolveu", () => {
    assinatura.loading = true;
    const { container } = render(<Projetos />);
    expect(cabecalhoDe("Desafio Pago").getAttribute("role")).toBeNull();
    expect(container.innerHTML).not.toContain("PASSO-SECRETO-DO-PRO");
  });

  it("o projeto gratuito continua abrindo normalmente", () => {
    render(<Projetos />);
    const header = cabecalhoDe("Desafio Aberto");
    expect(header.getAttribute("role")).toBe("button");
    fireEvent.click(header);
    expect(v2.loadProjetoV2).toHaveBeenCalledWith("projeto-gratis");
  });
});

describe("Projetos, deep link para projeto Pro", () => {
  it("abre o card travado em vez do aviso de projeto nao encontrado", () => {
    rota.id = "projeto-pro";
    const { container } = render(<Projetos />);
    expect(screen.getByText("Desafio Pago")).toBeTruthy();
    expect(container.innerHTML).not.toContain("Não encontramos esse projeto");
    expect(container.innerHTML).not.toContain("PASSO-SECRETO-DO-PRO");
  });
});

describe("Projetos, projeto Pro para quem assina", () => {
  it("abre o card pro e carrega o detalhe", () => {
    assinatura.isPro = true;
    render(<Projetos />);
    const header = cabecalhoDe("Desafio Pago");
    expect(header.getAttribute("role")).toBe("button");
    fireEvent.click(header);
    expect(v2.loadProjetoV2).toHaveBeenCalledWith("projeto-pro");
  });
});
