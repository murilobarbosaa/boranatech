import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";

/**
 * O bloco de entrega (lote 04).
 *
 * O que precisa ficar amarrado: o formulario muda com o tipo de entrega, o
 * anonimo nao ve um botao que vai falhar, a janela sem a tabela no banco
 * desabilita em vez de oferecer, e os tres resultados de checagem sao
 * distinguiveis na tela.
 */

const sessao = vi.hoisted(() => ({ user: null as { id: string } | null }));

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({ user: sessao.user, loading: false }),
}));
vi.mock("wouter", () => ({
  Link: ({ children, href }: { children?: unknown; href?: string }) => (
    <a href={href}>{children as never}</a>
  ),
}));

import ProjetoEntrega from "@/components/projects/ProjetoEntrega";
import type { ProjectSubmission } from "@/services/projectSubmissionService";

const ENTREGA: ProjectSubmission = {
  projectId: "landing-page-pessoal",
  tipoEntrega: "repo_deploy",
  deployUrl: "https://fulano.github.io/portfolio",
  repoUrl: "https://github.com/fulano/portfolio",
  artifactUrl: null,
  retro: { maisDificil: "o css" },
  isPublic: false,
  publicCode: "BNT-ABCD-EFGH",
  status: "entregue",
  autoCheck: null,
  autoCheckAt: null,
  createdAt: "2026-09-06T10:00:00.000Z",
  updatedAt: "2026-09-06T10:00:00.000Z",
};

function montar(over: Partial<Parameters<typeof ProjetoEntrega>[0]> = {}) {
  const onEntregar = vi.fn(async () => {});
  const onVerificar = vi.fn(async () => {});
  render(
    <ProjetoEntrega
      projectId="landing-page-pessoal"
      isPro={false}
      tipoEntrega="repo_deploy"
      checks={["deploy_responde", "repo_publico"]}
      submission={null}
      status="pronto"
      onEntregar={onEntregar}
      onVerificar={onVerificar}
      {...over}
    />,
  );
  return { onEntregar, onVerificar };
}

afterEach(cleanup);
beforeEach(() => {
  sessao.user = { id: "u1" };
});

describe("formulario por tipo de entrega", () => {
  it("repo_deploy pede site e repositorio", () => {
    montar();
    expect(screen.getByLabelText("Link do site no ar")).toBeTruthy();
    expect(screen.getByLabelText("Link do repositório")).toBeTruthy();
    expect(screen.queryByLabelText("Link do arquivo")).toBeNull();
  });

  it("repo pede so o repositorio", () => {
    montar({ tipoEntrega: "repo" });
    expect(screen.queryByLabelText("Link do site no ar")).toBeNull();
    expect(screen.getByLabelText("Link do repositório")).toBeTruthy();
  });

  it("notebook pede o arquivo, com a ajuda do tipo", () => {
    montar({ tipoEntrega: "notebook" });
    expect(screen.getByLabelText("Link do arquivo")).toBeTruthy();
    expect(
      screen.getByText("O notebook publicado no Colab, Kaggle ou GitHub."),
    ).toBeTruthy();
  });

  it("lista as checagens que serao feitas", () => {
    montar();
    expect(screen.getByText("O site responde")).toBeTruthy();
    expect(screen.getByText("O repositório é público")).toBeTruthy();
  });
});

describe("gates da entrega", () => {
  it("anonimo ve o convite para entrar, nao o botao de entregar", () => {
    sessao.user = null;
    montar();
    const link = screen.getByText("Entre para entregar").closest("a");
    expect(link?.getAttribute("href")).toBe("/login");
    expect(screen.queryByText("Entregar projeto")).toBeNull();
  });

  it("tabela ainda nao criada: sem formulario, com aviso", () => {
    montar({ status: "indisponivel" });
    expect(
      screen.getByText(
        "Entrega indisponível agora. Tente de novo em alguns minutos.",
      ),
    ).toBeTruthy();
    expect(screen.queryByLabelText("Link do site no ar")).toBeNull();
  });

  it("erro de carga nao mostra formulario", () => {
    montar({ status: "erro" });
    expect(
      screen.getByText("Não conseguimos carregar sua entrega."),
    ).toBeTruthy();
    expect(screen.queryByText("Entregar projeto")).toBeNull();
  });
});

describe("enviar", () => {
  it("manda os campos preenchidos e a retrospectiva", async () => {
    const { onEntregar } = montar();
    fireEvent.change(screen.getByLabelText("Link do site no ar"), {
      target: { value: "https://fulano.github.io/portfolio" },
    });
    fireEvent.change(screen.getByLabelText("Link do repositório"), {
      target: { value: "https://github.com/fulano/portfolio" },
    });
    fireEvent.change(screen.getByLabelText("O que foi mais difícil?"), {
      target: { value: "o css" },
    });
    fireEvent.click(
      screen.getByLabelText("Mostrar minha solução na galeria pública"),
    );
    fireEvent.click(screen.getByText("Entregar projeto"));
    await vi.waitFor(() => expect(onEntregar).toHaveBeenCalledTimes(1));
    expect(onEntregar).toHaveBeenCalledWith({
      deployUrl: "https://fulano.github.io/portfolio",
      repoUrl: "https://github.com/fulano/portfolio",
      retro: { maisDificil: "o css" },
      isPublic: true,
    });
  });
});

describe("com entrega ja enviada", () => {
  it("mostra os links e a data, sem formulario", () => {
    montar({ submission: ENTREGA });
    expect(screen.getByText("Entregue em 06/09")).toBeTruthy();
    expect(screen.queryByText("Entregar projeto")).toBeNull();
    expect(screen.getByText("Alterar links")).toBeTruthy();
  });

  it("Alterar links reabre o formulario preenchido", () => {
    montar({ submission: ENTREGA });
    fireEvent.click(screen.getByText("Alterar links"));
    const campo = screen.getByLabelText(
      "Link do site no ar",
    ) as HTMLInputElement;
    expect(campo.value).toBe("https://fulano.github.io/portfolio");
  });

  it("os tres resultados de checagem sao distinguiveis", () => {
    montar({
      submission: {
        ...ENTREGA,
        autoCheckAt: "2026-09-06T10:00:00.000Z",
        autoCheck: [
          {
            check: "repo_publico",
            status: "ok",
            mensagem: "O repositório é público.",
          },
          {
            check: "deploy_responde",
            status: "falhou",
            mensagem: "O link não respondeu (status 404).",
          },
          {
            check: "min_commits_5",
            status: "erro",
            mensagem: "Não conseguimos conferir isto agora.",
          },
        ],
      },
    });
    expect(screen.getByText(/O repositório é público$/)).toBeTruthy();
    expect(screen.getByText(/status 404/)).toBeTruthy();
    expect(
      screen.getByText(/Não conseguimos conferir isto agora/),
    ).toBeTruthy();
  });

  it("verificado mostra a data da verificacao", () => {
    montar({
      submission: {
        ...ENTREGA,
        status: "verificado",
        autoCheckAt: "2026-09-07T10:00:00.000Z",
      },
    });
    expect(screen.getByText("Verificado em 07/09")).toBeTruthy();
  });

  it("Verificar de novo fica bloqueado dentro dos 60 s, com contador", () => {
    montar({
      submission: { ...ENTREGA, autoCheckAt: new Date().toISOString() },
    });
    const botao = screen.getByText(/Verificar de novo \(\d+s\)/);
    expect((botao as HTMLButtonElement).disabled).toBe(true);
  });

  it("passados os 60 s, Verificar de novo funciona", async () => {
    const { onVerificar } = montar({
      submission: {
        ...ENTREGA,
        autoCheckAt: new Date(Date.now() - 120_000).toISOString(),
      },
    });
    const botao = screen.getByText("Verificar de novo");
    expect((botao as HTMLButtonElement).disabled).toBe(false);
    fireEvent.click(botao);
    await vi.waitFor(() => expect(onVerificar).toHaveBeenCalledTimes(1));
  });
});
