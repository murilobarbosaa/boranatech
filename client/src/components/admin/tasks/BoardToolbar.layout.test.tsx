import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";

import { BoardToolbar } from "./BoardToolbar";
// `EMPTY_FILTERS` da FONTE, nao uma copia escrita aqui: um filtro novo entra no
// tipo e neste objeto de uma vez, e o teste acompanha sem ninguem lembrar.
import { EMPTY_FILTERS } from "./taskFilters";

/**
 * A TOOLBAR: disposicao historica, busca com teto.
 *
 * HISTORICO, porque a forma deste arquivo e a lição. Ele nasceu travando uma
 * toolbar EMPILHADA (busca em cima, controles centrados embaixo), que a Ana
 * vetou dois dias depois: a disposicao lateral de antes voltou, e so a LARGURA
 * da busca ficou. Os testes vieram junto, e e por isso que eles afirmam a
 * disposicao ATUAL em vez de guardarem a anterior "por garantia": teste que
 * descreve uma tela que nao existe mais nao protege nada e atrapalha a leitura.
 *
 * O que sobrou de verdadeiro nos dois desenhos, e o que este arquivo trava: a
 * busca tem UM teto e ele mora nela, nao num wrapper em volta. Foi a parte que
 * a Ana aprovou, e e a que uma mexida futura desfaz sem perceber.
 *
 * As asercoes sao de ESTRUTURA (quem contem quem, que classe carrega o teto) e
 * nao de pixel: jsdom nao calcula layout, entao afirmar largura renderizada
 * aqui seria afirmar zero.
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

describe("toolbar: disposicao lateral, com teto na busca", () => {
  it("a busca divide a MESMA linha com os demais controles", () => {
    // A disposicao restaurada. Se alguem empilhar a busca de novo (o desenho
    // vetado), ela deixa de ser irma dos controles e este teste cai.
    montar();
    const busca = screen.getByTestId("tasks-toolbar-busca");
    const linha = busca.parentElement as HTMLElement;

    expect(linha.className).toContain("flex");
    // Os vizinhos na MESMA linha, nao numa de baixo.
    expect(linha.textContent).toContain("Quadro");
    expect(linha.textContent).toContain("Agrupar por");
    expect(linha.textContent).toContain("Filtros");
    expect(linha.textContent).toContain("Board");
    expect(linha.textContent).toContain("Lista");
  });

  it("a busca cresce ATE um teto, em vez de esticar com a fileira", () => {
    // A largura aprovada. `flex-1` sozinho faria ela absorver toda a sobra do
    // monitor largo, que era o estado antes da rodada; o `max-w` e o que a Ana
    // gostou, e ele vive NA BUSCA, nao num wrapper em volta dela.
    montar();
    const busca = screen.getByTestId("tasks-toolbar-busca");

    expect(busca.className).toContain("flex-1");
    expect(busca.className).toContain("max-w-2xl");
    // E o piso continua: sem ele a busca some numa fileira apertada.
    expect(busca.className).toContain("min-w-[13rem]");
  });

  it("o campo ocupa a largura do bloco, e o teto e do bloco", () => {
    // O par. Um teto no bloco com um input de largura fixa dentro daria duas
    // larguras concorrentes, e a menor venceria em silencio.
    montar();
    const busca = screen.getByTestId("tasks-toolbar-busca");
    const input = busca.querySelector("#tasks-search") as HTMLElement;

    expect(input).toBeTruthy();
    expect(input.className).toContain("w-full");
    expect(input.className).not.toContain("max-w-");
  });

  it("NAO existe wrapper central empilhando a barra", () => {
    // CONTROLE NEGATIVO do desenho vetado. Sem ele, alguem poderia reintroduzir
    // a pilha centrada mantendo o teto da busca, e as asercoes acima passariam.
    montar();
    expect(screen.queryByTestId("tasks-toolbar-controles")).toBeNull();
  });

  it("a toolbar centra na REGUA DA PAGINA, o mesmo espelho do cabecalho", () => {
    // Cabecalho e toolbar na mesma regua; so o quadro fica solto. O numero e o
    // do `.container` (1280px = 80rem), repetido aqui de proposito: se a fonte
    // mudar e este teste nao, a divergencia aparece em vez de passar batida.
    montar();
    const toolbar = screen.getByTestId("tasks-toolbar");

    expect(toolbar.className).toContain("lg:mx-auto");
    expect(toolbar.className).toContain("lg:max-w-[80rem]");
    // `w-full` para que, dentro do contêiner (modo normal), ela ocupe a largura
    // disponivel em vez de encolher para o conteudo.
    expect(toolbar.className).toContain("w-full");
  });

  it("a contagem continua fora da linha de controles", () => {
    montar();
    const contagem = screen.getByText("44 tarefas");
    const busca = screen.getByTestId("tasks-toolbar-busca");

    expect(contagem).toBeTruthy();
    // Ela vive na propria faixa, abaixo da linha, como sempre viveu.
    expect((busca.parentElement as HTMLElement).contains(contagem)).toBe(false);
  });
});
