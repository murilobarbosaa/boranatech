import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";

import { BoardToolbar } from "./BoardToolbar";
// `EMPTY_FILTERS` da FONTE, nao uma copia escrita aqui: um filtro novo entra no
// tipo e neste objeto de uma vez, e o teste acompanha sem ninguem lembrar.
import { EMPTY_FILTERS } from "./taskFilters";

/**
 * A TOOLBAR EM DUAS LINHAS CENTRADAS.
 *
 * O que este arquivo trava e a RELACAO entre busca e controles, nao a aparencia
 * de cada um: os dois moram no MESMO wrapper central, entao a largura da busca e
 * a largura em que a linha de controles abre, sem numero repetido em dois
 * lugares. Foi assim que a Ana descreveu o desenho, e e a parte que uma mexida
 * futura desfaz sem perceber (basta alguem dar largura propria a um dos dois).
 *
 * As asercoes sao de ESTRUTURA (quem contem quem) e nao de pixel: jsdom nao
 * calcula layout, entao afirmar largura renderizada aqui seria afirmar zero.
 */

function montar(over: Record<string, unknown> = {}) {
  return render(
    <BoardToolbar
      boards={[{ id: "b1", key: "DEV", name: "Dev" } as never]}
      activeBoardId="b1"
      admins={[]}
      labels={[]}
      filters={EMPTY_FILTERS}
      groupBy="column"
      view="board"
      includeArchived={false}
      visibleCount={44}
      totalCount={44}
      onSelectBoard={vi.fn()}
      onFiltersChange={vi.fn()}
      onGroupByChange={vi.fn()}
      onViewChange={vi.fn()}
      onIncludeArchivedChange={vi.fn()}
      onClearFilters={vi.fn()}
      onManageBoards={vi.fn()}
      {...over}
    />,
  );
}

afterEach(cleanup);

describe("toolbar: busca em cima, controles embaixo, tudo no mesmo centro", () => {
  it("busca e controles sao FILHOS do mesmo wrapper central", () => {
    // O PAR. Uma asercao so ("a busca esta centrada") aceitaria uma toolbar em
    // que os controles morassem em outro contêiner de outra largura, que e
    // exatamente o desalinhamento que o desenho veio corrigir.
    montar();
    const wrapper = screen.getByTestId("tasks-toolbar");
    const busca = screen.getByTestId("tasks-toolbar-busca");
    const controles = screen.getByTestId("tasks-toolbar-controles");

    expect(wrapper.contains(busca)).toBe(true);
    expect(wrapper.contains(controles)).toBe(true);
    expect(busca.parentElement).toBe(wrapper);
    expect(controles.parentElement).toBe(wrapper);
  });

  it("o wrapper e que centra e limita; a busca so ocupa a largura dele", () => {
    montar();
    const wrapper = screen.getByTestId("tasks-toolbar");
    const busca = screen.getByTestId("tasks-toolbar-busca");

    expect(wrapper.className).toContain("mx-auto");
    expect(wrapper.className).toContain("max-w-3xl");
    // A busca NAO tem teto proprio: se ganhar um, ela e os controles deixam de
    // abrir na mesma medida e o numero passa a existir em dois lugares.
    expect(busca.className).toContain("w-full");
    expect(busca.className).not.toContain("max-w-");
  });

  it("a busca vem ANTES dos controles na ordem do documento", () => {
    // "Uma linha abaixo dela" e ordem, nao so posicionamento visual: quem navega
    // por teclado percorre nesta sequencia.
    montar();
    const wrapper = screen.getByTestId("tasks-toolbar");
    const filhos = Array.from(wrapper.children);
    const iBusca = filhos.indexOf(screen.getByTestId("tasks-toolbar-busca"));
    const iControles = filhos.indexOf(
      screen.getByTestId("tasks-toolbar-controles"),
    );

    expect(iBusca).toBeGreaterThanOrEqual(0);
    expect(iControles).toBeGreaterThan(iBusca);
  });

  it("os controles abrem na largura da busca e quebram CENTRADOS no estreito", () => {
    montar();
    const controles = screen.getByTestId("tasks-toolbar-controles");

    expect(controles.className).toContain("w-full");
    expect(controles.className).toContain("sm:justify-between");
    // Abaixo de sm o centro manda: `justify-between` com duas linhas desiguais
    // deixaria o ultimo controle sozinho num canto.
    expect(controles.className).toContain("justify-center");
    // E nada de rolagem horizontal na barra: ela QUEBRA.
    expect(controles.className).toContain("flex-wrap");
    expect(controles.className).not.toContain("overflow-x");
  });

  it("os quatro controles continuam na linha de baixo", () => {
    // CONTROLE do controle: sem isto, uma toolbar que perdesse um dos controles
    // no rearranjo passaria em todas as asercoes de classe acima.
    montar();
    const controles = screen.getByTestId("tasks-toolbar-controles");

    expect(controles.textContent).toContain("Quadro");
    expect(controles.textContent).toContain("Agrupar por");
    expect(controles.textContent).toContain("Filtros");
    expect(controles.textContent).toContain("Board");
    expect(controles.textContent).toContain("Lista");
    // E a busca NAO ficou para tras na linha de controles.
    expect(controles.querySelector("#tasks-search")).toBeNull();
  });

  it("a contagem fecha a pilha, dentro do mesmo wrapper", () => {
    montar();
    const wrapper = screen.getByTestId("tasks-toolbar");
    const contagem = screen.getByText("44 tarefas");

    expect(wrapper.contains(contagem)).toBe(true);
  });
});
