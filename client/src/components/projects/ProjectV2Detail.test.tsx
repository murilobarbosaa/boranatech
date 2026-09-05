import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import ProjectV2Detail from "@/components/projects/ProjectV2Detail";
import type { ProjetoCatalogo } from "@shared/projects/catalog";
import type { ProjetoV2Detalhe } from "@shared/projects/v2/types";

// Fixture propria, nao o conteudo real de landing-page-pessoal: o teste
// verifica o COMPONENTE, e amarra-lo ao texto editorial faria toda revisao de
// copy quebrar um teste de render. O conteudo real tem os proprios guards em
// shared/projects/v2/v2.test.ts.

const VIDEO = "https://www.youtube.com/watch?v=SV7TL0hxmIQ";

const projeto = {
  id: "proj-teste",
  nome: "Projeto de Teste",
  areaSlug: "frontend",
  nivel: "Iniciante",
  objetivo: "objetivo v1",
  ferramentas: ["HTML"],
  passosSimplificados: ["passo v1"],
  entregavel: "entregavel v1",
  comoPublicar: "GitHub Pages",
  sugestaoLinkedIn: "post v1",
  proximoProjeto: "Texto livre do proximo",
} as ProjetoCatalogo;

const req = (n: number) => ({
  id: `req-${n}`,
  descricao: `Requisito numero ${n}`,
  verificacao: `Como verificar ${n}`,
});

const etapa = (id: string, titulo: string) => ({
  id,
  titulo,
  tempo: "1 h",
  oQueFazer: [`Faca ${id}`],
  prontoQuando: `Pronto ${id}`,
});

const detalhe: ProjetoV2Detalhe = {
  id: "proj-teste",
  tipoEntrega: "repo_deploy",
  briefing: {
    contexto: "Contexto do projeto de teste.",
    aprende: ["Aprende A", "Aprende B", "Aprende C"],
    preRequisitos: [{ rotulo: "Saber HTML", href: "/dicionario?termo=HTML" }],
    tempoEstimado: { horas: [6, 10], semanas: [1, 2] },
  },
  requisitos: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(req),
  etapas: [
    etapa("planejar", "Planejar"),
    etapa("html", "Estrutura em HTML"),
    etapa("css", "Estilo em CSS"),
    etapa("celular", "Celular"),
    etapa("publicar", "Publicar"),
  ],
  kit: [
    { tipo: "modelo", titulo: "Modelo sem url", nota: "Nota do modelo" },
    { tipo: "link", titulo: "Google Fonts", url: "https://fonts.google.com" },
  ],
  ajuda: {
    video: { titulo: "Video de teste", url: VIDEO },
    trilha: { slug: "frontend", nodeIds: ["html.semantica"] },
    termos: ["HTML", "CSS"],
  },
  verificacaoAutomatica: ["deploy_responde", "repo_publico"],
};

function renderizar(over: Partial<Parameters<typeof ProjectV2Detail>[0]> = {}) {
  const onToggleEtapa = vi.fn();
  render(
    <ProjectV2Detail
      projeto={projeto}
      detalhe={detalhe}
      etapasMarcadas={{}}
      onToggleEtapa={onToggleEtapa}
      {...over}
    >
      <div>bloco-de-entrega</div>
    </ProjectV2Detail>,
  );
  return { onToggleEtapa };
}

// Sem auto-cleanup nesta suite (mesmo padrao do TrophyCard.test.tsx): sem
// isto o DOM do teste anterior sobra e todo getBy* acha dois elementos.
afterEach(cleanup);

describe("ProjectV2Detail", () => {
  it("mostra os sete blocos", () => {
    renderizar();
    for (const titulo of [
      "Por que este projeto",
      "O que precisa estar lá no fim",
      "Etapas",
      "Kit",
      "Se travar",
      "Entrega",
      "Depois",
    ])
      expect(screen.getByText(titulo), `bloco ausente: ${titulo}`).toBeTruthy();
  });

  it("numera os 10 requisitos e nao mostra a verificacao", () => {
    renderizar();
    for (let n = 1; n <= 10; n += 1)
      expect(screen.getByText(`Requisito numero ${n}`)).toBeTruthy();
    // `verificacao` e instrucao para quem avalia, nao para quem constroi.
    expect(screen.queryByText("Como verificar 1")).toBeNull();
  });

  it("tem uma caixa por etapa e o contador comeca em zero", () => {
    renderizar();
    expect(screen.getAllByRole("checkbox")).toHaveLength(5);
    expect(screen.getByText("0 de 5 etapas")).toBeTruthy();
  });

  it("clicar numa etapa chama onToggleEtapa com o id certo", () => {
    const { onToggleEtapa } = renderizar();
    fireEvent.click(screen.getByRole("checkbox", { name: "Celular" }));
    expect(onToggleEtapa).toHaveBeenCalledTimes(1);
    expect(onToggleEtapa).toHaveBeenCalledWith("celular");
  });

  it("etapa marcada fica aria-checked e conta no total", () => {
    renderizar({ etapasMarcadas: { html: "2026-09-05T07:00:00.000Z" } });
    expect(
      screen
        .getByRole("checkbox", { name: "Estrutura em HTML" })
        .getAttribute("aria-checked"),
    ).toBe("true");
    expect(
      screen
        .getByRole("checkbox", { name: "Planejar" })
        .getAttribute("aria-checked"),
    ).toBe("false");
    expect(screen.getByText("1 de 5 etapas")).toBeTruthy();
  });

  it("o video aponta pra URL real e nunca para busca do YouTube", () => {
    const { container } = render(
      <ProjectV2Detail
        projeto={projeto}
        detalhe={detalhe}
        etapasMarcadas={{}}
        onToggleEtapa={vi.fn()}
      />,
    );
    const link = screen.getByText("Video de teste").closest("a");
    expect(link?.getAttribute("href")).toBe(VIDEO);
    expect(container.innerHTML).not.toContain("results?search_query");
  });

  it("kit sem url mostra a nota; com url vira link externo", () => {
    renderizar();
    expect(screen.getByText("Nota do modelo")).toBeTruthy();
    const link = screen.getByText("Google Fonts").closest("a");
    expect(link?.getAttribute("href")).toBe("https://fonts.google.com");
    expect(link?.getAttribute("rel")).toContain("noopener");
  });

  it("children aparece dentro do bloco Entrega", () => {
    renderizar();
    const entrega = screen.getByText("Entrega").closest("section");
    expect(entrega?.textContent).toContain("bloco-de-entrega");
  });

  it("sem proximo cai no texto livre da v1", () => {
    renderizar();
    expect(screen.getByText("Texto livre do proximo")).toBeTruthy();
  });

  it("com proximo vira link por id", () => {
    renderizar({ proximo: { id: "outro-projeto", nome: "Outro Projeto" } });
    const link = screen.getByText("Outro Projeto").closest("a");
    expect(link?.getAttribute("href")).toBe("/projetos/outro-projeto");
    expect(screen.queryByText("Texto livre do proximo")).toBeNull();
  });
});
