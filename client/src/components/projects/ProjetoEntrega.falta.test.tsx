import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";

/**
 * O QUE FALTA, E O QUE A CONFERENCIA NAO JULGA.
 *
 * Dois defeitos achados pela Ana em producao. O primeiro: a tela listava as
 * conferencias sem destacar as que falharam nem dizer o que fazer. O segundo, e
 * o mais caro: nada dizia que a conferencia e ESTRUTURAL. Ela entregou o site
 * institucional no lugar da pagina pessoal, e "o site responde, o repositorio e
 * publico" leu como um aval que ninguem deu.
 */

const sessao = vi.hoisted(() => ({
  user: { id: "u1" } as { id: string } | null,
}));

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({ user: sessao.user, loading: false }),
}));
vi.mock("wouter", () => ({
  Link: ({ children, href }: { children?: unknown; href?: string }) => (
    <a href={href}>{children as never}</a>
  ),
}));
vi.mock("@/components/projects/ProjetoValidacao", () => ({
  default: () => null,
}));

import ProjetoEntrega from "@/components/projects/ProjetoEntrega";
import type {
  ProjectSubmission,
  ResultadoCheck,
} from "@/services/projectSubmissionService";

const HONESTIDADE =
  "A conferência automática olha a estrutura: se o site abre, se o repositório é público, se tem README e commits. Ela não julga se o projeto é o que foi pedido.";

function entrega(autoCheck: ResultadoCheck[] | null): ProjectSubmission {
  return {
    projectId: "landing-page-pessoal",
    tipoEntrega: "repo_deploy",
    deployUrl: "https://fulano.github.io/site",
    repoUrl: "https://github.com/fulano/site",
    artifactUrl: null,
    retro: {},
    isPublic: false,
    publicCode: "BNT-ABCD-EFGH",
    status: "entregue",
    autoCheck,
    autoCheckAt: "2026-09-08T10:00:00.000Z",
    createdAt: "2026-09-08T09:00:00.000Z",
    updatedAt: "2026-09-08T10:00:00.000Z",
  };
}

function montar(submission: ProjectSubmission | null) {
  render(
    <ProjetoEntrega
      projectId="landing-page-pessoal"
      isPro={false}
      tipoEntrega="repo_deploy"
      checks={["deploy_responde", "repo_publico"]}
      submission={submission}
      status="pronto"
      onEntregar={vi.fn(async () => {})}
      onVerificar={vi.fn(async () => {})}
    />,
  );
}

afterEach(cleanup);

describe("o bloco de destaque do que falta", () => {
  it("com duas falhando, diz quantas faltam e lista so elas", () => {
    // O caso da Ana, reduzido: as duas que falharam sao exatamente as que
    // deveriam ter impedido o "Projeto concluido!".
    montar(
      entrega([
        { check: "deploy_responde", status: "ok", mensagem: "responde" },
        { check: "repo_publico", status: "ok", mensagem: "publico" },
        {
          check: "arquivo:index.html",
          status: "falhou",
          mensagem: "não encontrado na raiz",
        },
        {
          check: "readme_tem_link_deploy",
          status: "falhou",
          mensagem: "sem link do site",
        },
      ]),
    );

    const titulo = screen.getByText("Falta 2 para verificar");
    const bloco = within(titulo.parentElement as HTMLElement);
    expect(bloco.getByText("Tem index.html")).toBeTruthy();
    expect(bloco.getByText("O README tem o link do site")).toBeTruthy();
    expect(bloco.queryByText("O site responde")).toBeNull();
    expect(bloco.queryByText("O repositório é público")).toBeNull();
    expect(bloco.getAllByRole("listitem")).toHaveLength(2);
    expect(screen.queryByText("Tudo conferido")).toBeNull();
  });

  it("cada uma que falhou traz o que fazer", () => {
    montar(
      entrega([
        {
          check: "arquivo:index.html",
          status: "falhou",
          mensagem: "não encontrado",
        },
        {
          check: "readme_tem_link_deploy",
          status: "falhou",
          mensagem: "sem link",
        },
      ]),
    );

    expect(
      screen.getByText(
        "Coloque o arquivo na raiz do repositório, não dentro de uma pasta.",
      ),
    ).toBeTruthy();
    expect(
      screen.getByText("Coloque o link do site no ar dentro do README."),
    ).toBeTruthy();
  });

  it("uma so falhando usa o singular", () => {
    montar(
      entrega([
        { check: "deploy_responde", status: "ok", mensagem: "ok" },
        { check: "min_commits_5", status: "falhou", mensagem: "3 commits" },
      ]),
    );

    expect(screen.getByText("Falta 1 para verificar")).toBeTruthy();
    expect(
      screen.getByText("Faça commits menores, um por etapa do projeto."),
    ).toBeTruthy();
  });

  it("tudo passando mostra Tudo conferido e nenhum destaque", () => {
    montar(
      entrega([
        { check: "deploy_responde", status: "ok", mensagem: "ok" },
        { check: "repo_publico", status: "ok", mensagem: "ok" },
      ]),
    );

    expect(screen.getByText("Tudo conferido")).toBeTruthy();
    expect(screen.queryByText(/Falta \d+ para verificar/)).toBeNull();
    expect(screen.queryByText("Falta 1 para verificar")).toBeNull();
  });
});

describe("erro nao e falha", () => {
  it("uma em erro aparece numa linha a parte, e nao no bloco do que falta", () => {
    // "Nao consegui conferir" nao pede conserto: pede outra tentativa. Mandar
    // consertar o que talvez esteja certo e pior que nao dizer nada.
    montar(
      entrega([
        { check: "deploy_responde", status: "ok", mensagem: "ok" },
        { check: "repo_publico", status: "erro", mensagem: "timeout" },
      ]),
    );

    expect(screen.getByText(/Não conseguimos conferir agora/)).toBeTruthy();
    expect(screen.queryByText(/Falta \d+ para verificar/)).toBeNull();
    expect(screen.queryByText("Falta 1 para verificar")).toBeNull();
    // Inconclusiva nao e conferida: sem "Tudo conferido" enquanto houver erro.
    expect(screen.queryByText("Tudo conferido")).toBeNull();
    expect(
      screen.queryByText(
        "Deixe o repositório público em Settings, Danger Zone.",
      ),
    ).toBeNull();
  });

  it("erro junto com falha: as duas coisas aparecem, separadas", () => {
    montar(
      entrega([
        { check: "min_commits_5", status: "falhou", mensagem: "2 commits" },
        { check: "repo_publico", status: "erro", mensagem: "timeout" },
      ]),
    );

    expect(screen.getByText("Falta 1 para verificar")).toBeTruthy();
    expect(screen.getByText(/Não conseguimos conferir agora/)).toBeTruthy();
  });
});

describe("a frase de honestidade aparece nos dois momentos", () => {
  it("antes de entregar, junto do que a gente confere sozinho", () => {
    montar(null);

    expect(screen.getByText("O que a gente confere sozinho")).toBeTruthy();
    expect(screen.getByText(HONESTIDADE)).toBeTruthy();
  });

  it("depois de entregar, junto do resultado", () => {
    montar(
      entrega([
        { check: "deploy_responde", status: "ok", mensagem: "ok" },
        { check: "repo_publico", status: "falhou", mensagem: "privado" },
      ]),
    );

    expect(screen.getByText(HONESTIDADE)).toBeTruthy();
  });

  it("em projeto de codigo, aponta quem de fato julga", () => {
    montar(null);

    expect(
      screen.getByText(
        "Quem confere isso é a validação com IA, que lê seu código e confere cada requisito.",
      ),
    ).toBeTruthy();
  });

  it("em projeto que nao e de codigo, nao promete validacao com IA", () => {
    render(
      <ProjetoEntrega
        projectId="dashboard-power-bi"
        isPro={false}
        tipoEntrega="dashboard"
        checks={["artefato_responde"]}
        submission={null}
        status="pronto"
        onEntregar={vi.fn(async () => {})}
        onVerificar={vi.fn(async () => {})}
      />,
    );

    expect(screen.getByText(HONESTIDADE)).toBeTruthy();
    expect(
      screen.queryByText(/validação com IA, que lê seu código/),
    ).toBeNull();
  });
});
