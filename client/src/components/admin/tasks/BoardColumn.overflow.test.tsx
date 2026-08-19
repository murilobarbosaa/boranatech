import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { DndContext } from "@dnd-kit/core";

import { BoardColumn } from "./BoardColumn";
import type { TaskGroup } from "./taskFilters";
import type { TaskCard, TaskLabel } from "./types";

/**
 * SCROLL LATERAL na coluna do kanban, causado por token sem espaco.
 *
 * O jsdom NAO faz layout: `getBoundingClientRect` devolve zeros, entao nao ha
 * como perguntar aqui "o card estourou a largura?". O que este arquivo trava e
 * a REGRA nas classes, mesmo padrao dos testes de alinhamento dos cards da
 * Visao. A largura de verdade se confere no navegador, e por isso a frente tem
 * rodada de OK visual.
 *
 * A CADEIA que produzia a barra, e que estas tres asercoes cobrem uma a uma:
 *
 *   1. o titulo do Sentry vem sem um unico espaco
 *      (`window.webkit.messageHandlers...`), entao o min-content dele e a linha
 *      inteira. `[overflow-wrap:anywhere]` entra nesse calculo;
 *      `break-words` NAO entra, so quebra no desenho, e o card continuaria
 *      largo. E por isso que o teste afirma a classe exata;
 *   2. o card e item de flex sem `min-w-0`, entao ele nao podia encolher abaixo
 *      desse min-content;
 *   3. a lista tinha `overflow-y-auto` e `overflow-x` implicito. Pela spec de
 *      overflow, um eixo `visible` ao lado de um eixo que nao e `visible`
 *      computa para `auto`: a barra horizontal nascia dai, sem ninguem a ter
 *      pedido.
 *
 * A renderizacao e a REAL (BoardColumn montando TaskCard dentro do DndContext),
 * e nao um stub de cada componente: as classes precisam estar nos elementos como
 * a tela de fato os compoe, nao num elemento equivalente.
 */

// Titulo real de um card da coluna SENTRY: 62 caracteres, zero espacos.
const TITULO_SEM_ESPACO =
  "window.webkit.messageHandlers.reactNative.postMessage.is.not.a.function";

// Nome de etiqueta tambem e texto do usuario, e cabe token longo do mesmo jeito.
const LABEL_SEM_ESPACO = "regressao-critica-checkout-pix-webhook-idempotencia";

const LABEL: TaskLabel = {
  id: "label-1",
  board_id: "board-1",
  name: LABEL_SEM_ESPACO,
  color: "#ffb800",
  created_at: "2026-08-01T00:00:00Z",
  updated_at: "2026-08-01T00:00:00Z",
};

const TAREFA: TaskCard = {
  id: "task-1",
  board_id: "board-1",
  column_id: "col-1",
  number: 42,
  title: TITULO_SEM_ESPACO,
  description: null,
  notes: null,
  position: 1,
  priority: "alta",
  type: "bug",
  assignee_id: null,
  created_by: "admin-1",
  updated_by: null,
  due_date: null,
  estimate: null,
  completed_at: null,
  archived_at: null,
  created_at: "2026-08-18T00:00:00Z",
  updated_at: "2026-08-18T00:00:00Z",
  source: "sentry",
  sentry_issue_id: "NODE-EXPRESS-1",
  sentry_issue_url: "https://sentry.io/x",
  sentry_reopen_event_at: null,
  sentry_detalhe_incompleto: false,
  archived_source: null,
  label_ids: [LABEL.id],
  checklist_total: 0,
  checklist_done: 0,
  comment_count: 0,
};

const GRUPO: TaskGroup = {
  id: "col-1",
  value: "col-1",
  label: "Sentry",
  color: "#e11d48",
  tasks: [TAREFA],
  totalBeforeFilter: 1,
};

function renderColuna(group: TaskGroup = GRUPO) {
  return render(
    <DndContext>
      <BoardColumn
        group={group}
        column={null}
        boardKey="DEV"
        labelsById={new Map([[LABEL.id, LABEL]])}
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

/** O `<article>` do card, alcancado pelo aria-label que ele mesmo monta. */
function cardDaTarefa(): HTMLElement {
  return screen.getByLabelText(`DEV-42: ${TITULO_SEM_ESPACO}`);
}

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("token longo nao gera scroll lateral na coluna", () => {
  it("o titulo quebra por `anywhere`, que participa do min-content", () => {
    renderColuna();
    const titulo = screen.getByText(TITULO_SEM_ESPACO);

    expect(titulo.className.split(/\s+/)).toContain("[overflow-wrap:anywhere]");
    // O SEGUNDO SENTIDO, e a razao de este teste existir: `break-words` passa
    // por uma correcao plausivel e NAO resolve, porque nao reduz o min-content
    // em contexto flex. Se alguem "simplificar" para ele, isto quebra.
    expect(titulo.className.split(/\s+/)).not.toContain("break-words");
  });

  it("o nome da etiqueta tambem quebra: e texto do usuario", () => {
    // Nao e o caso do print, e entra pela MESMA razao: quem digita o nome da
    // etiqueta e uma pessoa, e nada impede um token colado.
    renderColuna();
    const etiqueta = screen.getByText(LABEL_SEM_ESPACO);

    expect(etiqueta.className.split(/\s+/)).toContain(
      "[overflow-wrap:anywhere]",
    );
  });

  it("o card pode encolher e contem o que escapar", () => {
    renderColuna();
    const classes = cardDaTarefa().className.split(/\s+/);

    expect(classes).toContain("min-w-0");
    expect(classes).toContain("max-w-full");
    expect(classes).toContain("overflow-hidden");
    // O `overflow-hidden` acima cobra um preco: com overflow diferente de
    // `visible`, o tamanho minimo automatico do item de flex vai a zero nos DOIS
    // eixos. No X e o que queremos; no Y e regressao, e o `shrink-0` e o que
    // devolve ao card a recusa de encolher. Detalhe no teste dedicado abaixo.
    expect(classes).toContain("shrink-0");
  });

  it("a lista da coluna esconde o eixo X E mantem o Y rolavel", () => {
    // AS DUAS JUNTAS de proposito. Trocar `overflow-y-auto` por
    // `overflow-x-hidden` mataria a barra horizontal e junto com ela a rolagem
    // vertical da coluna, que e a funcao original do container. Uma asercao so
    // aceitaria essa troca em silencio.
    const { container } = renderColuna();
    const lista = container.querySelector(".overflow-y-auto");

    expect(lista, "container rolavel da coluna sumiu").toBeTruthy();
    const classes = (lista as HTMLElement).className.split(/\s+/);
    expect(classes).toContain("overflow-y-auto");
    expect(classes).toContain("overflow-x-hidden");
  });

  it("TODO card de uma coluna lotada recusa encolher na vertical", () => {
    // O ESMAGAMENTO VERTICAL, que foi regressao real do commit anterior desta
    // frente: a lista e `flex-col` com `max-h-[calc(100vh-22rem)]`, e os cards
    // sao itens de flex com `flex-shrink: 1` por padrao. Enquanto o card tinha
    // overflow `visible`, o `min-height:auto` (tamanho minimo automatico =
    // min-content) o impedia de encolher abaixo do proprio conteudo, e a coluna
    // cheia rolava. Com `overflow-hidden` esse minimo computa para ZERO, entao
    // os cards passaram a ser comprimidos ate a soma caber no `max-h`, e o
    // proprio `overflow-hidden` cortava o titulo: quanto mais lotada a coluna,
    // mais fina a pilula. E o gemeo vertical da armadilha horizontal que os
    // testes acima cobrem.
    //
    // O jsdom NAO faz layout, entao aqui nao se mede altura nenhuma: o teste
    // trava a REGRA na classe, como todos os outros deste arquivo. A prova de
    // que a coluna volta a rolar em vez de espremer e o OK visual no navegador.
    //
    // Sao MUITOS cards de proposito: a compressao so aparece quando a soma das
    // alturas naturais estoura o `max-h`, e a asercao e sobre TODOS eles, nao
    // sobre o primeiro. Card que nascesse com className condicional (arquivado,
    // selecionado, pendente) e perdesse o `shrink-0` no caminho seria invisivel
    // para uma asercao de amostra.
    const tarefas: TaskCard[] = Array.from({ length: 24 }, (_, indice) => ({
      ...TAREFA,
      id: `task-lotada-${indice}`,
      number: 100 + indice,
      title: `${TITULO_SEM_ESPACO}#${indice}`,
    }));
    const { container } = renderColuna({ ...GRUPO, tasks: tarefas });

    const cards = Array.from(container.querySelectorAll("article"));
    expect(cards.length, "a coluna lotada nao renderizou os cards").toBe(
      tarefas.length,
    );
    for (const card of cards) {
      expect(card.className.split(/\s+/)).toContain("shrink-0");
    }
  });

  it("o card renderizado e mesmo o da coluna, com o titulo inteiro", () => {
    // CONTROLE: sem isto, os testes acima passariam sobre uma coluna vazia se
    // algum dia o card deixasse de renderizar, e "nenhuma classe errada" seria
    // confundido com "esta certo".
    renderColuna();
    expect(cardDaTarefa()).toBeTruthy();
    expect(screen.getByText(TITULO_SEM_ESPACO).textContent).toBe(
      TITULO_SEM_ESPACO,
    );
  });
});
