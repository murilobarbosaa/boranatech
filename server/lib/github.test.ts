import { describe, expect, it } from "vitest";

import { parseProfileInput, parseRepoInput } from "./github";

describe("parseRepoInput", () => {
  it("aceita URL completa, com barra final, com /tree/main e o atalho owner/repo", () => {
    const expected = { owner: "murilobarbosaa", repo: "boranatech" };

    expect(parseRepoInput("https://github.com/murilobarbosaa/boranatech")).toEqual(expected);
    expect(parseRepoInput("https://github.com/murilobarbosaa/boranatech/")).toEqual(expected);
    expect(parseRepoInput("https://github.com/murilobarbosaa/boranatech/tree/main")).toEqual(expected);
    expect(parseRepoInput("murilobarbosaa/boranatech")).toEqual(expected);
  });

  it("rejeita host diferente, formato invalido e valores fora do padrao", () => {
    expect(parseRepoInput("https://gitlab.com/a/b")).toBeNull();
    expect(parseRepoInput("https://evil.com/github.com/a/b")).toBeNull();
    expect(parseRepoInput("a")).toBeNull();
    expect(parseRepoInput("owner/")).toBeNull();
    expect(parseRepoInput("/repo")).toBeNull();
    expect(parseRepoInput("..")).toBeNull();
    expect(parseRepoInput("ow ner/repo")).toBeNull();
  });
});

describe("parseProfileInput", () => {
  it("aceita username puro e URL de perfil", () => {
    const expected = { login: "murilobarbosaa" };

    expect(parseProfileInput("https://github.com/murilobarbosaa")).toEqual(expected);
    expect(parseProfileInput("murilobarbosaa")).toEqual(expected);
  });

  it("rejeita host diferente e login invalido", () => {
    expect(parseProfileInput("https://gitlab.com/murilobarbosaa")).toBeNull();
    expect(parseProfileInput("https://github.com/a/b")).toBeNull();
    expect(parseProfileInput("-comeca-com-hifen")).toBeNull();
    expect(parseProfileInput("login invalido")).toBeNull();
    expect(parseProfileInput("")).toBeNull();
  });
});
