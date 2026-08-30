import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { DndContext } from "@dnd-kit/core";

import { BoardColumn } from "./BoardColumn";
import { BoardColumnsSkeleton } from "./TasksPanelSkeleton";
import {
  boardRowClass,
  boardScrollClass,
  columnShellClass,
} from "./taskBoardStyles";
import type { TaskGroup } from "./taskFilters";

/**
 * O esqueleto de carregamento tem a MOLDURA da coluna real.
 *
 * Antes, ele era um retangulo cinza de borda fina ao lado de colunas de moldura
 * grossa, cantos arredondados, sombra dura e faixa colorida no topo: o
 * carregamento parecia outra tela, e nao esta tela chegando. Pior que o
 * desencontro visual, a largura era outra, entao a chegada dos dados fazia o
 * board saltar.
 *
 * O jsdom NAO faz layout: nao ha como medir aqui se as larguras batem. O que
 * este arquivo trava e a FONTE UNICA: as duas pontas leem `columnShellClass`, e
 * o teste afirma a constante em vez de repetir a lista de classes. Repetir a
 * lista faria o teste passar a mentir no dia em que a moldura evoluisse, que e
 * justamente o dia em que ele precisa continuar dizendo a verdade. A conferencia
 * de que a moldura esta bonita e o OK visual, como sempre.
 */

const GRUPO: TaskGroup = {
  id: "col-1",
  value: "col-1",
  label: "Backlog",
  color: "#e11d48",
  tasks: [],
  totalBeforeFilter: 0,
};

function renderColunaReal() {
  return render(
    <DndContext>
      <BoardColumn
        group={GRUPO}
        column={null}
        boardKey="DEV"
        labelsById={new Map()}
        assigneesById={new Map()}
        canMoveLeft={false}
        canMoveRight={false}
        selectedTaskId={null}
        pendingTaskIds={new Set()}
        isDropTarget={false}
        canReorder
        filtersActive={false}
        onOpenTask={vi.fn()}
        onQuickMove={vi.fn()}
        onUnarchive={vi.fn()}
        onCreateTask={vi.fn()}
        onRenameColumn={vi.fn()}
        onRecolorColumn={vi.fn()}
        onRequestWipLimit={vi.fn()}
        onMoveColumn={vi.fn()}
        onRequestDeleteColumn={vi.fn()}
        onClearFilters={vi.fn()}
      />
    </DndContext>,
  );
}

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("esqueleto e coluna real compartilham a moldura", () => {
  it("TODA coluna do esqueleto usa a constante da moldura", () => {
    const { container } = render(<BoardColumnsSkeleton />);
    const colunas = Array.from(container.querySelectorAll("div > div"));

    // Nao basta "alguma" coluna: uma so fora do padrao ja produz a fileira
    // desalinhada que originou este commit.
    const comMoldura = colunas.filter((coluna) =>
      coluna.className.includes(columnShellClass),
    );
    expect(comMoldura.length).toBe(4);
  });

  it("a coluna REAL usa a MESMA constante", () => {
    // O segundo lado do trato. Sem esta metade, alguem poderia reescrever a
    // className da coluna real na mao, o esqueleto continuaria verde sozinho e
    // as duas voltariam a divergir em silencio.
    renderColunaReal();
    const secao = screen.getByLabelText("Etapa Backlog");

    expect(secao.className).toContain(columnShellClass);
  });

  it("o esqueleto usa a MOLDURA DA FILEIRA, nao uma propria", () => {
    // O terceiro lado do trato, e o que a Ana pegou na captura: com moldura
    // propria o esqueleto ancorava a esquerda e deixava deserto a direita no
    // modo largo, e ao chegar os dados a fileira PULAVA para o centro.
    //
    // As duas pecas afirmadas juntas: o contêiner que rola e o miolo que centra.
    // So a primeira aceitaria um esqueleto que rolasse sem centrar.
    const { container } = render(<BoardColumnsSkeleton />);
    const scroll = container.querySelector<HTMLElement>(
      '[data-testid="board-scroll"]',
    );
    const row = container.querySelector<HTMLElement>(
      '[data-testid="board-row"]',
    );

    expect(scroll, "o esqueleto perdeu o contêiner de rolagem").toBeTruthy();
    expect(row, "o esqueleto perdeu o miolo").toBeTruthy();
    expect(scroll!.className).toBe(boardScrollClass);
    expect(row!.className).toBe(boardRowClass);
    // E o miolo mora DENTRO do contêiner de rolagem, nao ao lado.
    expect(scroll!.contains(row!)).toBe(true);
  });

  it("a CENTRAGEM vive no miolo, nunca no contêiner que rola", () => {
    // A ARMADILHA deste desenho, e ela so aparece com o quadro cheio.
    // `justify-center` num elemento com `overflow-x-auto` empurra o excedente
    // para os DOIS lados: o inicio da fileira sai antes do scrollLeft = 0 e a
    // primeira coluna fica INALCANCAVEL. `w-max mx-auto` no miolo centra quando
    // cabe e colapsa para zero quando nao cabe.
    //
    // Afirmado nos dois sentidos porque so o positivo aceitaria as duas
    // centragens convivendo, que e o bug de volta com um teste verde ao lado.
    render(<BoardColumnsSkeleton />);
    expect(boardRowClass).toContain("mx-auto");
    expect(boardRowClass).toContain("w-max");
    expect(boardScrollClass).toContain("overflow-x-auto");
    expect(boardScrollClass).not.toContain("justify-center");
    expect(boardScrollClass).not.toContain("mx-auto");
  });

  it("a faixa do topo do esqueleto e NEUTRA, nao uma cor de etapa", () => {
    // A cor da faixa e por etapa e vem do servidor: durante o carregamento ela
    // ainda nao existe. Faixa neutra e a ausencia honesta.
    const { container } = render(<BoardColumnsSkeleton />);
    const coluna = container.querySelector<HTMLElement>(
      'div > div[style*="border-top-width"]',
    );

    expect(coluna, "coluna do esqueleto sem faixa no topo").toBeTruthy();
    expect(coluna!.style.borderTopWidth).toBe("6px");
    expect(coluna!.style.borderTopColor).toBe("rgb(203, 213, 225)");
  });
});
