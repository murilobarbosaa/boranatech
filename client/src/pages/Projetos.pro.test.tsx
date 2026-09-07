import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";

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
const sessao = vi.hoisted(() => ({ user: null as { id: string } | null }));
const entregas = vi.hoisted(() => ({ listar: vi.fn(async () => []) }));
const validacoes = vi.hoisted(() => ({
  listar: vi.fn<() => Promise<unknown[]>>(async () => []),
}));
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
  PROJETOS_V2_IDS: ["projeto-pro", "projeto-gratis"],
}));

vi.mock("@/contexts/SubscriptionContext", () => ({
  useSubscription: () => assinatura,
}));
vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({ user: sessao.user, loading: false }),
}));
vi.mock("@/services/projectSubmissionService", () => ({
  listSubmissions: entregas.listar,
}));
vi.mock("@/services/projectValidationService", () => ({
  listProjectValidations: validacoes.listar,
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
vi.mock("@/components/SEO", () => ({ default: () => null }));
vi.mock("@/components/FavoriteButton", () => ({ default: () => null }));
vi.mock("@/components/projects/ProjetoValidacao", () => ({
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
  sessao.user = null;
  entregas.listar.mockClear();
  validacoes.listar.mockReset();
  validacoes.listar.mockResolvedValue([]);
  rota.id = undefined;
  v2.loadProjetoV2.mockReset();
  v2.loadProjetoV2.mockResolvedValue(null);
});

function cardDe(nome: string): HTMLAnchorElement {
  const a = screen.getByText(nome).closest("a");
  if (!a) throw new Error(`card nao encontrado: ${nome}`);
  return a as HTMLAnchorElement;
}

describe("Projetos, o catalogo em grade", () => {
  it("cada card e um link para a pagina do projeto", () => {
    render(<Projetos />);
    expect(cardDe("Desafio Aberto").getAttribute("href")).toBe(
      "/projetos/projeto-gratis",
    );
    expect(cardDe("Desafio Pago").getAttribute("href")).toBe(
      "/projetos/projeto-pro",
    );
  });

  it("NENHUM detalhe v2 e carregado ao renderizar o catalogo", () => {
    render(<Projetos />);
    expect(v2.loadProjetoV2).not.toHaveBeenCalled();
  });

  it("com assinatura tambem nao carrega detalhe nenhum", () => {
    assinatura.isPro = true;
    render(<Projetos />);
    expect(v2.loadProjetoV2).not.toHaveBeenCalled();
  });

  it("clicar no card nao dispara carga de detalhe", () => {
    render(<Projetos />);
    fireEvent.click(cardDe("Desafio Pago"));
    expect(v2.loadProjetoV2).not.toHaveBeenCalled();
  });
});

describe("Projetos, projeto Pro para quem nao assina", () => {
  it("o card aparece na lista, com o objetivo desfocado", () => {
    render(<Projetos />);
    const objetivo = screen.getByText("Objetivo do desafio pago");
    expect(objetivo.className).toContain("blur-sm");
    expect(
      screen.getByText("Objetivo do desafio aberto").className,
    ).not.toContain("blur-sm");
  });

  it("o chip de estado diz que a assinatura abre", () => {
    render(<Projetos />);
    expect(screen.getByText("Assinar para abrir")).toBeTruthy();
  });

  it("nao coloca nenhum campo do detalhe pago no DOM", () => {
    const { container } = render(<Projetos />);
    expect(container.innerHTML).not.toContain("PASSO-SECRETO-DO-PRO");
    expect(container.innerHTML).not.toContain("ENTREGAVEL-SECRETO-DO-PRO");
  });

  it("trava enquanto o status Pro nao resolveu", () => {
    assinatura.loading = true;
    render(<Projetos />);
    expect(screen.getByText("Assinar para abrir")).toBeTruthy();
  });
});

describe("Projetos, projeto Pro para quem assina", () => {
  it("o card deixa de estar travado", () => {
    assinatura.isPro = true;
    render(<Projetos />);
    expect(screen.queryByText("Assinar para abrir")).toBeNull();
    expect(
      screen.getByText("Objetivo do desafio pago").className,
    ).not.toContain("blur-sm");
  });
});

describe("Projetos, entregas no catalogo", () => {
  it("anonimo nao pede a lista de entregas", () => {
    render(<Projetos />);
    expect(entregas.listar).not.toHaveBeenCalled();
  });

  it("logado pede a lista UMA vez", () => {
    sessao.user = { id: "u1" };
    render(<Projetos />);
    expect(entregas.listar).toHaveBeenCalledTimes(1);
  });

  it("entrega verificada aparece no chip do card", async () => {
    sessao.user = { id: "u1" };
    entregas.listar.mockResolvedValue([
      { projectId: "projeto-gratis", status: "verificado" },
    ] as never);
    render(<Projetos />);
    await waitFor(() => expect(screen.getByText("Verificado")).toBeTruthy());
  });
});

describe("Projetos, validacoes no catalogo", () => {
  it("anonimo nao pede a lista de validacoes", () => {
    render(<Projetos />);
    expect(validacoes.listar).not.toHaveBeenCalled();
  });

  it("logado pede a lista UMA vez", () => {
    sessao.user = { id: "u1" };
    render(<Projetos />);
    expect(validacoes.listar).toHaveBeenCalledTimes(1);
  });

  it("validado com nota perfeita mostra o selo 100%", async () => {
    sessao.user = { id: "u1" };
    validacoes.listar.mockResolvedValue([
      { projectId: "projeto-gratis", status: "aprovado", perfeito: true },
    ]);
    render(<Projetos />);
    await waitFor(() => expect(screen.getByText("Validado")).toBeTruthy());
    expect(screen.getByText("100%")).toBeTruthy();
  });

  it("validado sem nota perfeita nao mostra o selo", async () => {
    sessao.user = { id: "u1" };
    validacoes.listar.mockResolvedValue([
      { projectId: "projeto-gratis", status: "aprovado", perfeito: false },
    ]);
    render(<Projetos />);
    await waitFor(() => expect(screen.getByText("Validado")).toBeTruthy());
    expect(screen.queryByText("100%")).toBeNull();
  });
});
