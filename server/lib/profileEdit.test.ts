import { describe, expect, it } from "vitest";

import { buildProfilePatch } from "./profileEdit";

/**
 * Montagem do PATCH de perfil pelo admin: allowlist, validacao e DIFF.
 *
 * O diff nao e economia de bytes. Ele decide (a) se ha o que auditar e (b) se a
 * tabela e tocada: profiles tem trigger `profiles_updated_at -> set_updated_at`,
 * entao QUALQUER update bate o carimbo, inclusive um `SET name = name`. Salvar
 * um formulario sem mudanca deixaria um rastro falso de "editado agora" e uma
 * linha de auditoria sobre nada.
 */

const ATUAL = {
  name: "Ana",
  full_name: "Ana Moura",
  gender: "feminino",
  bio: null,
  area_interesse: null,
  nivel_atual: null,
  objetivo: null,
  headline: null,
  city: null,
  uf: null,
  career_goal: null,
  github_url: null,
  linkedin_url: null,
  website_url: null,
};

describe("buildProfilePatch: allowlist", () => {
  it("aceita os campos da allowlist", () => {
    const r = buildProfilePatch(ATUAL, { name: "Ana Paula" });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.changes).toEqual({ name: "Ana Paula" });
  });

  it("campo FORA da allowlist e recusado com 400, nao ignorado em silencio", () => {
    // Ignorar calado significaria a UI mandar um campo, receber 200, e nada
    // acontecer. O proximo a mexer no formulario perderia uma tarde.
    const r = buildProfilePatch(ATUAL, { cpf: "12345678901" });
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.error.code).toBe("invalid_field");
    expect(r.error.message).toContain("cpf");
  });

  it("email e recusado: e a Fatia 5b, nao um esquecimento", () => {
    const r = buildProfilePatch(ATUAL, { email: "novo@x.com" });
    expect(r.ok).toBe(false);
  });

  it("handle e recusado: UNIQUE precisa de tratamento proprio", () => {
    expect(buildProfilePatch(ATUAL, { handle: "ana" }).ok).toBe(false);
  });

  it("um campo valido junto de um invalido recusa TUDO, nao grava parcial", () => {
    const r = buildProfilePatch(ATUAL, { name: "Ana Paula", cpf: "111" });
    expect(r.ok).toBe(false);
  });
});

describe("buildProfilePatch: validacao", () => {
  it("headline acima de 140 e recusada", () => {
    const r = buildProfilePatch(ATUAL, { headline: "x".repeat(141) });
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.error.field).toBe("headline");
  });

  it("URL sem esquema e recusada, com o campo apontado", () => {
    const r = buildProfilePatch(ATUAL, { github_url: "github.com/ana" });
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.error.field).toBe("github_url");
  });

  it("URL vazia e aceita: e como se limpa o campo", () => {
    const r = buildProfilePatch(
      { ...ATUAL, github_url: "https://github.com/ana" },
      { github_url: "" },
    );
    expect(r.ok).toBe(true);
  });

  it("valor de tipo errado e recusado", () => {
    expect(buildProfilePatch(ATUAL, { name: 42 }).ok).toBe(false);
    expect(buildProfilePatch(ATUAL, { bio: { a: 1 } }).ok).toBe(false);
  });

  it("gender fora do conjunto e recusado", () => {
    const r = buildProfilePatch(ATUAL, { gender: "xpto" });
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.error.field).toBe("gender");
  });

  it("gender null limpa o campo", () => {
    expect(buildProfilePatch(ATUAL, { gender: null }).ok).toBe(true);
  });
});

describe("buildProfilePatch: diff", () => {
  it("valor igual ao atual NAO entra no patch", () => {
    const r = buildProfilePatch(ATUAL, { name: "Ana" });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.changes).toEqual({});
    expect(r.hasChanges).toBe(false);
  });

  it("requisicao sem nenhuma mudanca efetiva e valida e nao tem o que gravar", () => {
    const r = buildProfilePatch(ATUAL, { name: "Ana", full_name: "Ana Moura" });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.hasChanges).toBe(false);
  });

  it("string vazia e null sao a MESMA ausencia: nao geram mudanca falsa", () => {
    // O formulario devolve "" para campo que o usuario nao preencheu; o banco
    // guarda null. Sem normalizar, abrir e salvar sem tocar em nada gravaria 11
    // campos e uma auditoria inteira de mentira.
    const r = buildProfilePatch(ATUAL, { bio: "", headline: "" });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.hasChanges).toBe(false);
  });

  it("espaco em branco nas pontas nao conta como mudanca", () => {
    const r = buildProfilePatch(ATUAL, { name: "  Ana  " });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.hasChanges).toBe(false);
  });

  it("o valor gravado vai TRIMADO", () => {
    const r = buildProfilePatch(ATUAL, { name: "  Ana Paula  " });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.changes.name).toBe("Ana Paula");
  });

  it("limpar um campo preenchido grava null, nao string vazia", () => {
    const r = buildProfilePatch({ ...ATUAL, bio: "algo" }, { bio: "" });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.changes).toEqual({ bio: null });
    expect(r.hasChanges).toBe(true);
  });

  it("before e after tem SO os campos que mudaram", () => {
    const r = buildProfilePatch(
      { ...ATUAL, bio: "velha" },
      { bio: "nova", name: "Ana" },
    );
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    // name veio igual: nao entra em lugar nenhum.
    expect(r.before).toEqual({ bio: "velha" });
    expect(r.after).toEqual({ bio: "nova" });
  });

  it("campo ausente do body nao e tocado", () => {
    const r = buildProfilePatch({ ...ATUAL, bio: "mantida" }, { name: "Nova" });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.changes).not.toHaveProperty("bio");
  });
});
