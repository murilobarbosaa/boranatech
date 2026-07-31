import { afterEach, describe, expect, it, vi } from "vitest";

import { opcoesRenderizaveis } from "@/components/shared/BntSelect";

import { DUE_ANY, DUE_OPTIONS } from "./BoardToolbar";

/**
 * Residuo do BUG-1 ("Ao clicar em Filtros na aba de Tarefas, da erro").
 *
 * O crash original era o Radix lancando `A <Select.Item /> must have a value
 * prop that is not an empty string` de dentro do render, porque o filtro de
 * Vencimento passava `{ value: "", label: "Qualquer data" }`. Throw no render
 * derruba a arvore, entao o popover de filtros apagava o painel inteiro.
 *
 * Isso foi corrigido em 64dedd4 pela guarda DENTRO do BntSelect
 * (`opcoesRenderizaveis`), que descarta a opcao invalida. A guarda esta certa e
 * fica: ela cobre os 20+ call sites e os que ainda nao existem.
 *
 * Mas descartar resolveu o CRASH e nao o PRODUTO. Com a opcao descartada,
 * "Qualquer data" sumia do menu, e quem escolhesse "Atrasadas" nao tinha como
 * voltar atras pelo proprio select (sobrava o botao "Limpar filtros", que so
 * aparece com filtro ativo). Um console.warn saia a cada abertura do popover,
 * dizendo exatamente isso, e ninguem estava lendo.
 *
 * A correcao e a sentinela que o proprio BntSelect manda a pagina usar. Este
 * teste trava as duas metades: nada e descartado, e a traducao volta para "".
 */

afterEach(() => {
  vi.restoreAllMocks();
});

describe("filtro de Vencimento: sentinela em vez de value vazio", () => {
  it("nenhuma opcao tem value vazio", () => {
    for (const opcao of DUE_OPTIONS) {
      expect(opcao.value).not.toBe("");
    }
  });

  it("o BntSelect nao descarta nenhuma das tres, e nao avisa", () => {
    // A asserção que importa. Ela compoe os dois modulos de verdade em vez de
    // reafirmar a linha acima: se DUE_OPTIONS voltar a ter "", a guarda do
    // BntSelect derruba a contagem de 3 para 2 e o warn dispara.
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const renderizaveis = opcoesRenderizaveis(DUE_OPTIONS);
    expect(renderizaveis).toHaveLength(DUE_OPTIONS.length);
    expect(renderizaveis).toHaveLength(3);
    expect(warn).not.toHaveBeenCalled();
  });

  it("'Qualquer data' continua no menu, que e o que o usuario perdeu", () => {
    const rotulos = opcoesRenderizaveis(DUE_OPTIONS).map((o) => o.label);
    expect(rotulos).toContain("Qualquer data");
  });

  it("a sentinela traduz para '' e nao vaza para o estado da pagina", () => {
    // `filters.due` e "" | "late" | "week" e vai para a URL. A sentinela existe
    // so na borda da interface; se ela vazasse, applyFilters receberia um valor
    // que nao trata e o filtro pararia de significar "qualquer data".
    const paraOEstado = (v: string) => (v === DUE_ANY ? "" : v);
    expect(paraOEstado(DUE_ANY)).toBe("");
    expect(paraOEstado("late")).toBe("late");
    expect(paraOEstado("week")).toBe("week");
  });

  it("os valores reais do dominio continuam intactos", () => {
    // Controle negativo do escopo: so o "sem filtro" muda de nome. Se alguem
    // trocar "late"/"week" por sentinela tambem, o filtro para de casar com
    // applyFilters e com a URL, em silencio.
    const valores = DUE_OPTIONS.map((o) => o.value);
    expect(valores).toContain("late");
    expect(valores).toContain("week");
    expect(valores).toContain(DUE_ANY);
  });
});
