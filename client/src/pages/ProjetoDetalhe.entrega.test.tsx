import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";

/**
 * ENTREGAR NAO E CONCLUIR.
 *
 * A Ana entregou uma URL que nao era o projeto pedido. Duas das seis
 * conferencias falharam e a tela mesmo assim abriu "Projeto concluido!" e
 * marcou o projeto como feito. O defeito era de desenho: `toggleCompletion` e a
 * comemoracao aconteciam no ATO de entregar, sem olhar o resultado.
 *
 * Estes testes prendem quem chama `toggleCompletion` e quando. Sao o unico
 * lugar onde isso fica amarrado: o resultado da conferencia chega assincrono, e
 * inspecao visual do fluxo passa por ele sem ver.
 */

const { PROJETO, v2, DETALHE } = vi.hoisted(() => ({
  PROJETO: {
    id: "landing-page-pessoal",
    nome: "Página Pessoal",
    areaSlug: "frontend",
    subareaSlug: null,
    nivel: "Iniciante",
    objetivo: "Criar uma página pessoal.",
    ferramentas: ["HTML"],
    passosSimplificados: ["Escreva o HTML"],
    entregavel: "Uma página no ar",
    comoPublicar: "GitHub Pages",
    sugestaoLinkedIn: "post",
    proximoProjeto: "outro",
  },
  v2: { loadProjetoV2: vi.fn(), ids: new Set(["landing-page-pessoal"]) },
  DETALHE: {
    /** Mutavel: um teste zera `verificacaoAutomatica` para o caso sem checagem. */
    valor: null as Record<string, unknown> | null,
  },
}));

type NotaTeste = { atendidos: number; total: number; perfeito: boolean };

const sessao = vi.hoisted(() => ({
  user: { id: "u1" } as { id: string } | null,
}));
const entrega = vi.hoisted(() => ({
  get: vi.fn(),
  upsert: vi.fn(),
  verify: vi.fn(),
}));
const progresso = vi.hoisted(() => ({
  done: new Set<string>(),
  toggle: vi.fn(),
  toggleStage: vi.fn(),
}));

vi.mock("@/lib/data", () => ({ projetos: [PROJETO], areasTI: [] }));
vi.mock("@shared/projects/v2", () => ({
  isProjetoV2: (id: string) => v2.ids.has(id),
  loadProjetoV2: v2.loadProjetoV2,
  PROJETOS_V2_IDS: ["landing-page-pessoal"],
}));
vi.mock("@/contexts/SubscriptionContext", () => ({
  useSubscription: () => ({ isPro: false, loading: false }),
}));
vi.mock("@/hooks/useProjectCompletion", () => ({
  useProjectCompletion: () => ({
    done: progresso.done,
    stages: new Map(),
    updatedAt: new Map(),
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
vi.mock("@/components/SEO", () => ({ default: () => null }));
vi.mock("@/components/FavoriteButton", () => ({ default: () => null }));
vi.mock("@/lib/proConfetti", () => ({
  fireProCelebration: () => () => {},
}));
vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({ user: sessao.user, leaving: false, loading: false }),
}));
vi.mock("@/services/projectSubmissionService", () => ({
  getSubmission: entrega.get,
  upsertSubmission: entrega.upsert,
  verifySubmission: entrega.verify,
  ProjectSubmissionError: class extends Error {
    code = "generic";
  },
}));
vi.mock("@/components/projects/ProjetoValidacao", () => ({
  default: ({
    onNota,
    onValidated,
  }: {
    onNota?: (nota: NotaTeste) => void;
    onValidated?: (nota: NotaTeste) => void;
  }) => (
    <button
      type="button"
      onClick={() => {
        // Mesma ordem do componente real quando o status e `aprovado`.
        const nota = { atendidos: 8, total: 10, perfeito: false };
        onNota?.(nota);
        onValidated?.(nota);
      }}
    >
      simular aprovacao
    </button>
  ),
}));
vi.mock("wouter", () => ({
  useParams: () => ({ id: "landing-page-pessoal" }),
  Link: ({ children, href }: { children?: unknown; href?: string }) => (
    <a href={href}>{children as never}</a>
  ),
}));

import ProjetoDetalhe from "@/pages/ProjetoDetalhe";

const CHECKS = ["deploy_responde", "repo_publico", "readme_existe"] as const;

function detalheBase(checks: readonly string[]) {
  return {
    id: "landing-page-pessoal",
    tipoEntrega: "repo_deploy" as const,
    briefing: {
      contexto: "Contexto.",
      aprende: ["A"],
      preRequisitos: [],
      tempoEstimado: { horas: [6, 10], semanas: [1, 2] },
    },
    requisitos: [{ id: "r1", descricao: "Req", verificacao: "Como" }],
    etapas: [
      {
        id: "e1",
        titulo: "Etapa",
        tempo: "1 h",
        oQueFazer: ["Faca"],
        prontoQuando: "Pronto",
      },
    ],
    kit: [],
    ajuda: { trilha: null, termos: [] },
    verificacaoAutomatica: checks,
  };
}

function entregue(autoCheck: Array<{ check: string; status: string }> | null) {
  return {
    projectId: "landing-page-pessoal",
    tipoEntrega: "repo_deploy",
    deployUrl: "https://site.exemplo",
    repoUrl: "https://github.com/x/y",
    artifactUrl: null,
    retro: {},
    isPublic: false,
    publicCode: "abc",
    status: autoCheck?.every((r) => r.status === "ok")
      ? "verificado"
      : "entregue",
    autoCheck: autoCheck?.map((r) => ({ ...r, mensagem: "msg" })) ?? null,
    autoCheckAt: "2026-09-08T10:00:00Z",
    createdAt: "2026-09-08T09:00:00Z",
    updatedAt: "2026-09-08T10:00:00Z",
  };
}

afterEach(cleanup);
beforeEach(() => {
  sessao.user = { id: "u1" };
  progresso.done = new Set();
  progresso.toggle.mockReset();
  progresso.toggleStage.mockReset();
  entrega.get.mockReset().mockResolvedValue(null);
  entrega.upsert.mockReset();
  entrega.verify.mockReset();
  v2.loadProjetoV2.mockReset();
  DETALHE.valor = detalheBase(CHECKS);
  v2.loadProjetoV2.mockImplementation(async () => DETALHE.valor);
});

async function entregarPelaTela() {
  render(<ProjetoDetalhe />);
  const botao = await screen.findByRole("button", { name: "Entregar projeto" });
  fireEvent.change(screen.getByLabelText("Link do site no ar"), {
    target: { value: "https://site.exemplo" },
  });
  fireEvent.change(screen.getByLabelText("Link do repositório"), {
    target: { value: "https://github.com/x/y" },
  });
  fireEvent.click(botao);
}

describe("entregar com conferencia falhando", () => {
  it("NAO marca o projeto como concluido", async () => {
    entrega.upsert.mockResolvedValue(entregue(null));
    entrega.verify.mockResolvedValue(
      entregue([
        { check: "deploy_responde", status: "ok" },
        { check: "repo_publico", status: "ok" },
        { check: "readme_existe", status: "falhou" },
      ]),
    );

    await entregarPelaTela();
    await waitFor(() => expect(entrega.verify).toHaveBeenCalled());
    expect(progresso.toggle).not.toHaveBeenCalled();
  });

  it("NAO abre a comemoracao", async () => {
    entrega.upsert.mockResolvedValue(entregue(null));
    entrega.verify.mockResolvedValue(
      entregue([
        { check: "deploy_responde", status: "ok" },
        { check: "repo_publico", status: "falhou" },
        { check: "readme_existe", status: "falhou" },
      ]),
    );

    await entregarPelaTela();
    await waitFor(() => expect(entrega.verify).toHaveBeenCalled());
    expect(screen.queryByText("Projeto concluído!")).toBeNull();
    expect(screen.queryByText("Projeto verificado!")).toBeNull();
    expect(screen.queryByText("Projeto entregue!")).toBeNull();
  });

  it("uma checagem em erro tambem nao conclui", async () => {
    // `erro` e "nao consegui conferir", que NAO e o mesmo que "passou".
    entrega.upsert.mockResolvedValue(entregue(null));
    entrega.verify.mockResolvedValue(
      entregue([
        { check: "deploy_responde", status: "ok" },
        { check: "repo_publico", status: "ok" },
        { check: "readme_existe", status: "erro" },
      ]),
    );

    await entregarPelaTela();
    await waitFor(() => expect(entrega.verify).toHaveBeenCalled());
    expect(progresso.toggle).not.toHaveBeenCalled();
  });
});

describe("entregar com tudo passando", () => {
  it("marca como concluido UMA vez e comemora na variante verificado", async () => {
    entrega.upsert.mockResolvedValue(entregue(null));
    entrega.verify.mockResolvedValue(
      entregue(CHECKS.map((c) => ({ check: c, status: "ok" }))),
    );

    await entregarPelaTela();
    await waitFor(() =>
      expect(screen.getByText("Projeto verificado!")).toBeTruthy(),
    );
    expect(progresso.toggle).toHaveBeenCalledTimes(1);
    expect(progresso.toggle).toHaveBeenCalledWith("landing-page-pessoal");
    expect(
      screen.getByText(
        "Você entregou Página Pessoal e passou nas 3 conferências.",
      ),
    ).toBeTruthy();
  });

  it("projeto ja concluido nao chama toggle de novo", async () => {
    progresso.done = new Set(["landing-page-pessoal"]);
    entrega.upsert.mockResolvedValue(entregue(null));
    entrega.verify.mockResolvedValue(
      entregue(CHECKS.map((c) => ({ check: c, status: "ok" }))),
    );

    await entregarPelaTela();
    await waitFor(() =>
      expect(screen.getByText("Projeto verificado!")).toBeTruthy(),
    );
    expect(progresso.toggle).not.toHaveBeenCalled();
  });
});

describe("projeto v2 sem conferencia automatica", () => {
  it("entregar ja conclui e comemora na variante entregue", async () => {
    DETALHE.valor = detalheBase([]);
    entrega.upsert.mockResolvedValue(entregue(null));

    await entregarPelaTela();
    await waitFor(() =>
      expect(screen.getByText("Projeto entregue!")).toBeTruthy(),
    );
    expect(progresso.toggle).toHaveBeenCalledTimes(1);
    expect(screen.getByText("Você entregou Página Pessoal.")).toBeTruthy();
    // Nao ha o que conferir, entao nem tenta.
    expect(entrega.verify).not.toHaveBeenCalled();
  });
});

describe("validacao com IA aprovada", () => {
  it("conclui mesmo com checagem falhando", async () => {
    // Antes do lote 04b a entrega ja tinha marcado `done`, entao a aprovacao
    // nunca precisou marcar. Agora quem falha numa checagem estrutural e passa
    // na IA ficaria "validado" sem "concluido".
    entrega.get.mockResolvedValue(
      entregue([
        { check: "deploy_responde", status: "ok" },
        { check: "repo_publico", status: "ok" },
        { check: "readme_existe", status: "falhou" },
      ]),
    );

    render(<ProjetoDetalhe />);
    fireEvent.click(
      await screen.findByRole("button", { name: "simular aprovacao" }),
    );

    await waitFor(() =>
      expect(screen.getByText("Projeto validado!")).toBeTruthy(),
    );
    expect(progresso.toggle).toHaveBeenCalledTimes(1);
    expect(progresso.toggle).toHaveBeenCalledWith("landing-page-pessoal");
  });
});

describe("verificar de novo depois de corrigir", () => {
  it("passando tudo na segunda tentativa, conclui e comemora", async () => {
    // O caminho de quem conserta o repositorio e clica "Verificar de novo": a
    // conclusao nao pode depender de ter sido a MESMA interacao da entrega.
    entrega.get.mockResolvedValue(
      entregue([
        { check: "deploy_responde", status: "ok" },
        { check: "repo_publico", status: "ok" },
        { check: "readme_existe", status: "falhou" },
      ]),
    );
    entrega.verify.mockResolvedValue(
      entregue(CHECKS.map((c) => ({ check: c, status: "ok" }))),
    );

    render(<ProjetoDetalhe />);
    const botao = await screen.findByRole("button", {
      name: /Verificar de novo/,
    });
    fireEvent.click(botao);

    await waitFor(() =>
      expect(screen.getByText("Projeto verificado!")).toBeTruthy(),
    );
    expect(progresso.toggle).toHaveBeenCalledTimes(1);
  });
});
