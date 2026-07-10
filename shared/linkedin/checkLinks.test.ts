import { describe, expect, it } from "vitest";

import { resolveCheckActionUrl } from "./checkLinks";
import { LINKEDIN_CHECK_CATALOG } from "./schema";

const PROFILE_URL = "https://www.linkedin.com/in/me";

describe("resolveCheckActionUrl (linkedin)", () => {
  it("resolve para o proprio perfil os checks corrigidos dentro do perfil", () => {
    expect(resolveCheckActionUrl("headline-existe")).toBe(PROFILE_URL);
    expect(resolveCheckActionUrl("sobre-gancho")).toBe(PROFILE_URL);
    expect(resolveCheckActionUrl("exp-descricoes")).toBe(PROFILE_URL);
    expect(resolveCheckActionUrl("cobertura-keywords-area")).toBe(PROFILE_URL);
    expect(resolveCheckActionUrl("skills-quantidade")).toBe(PROFILE_URL);
    expect(resolveCheckActionUrl("foto-profissional")).toBe(PROFILE_URL);
    expect(resolveCheckActionUrl("open-to-work")).toBe(PROFILE_URL);
    expect(resolveCheckActionUrl("headline-em-ingles")).toBe(PROFILE_URL);
  });

  it("devolve null para checks cuja acao nao e edicao do perfil", () => {
    expect(resolveCheckActionUrl("conexoes")).toBeNull();
    expect(resolveCheckActionUrl("atividade")).toBeNull();
  });

  it("devolve null para id desconhecido, nunca adivinha URL", () => {
    expect(resolveCheckActionUrl("id_desconhecido")).toBeNull();
    expect(resolveCheckActionUrl("repo_readme_present")).toBeNull();
    expect(resolveCheckActionUrl("")).toBeNull();
  });

  it("todo check do catalogo resolve para /in/me ou null, sem outra URL", () => {
    for (const entry of LINKEDIN_CHECK_CATALOG) {
      const url = resolveCheckActionUrl(entry.id);
      expect([PROFILE_URL, null]).toContain(url);
    }
  });
});
