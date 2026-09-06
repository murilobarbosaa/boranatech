import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";

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
  v2: {
    loadProjetoV2: vi.fn(),
    ids: new Set(["landing-page-pessoal", "projeto-pro"]),
  },
}));

const rota = vi.hoisted(() => ({ id: "landing-page-pessoal" }));
const progresso = vi.hoisted(() => ({
  stages: new Map<string, Record<string, string>>(),
  done: new Set<string>(),
  updatedAt: new Map<string, string>(),
  toggleStage: vi.fn(),
  toggle: vi.fn(),
}));

// Fixture propria, nao o conteudo editorial real: amarrar o teste de render a
// copy faria toda revisao de texto quebrar teste.
const DETALHE = vi.hoisted(() => ({
  valor: {
    id: "landing-page-pessoal",
    tipoEntrega: "repo_deploy" as const,
    briefing: {
      contexto: "Contexto do projeto de teste.",
      aprende: ["Aprende A", "Aprende B", "Aprende C"],
      preRequisitos: [{ rotulo: "Saber HTML", href: "/dicionario?termo=HTML" }],
      tempoEstimado: {
        horas: [6, 10] as [number, number],
        semanas: [1, 2] as [number, number],
      },
    },
    requisitos: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => ({
      id: `req-${n}`,
      descricao: `Requisito numero ${n}`,
      verificacao: `Como verificar ${n}`,
    })),
    etapas: ["planejar", "html", "css", "celular", "publicar"].map((id) => ({
      id,
      titulo: `Etapa ${id}`,
      tempo: "1 h",
      oQueFazer: [`Faca ${id}`],
      prontoQuando: `Pronto ${id}`,
    })),
    kit: [
      { tipo: "modelo" as const, titulo: "Modelo", nota: "Nota do modelo" },
    ],
    ajuda: {
      trilha: { slug: "frontend", nodeIds: ["html.semantica"] },
      termos: ["HTML"],
    },
  },
}));

vi.mock("@/lib/data", () => ({ projetos: [PRO, GRATIS], areasTI: [] }));
vi.mock("@shared/projects/v2", () => ({
  isProjetoV2: (id: string) => v2.ids.has(id),
  loadProjetoV2: v2.loadProjetoV2,
  PROJETOS_V2_IDS: ["landing-page-pessoal"],
}));
vi.mock("@/contexts/SubscriptionContext", () => ({
  useSubscription: () => ({ isPro: USUARIO_PRO.valor, loading: false }),
}));
vi.mock("@/hooks/useProjectCompletion", () => ({
  useProjectCompletion: () => ({
    done: progresso.done,
    stages: progresso.stages,
    updatedAt: progresso.updatedAt,
    ready: true,
    toggle: progresso.toggle,
    toggleStage: progresso.toggleStage,
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
vi.mock("@/lib/proConfetti", () => ({ fireProCelebration: () => () => {} }));
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
  v2.ids = new Set(["landing-page-pessoal", "projeto-pro"]);
  seo.props.length = 0;
  progresso.stages = new Map();
  progresso.done = new Set();
  progresso.updatedAt = new Map();
  progresso.toggleStage.mockReset();
  progresso.toggle.mockReset();
  v2.loadProjetoV2.mockReset();
  v2.loadProjetoV2.mockResolvedValue(null);
});

describe("corpo v1", () => {
  it("renderiza os blocos do projeto sem detalhe v2", async () => {
    // O modulo v2 resolve null (nao existe): a pagina cai no corpo v1 depois
    // do esqueleto.
    render(<ProjetoDetalhe />);
    await waitFor(() => expect(screen.getByText("Passo a passo")).toBeTruthy());
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

  it("assinante ve o corpo do projeto", async () => {
    USUARIO_PRO.valor = true;
    rota.id = "projeto-pro";
    const { container } = render(<ProjetoDetalhe />);
    await waitFor(() =>
      expect(container.innerHTML).toContain("PASSO-SECRETO-DO-PRO"),
    );
    expect(v2.loadProjetoV2).toHaveBeenCalledWith("projeto-pro");
  });
});

describe("corpo v2", () => {
  async function renderizarV2() {
    v2.loadProjetoV2.mockResolvedValue(DETALHE.valor);
    render(<ProjetoDetalhe />);
    await waitFor(() => expect(screen.getByText("Etapas")).toBeTruthy());
  }

  it("mostra os blocos do guia na ordem do mockup", async () => {
    await renderizarV2();
    for (const titulo of [
      "Por que este projeto",
      "O que precisa estar lá no fim",
      "Etapas",
      "Entrega",
      "Depois",
    ])
      expect(screen.getByText(titulo), `bloco ausente: ${titulo}`).toBeTruthy();
    expect(screen.getByText("Você vai sair sabendo")).toBeTruthy();
  });

  it("os 10 requisitos aparecem sem numero e sem a verificacao", async () => {
    await renderizarV2();
    for (let n = 1; n <= 10; n += 1)
      expect(screen.getByText(`Requisito numero ${n}`)).toBeTruthy();
    expect(screen.queryByText("Como verificar 1")).toBeNull();
    const item = screen.getByText("Requisito numero 1").closest("li")!;
    expect(item.textContent).toBe("Requisito numero 1");
  });

  it("a linha do tempo marca a primeira etapa nao feita como atual", async () => {
    progresso.stages = new Map([
      [
        "landing-page-pessoal",
        {
          planejar: "2026-09-05T07:00:00.000Z",
          html: "2026-09-06T07:00:00.000Z",
        },
      ],
    ]);
    await renderizarV2();
    expect(screen.getAllByRole("checkbox")).toHaveLength(5);
    expect(
      screen
        .getByRole("checkbox", { name: "Etapa planejar" })
        .getAttribute("aria-checked"),
    ).toBe("true");
    expect(
      screen
        .getByRole("checkbox", { name: "Etapa css" })
        .getAttribute("aria-checked"),
    ).toBe("false");
    // A etapa atual e a 3, e o botao principal aponta para ela.
    expect(screen.getByText("Continuar da etapa 3")).toBeTruthy();
    expect(screen.getAllByText("2 de 5 etapas").length).toBeGreaterThan(0);
  });

  it("sem etapa marcada o botao principal diz Comecar", async () => {
    await renderizarV2();
    expect(screen.getByText("Começar")).toBeTruthy();
  });

  it("com todas as etapas feitas o botao principal leva a entrega", async () => {
    progresso.stages = new Map([
      [
        "landing-page-pessoal",
        Object.fromEntries(
          DETALHE.valor.etapas.map((e) => [e.id, "2026-09-06T07:00:00.000Z"]),
        ),
      ],
    ]);
    await renderizarV2();
    expect(screen.getByText("Ir para a entrega")).toBeTruthy();
  });

  it("clicar numa etapa chama toggleStage com o id certo", async () => {
    await renderizarV2();
    fireEvent.click(screen.getByRole("checkbox", { name: "Etapa celular" }));
    expect(progresso.toggleStage).toHaveBeenCalledWith(
      "landing-page-pessoal",
      "celular",
    );
  });

  it("o kit e os termos aparecem na lateral", async () => {
    await renderizarV2();
    expect(screen.getByText("Nota do modelo")).toBeTruthy();
    expect(screen.getByText("Kit")).toBeTruthy();
    expect(screen.getByText("Antes de começar")).toBeTruthy();
  });
});

describe("comemoracao ao concluir", () => {
  it("nao abre o modal ao montar com o projeto ja concluido", async () => {
    progresso.done = new Set(["landing-page-pessoal"]);
    render(<ProjetoDetalhe />);
    await waitFor(() => expect(screen.getByText("Passo a passo")).toBeTruthy());
    expect(screen.queryByText("Projeto concluído!")).toBeNull();
  });

  it("abre o modal quando a pessoa marca como concluido", async () => {
    render(<ProjetoDetalhe />);
    await waitFor(() => expect(screen.getByText("Passo a passo")).toBeTruthy());
    fireEvent.click(screen.getByText("Marcar como concluído"));
    expect(progresso.toggle).toHaveBeenCalledWith("landing-page-pessoal");
    expect(screen.getByText("Projeto concluído!")).toBeTruthy();
  });

  it("desmarcar um projeto concluido nao comemora", async () => {
    progresso.done = new Set(["landing-page-pessoal"]);
    render(<ProjetoDetalhe />);
    await waitFor(() => expect(screen.getByText("Passo a passo")).toBeTruthy());
    fireEvent.click(screen.getByText("Projeto concluído"));
    expect(screen.queryByText("Projeto concluído!")).toBeNull();
  });
});

describe("estado final do botao principal", () => {
  it("concluido com proximo: o botao principal e o link do proximo", async () => {
    progresso.done = new Set(["landing-page-pessoal"]);
    v2.loadProjetoV2.mockResolvedValue({
      ...DETALHE.valor,
      id: "landing-page-pessoal",
    });
    render(<ProjetoDetalhe />);
    await waitFor(() => expect(screen.getByText("Etapas")).toBeTruthy());
    // O catalogo de teste nao tem proximoProjetoId, entao cai no compartilhar.
    expect(screen.getByText("Compartilhar")).toBeTruthy();
    expect(screen.queryByText("Ir para a entrega")).toBeNull();
    expect(screen.queryByText("Começar")).toBeNull();
  });

  it("mostra a data de conclusao quando o servidor a devolveu", async () => {
    progresso.done = new Set(["landing-page-pessoal"]);
    progresso.updatedAt = new Map([
      ["landing-page-pessoal", "2026-09-06T10:00:00.000Z"],
    ]);
    render(<ProjetoDetalhe />);
    await waitFor(() => expect(screen.getByText("Passo a passo")).toBeTruthy());
    expect(screen.getByText("Concluído em 06/09")).toBeTruthy();
  });

  it("anonimo sem data nao inventa uma", async () => {
    progresso.done = new Set(["landing-page-pessoal"]);
    render(<ProjetoDetalhe />);
    await waitFor(() => expect(screen.getByText("Passo a passo")).toBeTruthy());
    expect(screen.queryByText(/Concluído em/)).toBeNull();
  });
});

describe("indexacao", () => {
  it("pagina v1 pede noindex", async () => {
    v2.ids = new Set<string>();
    render(<ProjetoDetalhe />);
    await waitFor(() => expect(screen.getByText("Passo a passo")).toBeTruthy());
    expect(seo.props[0].noindex).toBe(true);
  });

  it("pagina v2 continua indexavel", async () => {
    v2.loadProjetoV2.mockResolvedValue({
      ...DETALHE.valor,
      id: "landing-page-pessoal",
    });
    render(<ProjetoDetalhe />);
    await waitFor(() => expect(screen.getByText("Etapas")).toBeTruthy());
    expect(seo.props[0].noindex).toBe(false);
  });
});
