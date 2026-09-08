import { describe, expect, it } from "vitest";
import {
  fillGap,
  normalizeStdout,
  runnerFor,
  stdoutMatches,
} from "./verifyQuizPoolByExecution.mts";

// So as funcoes puras do verificador: a execucao real (spawn de node ou
// python3) fica fora do teste. Literais escritos a mao.
describe("normalizeStdout e stdoutMatches", () => {
  it("normaliza quebras de linha e espacos das pontas", () => {
    expect(normalizeStdout("  a\r\nb \n\n")).toBe("a\nb");
  });

  it("compara saida com alternativa ignorando espacos das pontas de cada linha", () => {
    expect(stdoutMatches("uva\nkiwi\nmanga\n", "uva\nkiwi\nmanga")).toBe(true);
    expect(stdoutMatches("uva\nkiwi\nmanga", "uva, kiwi, manga")).toBe(false);
    expect(stdoutMatches("50", "O codigo imprime 50.")).toBe(false);
  });
});

describe("fillGap", () => {
  it("substitui a unica lacuna pela alternativa", () => {
    expect(fillGap("const a = ____;", "1")).toBe("const a = 1;");
  });

  it("nao mexe num trecho sem lacuna", () => {
    expect(fillGap("const a = 1;", "2")).toBe("const a = 1;");
  });
});

describe("runnerFor", () => {
  it("js roda com node em .mjs", () => {
    expect(runnerFor("js")).toEqual({ command: "node", ext: ".mjs" });
  });

  it("python roda com python3 em .py", () => {
    expect(runnerFor("python")).toEqual({ command: "python3", ext: ".py" });
  });

  it("linguagem sem runner devolve null", () => {
    expect(runnerFor("bash")).toBeNull();
  });
});
