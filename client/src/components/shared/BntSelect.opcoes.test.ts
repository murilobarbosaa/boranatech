import { afterEach, describe, expect, it, vi } from "vitest";

import { opcoesRenderizaveis } from "./BntSelect";

/**
 * Regressao do rollout do BntSelect, achada em producao pelo Sentry
 * (`BORANATECH-FRONT-9`, url `/admin`): o Radix lanca
 * `A <Select.Item /> must have a value prop that is not an empty string` de
 * dentro do render, e throw no render derruba a arvore, entao uma opcao torta
 * apagava a pagina inteira em vez de sumir sozinha.
 *
 * A guarda mora DENTRO do componente, nao no chamador: sao 20+ call sites e a
 * instrucao "mapeie sentinela antes de passar" ja existia como comentario,
 * cobrindo so quem lembrou.
 */
afterEach(() => {
  vi.restoreAllMocks();
});

describe("opcoesRenderizaveis", () => {
  it("mantem intacta a lista que ja e valida", () => {
    const options = [
      { value: "br", label: "Brasil" },
      { value: "us", label: "Estados Unidos" },
    ];
    expect(opcoesRenderizaveis(options)).toEqual(options);
  });

  it("descarta a opcao de value vazio e PRESERVA as demais", () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    const options = [
      { value: "ativo", label: "Ativo" },
      { value: "", label: "Todos" },
      { value: "cancelado", label: "Cancelado" },
    ];
    expect(opcoesRenderizaveis(options)).toEqual([
      { value: "ativo", label: "Ativo" },
      { value: "cancelado", label: "Cancelado" },
    ]);
  });

  it("avisa no console nomeando o rotulo: descarte rastreavel, nao silencioso", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    opcoesRenderizaveis([{ value: "", label: "Sem responsável" }]);
    expect(warn).toHaveBeenCalledTimes(1);
    expect(String(warn.mock.calls[0][0])).toContain("Sem responsável");
    expect(String(warn.mock.calls[0][0])).toContain("value vazio");
  });

  it("value nao-string vindo de dado torto tambem nao chega ao Radix", () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    const options = [
      { value: "ok", label: "Ok" },
      { value: undefined as unknown as string, label: "Indefinido" },
      { value: null as unknown as string, label: "Nulo" },
    ];
    expect(opcoesRenderizaveis(options)).toEqual([{ value: "ok", label: "Ok" }]);
  });

  it("lista inteira invalida devolve vazio sem lancar", () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    expect(() => opcoesRenderizaveis([{ value: "", label: "A" }])).not.toThrow();
    expect(opcoesRenderizaveis([{ value: "", label: "A" }])).toEqual([]);
  });

  it("lista vazia nao avisa nada", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    expect(opcoesRenderizaveis([])).toEqual([]);
    expect(warn).not.toHaveBeenCalled();
  });
});
