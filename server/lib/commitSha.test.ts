import { afterEach, describe, expect, it } from "vitest";

import { commitShaAtual } from "./commitSha";

const ORIGINAL = process.env.RAILWAY_GIT_COMMIT_SHA;

afterEach(() => {
  if (ORIGINAL === undefined) delete process.env.RAILWAY_GIT_COMMIT_SHA;
  else process.env.RAILWAY_GIT_COMMIT_SHA = ORIGINAL;
});

describe("commitShaAtual", () => {
  it("devolve o sha que o Railway injetou", () => {
    process.env.RAILWAY_GIT_COMMIT_SHA = "e2c18b65deadbeef";
    expect(commitShaAtual()).toBe("e2c18b65deadbeef");
  });

  it("ausência da variável é null, e não string vazia", () => {
    // Dev local e CI não têm a variável. Null diz "não sei"; "" diria "sei, e é
    // vazio", que é uma afirmação diferente e falsa.
    delete process.env.RAILWAY_GIT_COMMIT_SHA;
    expect(commitShaAtual()).toBeNull();
    expect(commitShaAtual()).not.toBe("");
  });

  it("variável presente e vazia também é null", () => {
    // O caso que o `?? null` do rascunho deixaria passar: `?? null` só troca
    // undefined e null, e uma variável de ambiente definida como vazia continua
    // sendo uma string. Vazia é ausência, e sai como ausência.
    process.env.RAILWAY_GIT_COMMIT_SHA = "   ";
    expect(commitShaAtual()).toBeNull();
  });
});
