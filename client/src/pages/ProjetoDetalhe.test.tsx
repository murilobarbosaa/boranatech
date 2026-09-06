import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";

/**
 * A pagina propria do projeto (lote 03b).
 *
 * O que precisa ficar amarrado: o corpo v1 renderiza os blocos certos, o id
 * inexistente nao vira pagina em branco, o alias abre o projeto canonico, o
 * Pro travado NAO baixa o detalhe pago, e o SEO recebe nome e objetivo.
 */

const USUARIO_PRO = { valor: false };

const { PRO, GRATIS, ALIASADO, seo, v2 } = vi.hoisted(() => ({
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
    id: "landing-page-pessoal",
    nome: "Página Pessoal",
    areaSlug: "frontend",
    subareaSlug: null,
    nivel: "Iniciante",
    objetivo: "Criar uma página pessoal para apresentar quem você é.",
    ferramentas: ["HTML", "CSS"],
    passosSimplificados: ["Escreva o HTML", "Estilize com CSS"],
    entregavel: "Uma página no ar",
    comoPublicar: "GitHub Pages",
    sugestaoLinkedIn: "post gratis",
    proximoProjeto: "Texto livre do proximo",
  },
  ALIASADO: "portfolio-pessoal-html-css",
  seo: { props: [] as Record<string, unknown>[] },
  v2: { loadProjetoV2: vi.fn() },
}));

const rota = vi.hoisted(() => ({ id: "landing-page-pessoal" }));

vi.mock("@/lib/data", () => ({ projetos: [PRO, GRATIS], areasTI: [] }));
vi.mock("@shared/projects/v2", () => ({
  isProjetoV2: () => true,
  loadProjetoV2: v2.loadProjetoV2,
  PROJETOS_V2_IDS: ["landing-page-pessoal"],
}));
vi.mock("@/contexts/SubscriptionContext", () => ({
  useSubscription: () => ({ isPro: USUARIO_PRO.valor, loading: false }),
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
vi.mock("@/components/Layout", () => ({
  default: ({ children }: { children?: unknown }) => (
    <div>{children as never}</div>
  ),
}));
vi.mock("@/components/SEO", () => ({
  default: (props: Record<string, unknown>) => {
    seo.props.push(props);
    return null;
  },
}));
vi.mock("@/components/FavoriteButton", () => ({ default: () => null }));
vi.mock("@/components/projects/ProjectValidationBlock", () => ({
  default: () => null,
}));
vi.mock("wouter", () => ({
  useParams: () => ({ id: rota.id }),
  Link: ({ children, href }: { children?: unknown; href?: string }) => (
    <a href={href}>{children as never}</a>
  ),
}));

import ProjetoDetalhe from "@/pages/ProjetoDetalhe";

afterEach(cleanup);
beforeEach(() => {
  USUARIO_PRO.valor = false;
  rota.id = "landing-page-pessoal";
  seo.props.length = 0;
  v2.loadProjetoV2.mockReset();
  v2.loadProjetoV2.mockResolvedValue(null);
});

describe("corpo v1", () => {
  it("renderiza os blocos do projeto sem detalhe v2", () => {
    render(<ProjetoDetalhe />);
    expect(
      screen.getByRole("heading", { level: 1, name: "Página Pessoal" }),
    ).toBeTruthy();
    for (const titulo of [
      "Ferramentas",
      "Passo a passo",
      "Entregável",
      "Entrega",
      "Depois",
    ])
      expect(screen.getByText(titulo), `bloco ausente: ${titulo}`).toBeTruthy();
    expect(screen.getByText("Escreva o HTML")).toBeTruthy();
    expect(screen.getByText("Texto livre do proximo")).toBeTruthy();
  });

  it("o SEO recebe o nome e o objetivo do projeto", () => {
    render(<ProjetoDetalhe />);
    expect(seo.props[0].title).toBe("Página Pessoal · Projetos · Bora na Tech");
    expect(seo.props[0].description).toBe(GRATIS.objetivo);
    expect(seo.props[0].url).toBe("/projetos/landing-page-pessoal");
  });
});

describe("id fora do catalogo", () => {
  it("mostra a mensagem em vez de pagina em branco", () => {
    rota.id = "nao-existe";
    render(<ProjetoDetalhe />);
    expect(screen.getByText("Não encontramos esse projeto")).toBeTruthy();
    expect(screen.getByText("Ver todos os projetos")).toBeTruthy();
  });

  it("alias abre o projeto canonico", () => {
    rota.id = ALIASADO;
    render(<ProjetoDetalhe />);
    expect(
      screen.getByRole("heading", { level: 1, name: "Página Pessoal" }),
    ).toBeTruthy();
  });
});

describe("projeto Pro para quem nao assina", () => {
  it("nao baixa o detalhe pago e oferece a assinatura", () => {
    rota.id = "projeto-pro";
    const { container } = render(<ProjetoDetalhe />);
    expect(v2.loadProjetoV2).not.toHaveBeenCalled();
    expect(container.innerHTML).not.toContain("PASSO-SECRETO-DO-PRO");
    expect(container.innerHTML).not.toContain("ENTREGAVEL-SECRETO-DO-PRO");
    const botao = screen.getByText("Assinar o Pro").closest("a");
    expect(botao?.getAttribute("href")).toBe("/planos");
    expect(screen.getByText("Assinar para abrir")).toBeTruthy();
  });

  it("assinante ve o corpo do projeto", () => {
    USUARIO_PRO.valor = true;
    rota.id = "projeto-pro";
    const { container } = render(<ProjetoDetalhe />);
    expect(container.innerHTML).toContain("PASSO-SECRETO-DO-PRO");
  });
});
