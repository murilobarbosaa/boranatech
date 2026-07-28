import { describe, expect, it } from "vitest";

import {
  parseShortId,
  readTaskParam,
  shortIdOf,
  withTaskParam,
} from "./taskDeepLink";

describe("readTaskParam", () => {
  it("le o id curto", () => {
    expect(readTaskParam("?section=tarefas&task=DEV-42")).toBe("DEV-42");
  });

  it("normaliza para maiusculo (link colado de chat)", () => {
    expect(readTaskParam("?task=dev-42")).toBe("DEV-42");
  });

  it("ausente devolve null", () => {
    expect(readTaskParam("?section=tarefas")).toBeNull();
    expect(readTaskParam("")).toBeNull();
  });

  it("recusa formato invalido em vez de virar estado da tela", () => {
    expect(readTaskParam("?task=<script>alert(1)</script>")).toBeNull();
    expect(readTaskParam("?task=DEV")).toBeNull();
    expect(readTaskParam("?task=42")).toBeNull();
    expect(readTaskParam("?task=DEV-")).toBeNull();
    expect(readTaskParam("?task=DEV-abc")).toBeNull();
  });
});

describe("withTaskParam", () => {
  // Este e o teste que justifica o modulo existir. A regressao que ele trava e
  // "abrir uma tarefa jogou a pessoa para a visao geral no F5".
  it("PRESERVA section ao definir task", () => {
    const next = withTaskParam("?section=tarefas", "DEV-42");
    expect(new URLSearchParams(next).get("section")).toBe("tarefas");
    expect(new URLSearchParams(next).get("task")).toBe("DEV-42");
  });

  it("PRESERVA section ao remover task", () => {
    const next = withTaskParam("?section=tarefas&task=DEV-42", null);
    expect(new URLSearchParams(next).get("section")).toBe("tarefas");
    expect(new URLSearchParams(next).get("task")).toBeNull();
  });

  it("preserva parametros de terceiros que nao conhecemos", () => {
    const next = withTaskParam("?section=tarefas&utm_source=slack", "DEV-1");
    expect(new URLSearchParams(next).get("utm_source")).toBe("slack");
  });

  it("troca o task existente sem duplicar o parametro", () => {
    const next = withTaskParam("?section=tarefas&task=DEV-1", "DEV-2");
    expect(next.match(/task=/g)).toHaveLength(1);
    expect(new URLSearchParams(next).get("task")).toBe("DEV-2");
  });

  it("devolve string vazia quando nao sobra parametro", () => {
    expect(withTaskParam("?task=DEV-42", null)).toBe("");
  });

  it("prefixa com ? para concatenar direto no path", () => {
    expect(withTaskParam("?section=tarefas", "DEV-42").startsWith("?")).toBe(true);
  });

  it("ida e volta devolve a search original", () => {
    const original = "?section=tarefas";
    const opened = withTaskParam(original, "DEV-42");
    expect(withTaskParam(opened, null)).toBe(original);
  });
});

describe("shortIdOf e parseShortId", () => {
  it("ida e volta", () => {
    const shortId = shortIdOf("DEV", 42);
    expect(shortId).toBe("DEV-42");
    expect(parseShortId(shortId)).toEqual({ boardKey: "DEV", number: 42 });
  });

  it("prefixo com digito nao confunde o corte", () => {
    expect(parseShortId(shortIdOf("A1B2", 7))).toEqual({
      boardKey: "A1B2",
      number: 7,
    });
  });

  it("formato invalido devolve null", () => {
    expect(parseShortId("DEV")).toBeNull();
    expect(parseShortId("dev-42")).toBeNull();
    expect(parseShortId("DEV-0")).toBeNull();
  });
});
