import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { rotuloDeBadge, UserSiteLife, type VidaNoSite } from "./UserSiteLife";

/**
 * A seção "Vida no site" no modal do admin.
 *
 * O que ela não pode fazer é dizer "esta pessoa não tem nada" quando na verdade
 * uma fonte não respondeu. Por isso a maior parte destes testes separa VAZIO de
 * INDISPONÍVEL: são o mesmo pixel em branco e significados opostos.
 */

afterEach(cleanup);

function vida(over: Partial<VidaNoSite> = {}): VidaNoSite {
  return {
    certificados: { itens: [], mais: 0 },
    badges: { itens: [], mais: 0 },
    roadmaps: { itens: [], mais: 0 },
    trilhas: { itens: [], mais: 0 },
    ...over,
  };
}

describe("rotuloDeBadge", () => {
  it("traduz o id pelo catálogo compartilhado", () => {
    expect(rotuloDeBadge("first-step")).toBe("Primeiro passo");
  });

  it("FALLBACK: badge que o bundle não conhece aparece pelo id cru", () => {
    // Contrato da casa. Sumir com a linha esconderia uma conquista real, e
    // inventar um nome seria pior que o id feio.
    expect(rotuloDeBadge("badge-que-nao-existe")).toBe("badge-que-nao-existe");
  });
});

describe("render com dados", () => {
  it("mostra certificado, conquista, roadmap e trilha", () => {
    render(
      <UserSiteLife
        vida={vida({
          certificados: {
            itens: [
              {
                codigo: "BNT-2026-ABC",
                titulo: "Front-end",
                emitidoEm: "2026-08-01T12:00:00Z",
              },
            ],
            mais: 0,
          },
          badges: {
            itens: [{ badgeId: "first-step", desbloqueadoEm: null }],
            mais: 0,
          },
          roadmaps: {
            itens: [
              {
                roadmapId: "r1",
                titulo: "Dados",
                passosConcluidos: 3,
                passosTotais: 10,
                ultimaAtividadeEm: null,
              },
            ],
            mais: 0,
          },
          trilhas: {
            itens: [
              {
                slug: "python-basico",
                titulo: "Python básico",
                itensConcluidos: 7,
                ultimaAtividadeEm: null,
              },
            ],
            mais: 0,
          },
        })}
      />,
    );

    expect(screen.getByText("Front-end")).toBeTruthy();
    expect(screen.getByText(/BNT-2026-ABC/)).toBeTruthy();
    expect(screen.getByText("Primeiro passo")).toBeTruthy();
    expect(screen.getByText("Dados")).toBeTruthy();
    expect(screen.getByText(/3 de 10 passos/)).toBeTruthy();
    expect(screen.getByText("Python básico")).toBeTruthy();
    expect(screen.getByText(/7 itens concluídos/)).toBeTruthy();
  });

  it("trilha SEM título cai no slug, que é feio e verdadeiro", () => {
    render(
      <UserSiteLife
        vida={vida({
          trilhas: {
            itens: [
              {
                slug: "trilha-estatica",
                titulo: null,
                itensConcluidos: 1,
                ultimaAtividadeEm: null,
              },
            ],
            mais: 0,
          },
        })}
      />,
    );
    expect(screen.getByText("trilha-estatica")).toBeTruthy();
  });
});

describe("fonte indisponível x vazio", () => {
  it("fonte indisponível aparece NOMEADA, não some", () => {
    render(<UserSiteLife vida={vida({ badges: { indisponivel: true } })} />);
    expect(screen.getByTestId("vida-badges-indisponivel")).toBeTruthy();
  });

  it("uma fonte caída NÃO derruba as outras", () => {
    render(
      <UserSiteLife
        vida={vida({
          certificados: { indisponivel: true },
          badges: {
            itens: [{ badgeId: "first-step", desbloqueadoEm: null }],
            mais: 0,
          },
        })}
      />,
    );
    expect(screen.getByTestId("vida-certificados-indisponivel")).toBeTruthy();
    expect(screen.getByText("Primeiro passo")).toBeTruthy();
  });

  it("tudo vazio E todas responderam: vazio NOMEADO", () => {
    render(<UserSiteLife vida={vida()} />);
    expect(screen.getByTestId("vida-vazio")).toBeTruthy();
  });

  it("CONTROLE NEGATIVO: com fonte caída NÃO diz 'ainda não há atividade'", () => {
    // O teste que decide o desenho. Sem ele, "sem dado" e "não consegui olhar"
    // renderizariam a mesma frase, e o admin leria uma afirmação sobre algo que
    // ninguém verificou.
    render(<UserSiteLife vida={vida({ roadmaps: { indisponivel: true } })} />);
    expect(screen.queryByTestId("vida-vazio")).toBeNull();
    expect(screen.getByTestId("vida-roadmaps-indisponivel")).toBeTruthy();
  });
});

describe("resto nomeado", () => {
  it("'e mais N' aparece quando o servidor cortou", () => {
    render(
      <UserSiteLife
        vida={vida({
          certificados: {
            itens: [{ codigo: "c1", titulo: "T", emitidoEm: null }],
            mais: 4,
          },
        })}
      />,
    );
    expect(screen.getByTestId("vida-resto").textContent).toContain("4");
  });

  it("CONTROLE NEGATIVO: sem resto, nada é inventado", () => {
    render(
      <UserSiteLife
        vida={vida({
          certificados: {
            itens: [{ codigo: "c1", titulo: "T", emitidoEm: null }],
            mais: 0,
          },
        })}
      />,
    );
    expect(screen.queryByTestId("vida-resto")).toBeNull();
  });
});

describe("estados de carga", () => {
  it("loading e erro são estados próprios, não vazio", () => {
    const { rerender } = render(<UserSiteLife vida={null} loading />);
    expect(screen.getByTestId("vida-loading")).toBeTruthy();

    rerender(<UserSiteLife vida={null} error="Erro ao buscar." />);
    expect(screen.getByTestId("vida-erro").textContent).toContain(
      "Erro ao buscar.",
    );
    expect(screen.queryByTestId("vida-vazio")).toBeNull();
  });

  it("payload degradado não vira TypeError", () => {
    // Janela de deploy: backend antigo sem os campos novos.
    render(<UserSiteLife vida={{} as VidaNoSite} />);
    expect(screen.getByTestId("vida-vazio")).toBeTruthy();
  });
});
