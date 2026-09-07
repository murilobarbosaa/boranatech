import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";

/**
 * O bloco de validacao com nota (lote 06).
 *
 * O caso que mais importa e o do nao assinante: ele nao pode nem tentar, e
 * nenhuma chamada de rede pode sair da tela dele.
 */

const servico = vi.hoisted(() => ({
  get: vi.fn<() => Promise<unknown>>(async () => null),
  submit: vi.fn(),
}));

vi.mock("@/services/projectValidationService", () => ({
  getProjectValidation: servico.get,
  submitProjectValidation: servico.submit,
  ProjectValidationError: class extends Error {
    code = "generic";
    retryAfter?: number;
  },
}));
vi.mock("wouter", () => ({
  Link: ({ children, href }: { children?: unknown; href?: string }) => (
    <a href={href}>{children as never}</a>
  ),
}));

import ProjetoValidacao from "@/components/projects/ProjetoValidacao";

const REQS = [
  { id: "r1", descricao: "Requisito um" },
  { id: "r2", descricao: "Requisito dois" },
  { id: "r3", descricao: "Requisito tres" },
  { id: "r4", descricao: "Requisito quatro" },
  { id: "r5", descricao: "Requisito cinco" },
];

function nota(atendidos: number, total = 5) {
  const fracao = atendidos / total;
  return {
    atendidos,
    total,
    percentual: Math.floor(fracao * 100),
    pendentes: REQS.slice(atendidos, total).map((r) => r.id),
    validado: fracao >= 0.8,
    perfeito: atendidos === total,
  };
}

function resultado(atendidos: number) {
  return REQS.map((r, i) => ({
    id: r.id,
    veredito: i < atendidos ? ("atende" as const) : ("nao_atende" as const),
    evidencia: `evidencia ${r.id}`,
  }));
}

function montar(over: Partial<Parameters<typeof ProjetoValidacao>[0]> = {}) {
  const onValidated = vi.fn();
  render(
    <ProjetoValidacao
      projectId="landing-page-pessoal"
      isPro
      repoUrlDaEntrega="https://github.com/fulano/portfolio"
      exigeEntrega
      onValidated={onValidated}
      {...over}
    />,
  );
  return { onValidated };
}

afterEach(cleanup);
beforeEach(() => {
  servico.get.mockReset();
  servico.get.mockResolvedValue(null);
  servico.submit.mockReset();
});

describe("nao assinante", () => {
  it("ve o cartao travado, sem formulario e sem chamada", () => {
    montar({ isPro: false });
    expect(screen.getByText(/Validação com IA é do Pro/)).toBeTruthy();
    expect(
      screen.getByText("Assinar o Pro").closest("a")?.getAttribute("href"),
    ).toBe("/planos");
    expect(screen.queryByLabelText("Link do repositório")).toBeNull();
    expect(servico.get).not.toHaveBeenCalled();
  });
});

describe("assinante", () => {
  it("sem entrega, pede a entrega primeiro", () => {
    montar({ repoUrlDaEntrega: null });
    expect(
      screen.getByText(
        "Entregue primeiro. A validação usa o link do repositório da entrega.",
      ),
    ).toBeTruthy();
    expect(screen.queryByText("Validar com IA")).toBeNull();
  });

  it("com entrega, o campo vem preenchido", async () => {
    montar();
    const campo = (await screen.findByLabelText(
      "Link do repositório",
    )) as HTMLInputElement;
    expect(campo.value).toBe("https://github.com/fulano/portfolio");
    expect(screen.getByText("Validar com IA")).toBeTruthy();
  });

  it("projeto Pro do catalogo nao exige entrega", () => {
    montar({ repoUrlDaEntrega: null, exigeEntrega: false });
    expect(screen.getByText("Validar com IA")).toBeTruthy();
  });
});

describe("resultado", () => {
  async function validarCom(atendidos: number, extra = {}) {
    servico.submit.mockResolvedValue({
      status: atendidos / 5 >= 0.8 ? "aprovado" : "reprovado",
      resultado: resultado(atendidos),
      analysisId: "a1",
      pendentes: nota(atendidos).pendentes,
      nota: nota(atendidos),
      requisitos: REQS,
      gravado: true,
      ...extra,
    });
    const r = montar();
    fireEvent.click(screen.getByText("Validar com IA"));
    await waitFor(() => expect(servico.submit).toHaveBeenCalledTimes(1));
    return r;
  }

  it("4 de 5 mostra Validado e nao mostra 100%", async () => {
    await validarCom(4);
    expect(screen.getByText("Validado")).toBeTruthy();
    expect(screen.queryByText("100%")).toBeNull();
    expect(screen.getByText("4 de 5")).toBeTruthy();
    expect(screen.getByText("80%")).toBeTruthy();
  });

  it("5 de 5 mostra Validado e o selo 100%", async () => {
    await validarCom(5);
    expect(screen.getByText("Validado")).toBeTruthy();
    // Duas ocorrencias: a legenda do anel e o selo. Com 4 de 5 o anel diz
    // "80%" e nenhuma das duas aparece.
    expect(screen.getAllByText("100%")).toHaveLength(2);
  });

  it("3 de 5 mostra Nao validado ainda e as pendencias no topo", async () => {
    await validarCom(3);
    expect(screen.getByText("Não validado ainda")).toBeTruthy();
    const itens = screen.getAllByRole("listitem");
    // Os dois pendentes vem primeiro.
    expect(itens[0].textContent).toContain("Requisito quatro");
    expect(itens[1].textContent).toContain("Requisito cinco");
  });

  it("aprovado chama onValidated", async () => {
    const { onValidated } = await validarCom(5);
    expect(onValidated).toHaveBeenCalledTimes(1);
  });

  it("reprovado NAO chama onValidated", async () => {
    const { onValidated } = await validarCom(3);
    expect(onValidated).not.toHaveBeenCalled();
  });

  it("gravado false mostra a melhor nota", async () => {
    await validarCom(4, { gravado: false, melhor: nota(5) });
    expect(
      screen.getByText("Sua melhor nota continua sendo 5 de 5."),
    ).toBeTruthy();
  });
});

describe("cooldown", () => {
  it("depois de validar, o botao fica bloqueado com o contador", async () => {
    servico.submit.mockResolvedValue({
      status: "aprovado",
      resultado: resultado(5),
      analysisId: "a1",
      pendentes: [],
      nota: nota(5),
      requisitos: REQS,
      gravado: true,
    });
    montar();
    fireEvent.click(screen.getByText("Validar com IA"));
    await waitFor(() => expect(servico.submit).toHaveBeenCalledTimes(1));
    // O contador so aparece depois que o efeito do cooldown roda.
    await waitFor(() =>
      expect(screen.getByText(/Validar de novo \(\d+ min\)/)).toBeTruthy(),
    );
    const botao = screen.getByText(/Validar de novo \(\d+ min\)/);
    expect((botao as HTMLButtonElement).disabled).toBe(true);
    fireEvent.click(botao);
    expect(servico.submit).toHaveBeenCalledTimes(1);
  });

  it("validacao anterior recente ja abre bloqueado", async () => {
    servico.get.mockResolvedValue({
      ultima: {
        projectId: "landing-page-pessoal",
        status: "reprovado",
        createdAt: new Date().toISOString(),
        analysisId: "a1",
        resultado: resultado(2),
        nota: nota(2),
      },
      aprovada: null,
      requisitos: REQS,
    });
    montar();
    await waitFor(() =>
      expect(screen.getByText(/Validar de novo \(\d+ min\)/)).toBeTruthy(),
    );
  });
});
