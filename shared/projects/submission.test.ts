import { describe, expect, it } from "vitest";

import { gerarPublicCode, parseSubmissionInput } from "./submission";

const REPO = "https://github.com/fulano/meu-projeto";
const SITE = "https://fulano.github.io/meu-projeto";

describe("parseSubmissionInput por tipo de entrega", () => {
  it("repo_deploy exige site e repositorio", () => {
    const r = parseSubmissionInput(
      { deployUrl: SITE, repoUrl: REPO },
      "repo_deploy",
    );
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.value.deployUrl).toBe(SITE);
      expect(r.value.repoUrl).toBe(REPO);
      expect(r.value.isPublic).toBe(false);
    }
  });

  it("repo_deploy sem o site e recusado, nomeando o campo", () => {
    const r = parseSubmissionInput({ repoUrl: REPO }, "repo_deploy");
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toContain("site no ar");
  });

  it("repo exige so o repositorio", () => {
    const r = parseSubmissionInput({ repoUrl: REPO }, "repo");
    expect(r.ok).toBe(true);
  });

  it("figma, notebook, documento e dashboard exigem o artefato", () => {
    for (const tipo of [
      "figma",
      "notebook",
      "documento",
      "dashboard",
    ] as const) {
      expect(parseSubmissionInput({ artifactUrl: SITE }, tipo).ok).toBe(true);
      const semArtefato = parseSubmissionInput({ repoUrl: REPO }, tipo);
      expect(semArtefato.ok, `${tipo} aceitou sem artefato`).toBe(false);
    }
  });
});

describe("parseSubmissionInput recusa URL ruim", () => {
  it("http em vez de https", () => {
    const r = parseSubmissionInput(
      { repoUrl: "http://github.com/a/b" },
      "repo",
    );
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toContain("https");
  });

  it("credencial no userinfo", () => {
    const r = parseSubmissionInput(
      { repoUrl: "https://user:senha@github.com/a/b" },
      "repo",
    );
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toContain("usuario e senha");
  });

  it("URL longa demais", () => {
    const r = parseSubmissionInput(
      { repoUrl: `https://github.com/a/${"x".repeat(600)}` },
      "repo",
    );
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toContain("500");
  });

  it("repositorio que nao e github.com/owner/repo", () => {
    for (const url of [
      "https://github.com/fulano",
      "https://gitlab.com/fulano/projeto",
      "https://example.com",
    ]) {
      const r = parseSubmissionInput({ repoUrl: url }, "repo");
      expect(r.ok, `aceitou ${url}`).toBe(false);
    }
  });

  it("nao e URL", () => {
    expect(parseSubmissionInput({ repoUrl: "meu repo" }, "repo").ok).toBe(
      false,
    );
  });
});

describe("parseSubmissionInput nos campos opcionais", () => {
  it("retro.maisDificil ate 500 caracteres, com trim", () => {
    const r = parseSubmissionInput(
      { repoUrl: REPO, retro: { maisDificil: "  o css  " } },
      "repo",
    );
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.value.retro?.maisDificil).toBe("o css");
  });

  it("retro longa demais e recusada", () => {
    const r = parseSubmissionInput(
      { repoUrl: REPO, retro: { maisDificil: "x".repeat(501) } },
      "repo",
    );
    expect(r.ok).toBe(false);
  });

  it("isPublic so aceita booleano", () => {
    expect(
      parseSubmissionInput({ repoUrl: REPO, isPublic: true }, "repo").ok,
    ).toBe(true);
    expect(
      parseSubmissionInput({ repoUrl: REPO, isPublic: "sim" }, "repo").ok,
    ).toBe(false);
  });

  it("corpo que nao e objeto e recusado", () => {
    for (const v of [null, [], "x", 1]) {
      expect(
        parseSubmissionInput(v, "repo").ok,
        `aceitou ${JSON.stringify(v)}`,
      ).toBe(false);
    }
  });
});

describe("gerarPublicCode", () => {
  it("tem o formato BNT-XXXX-XXXX", () => {
    expect(gerarPublicCode(() => 0.5)).toMatch(/^BNT-[A-Z2-9]{4}-[A-Z2-9]{4}$/);
  });

  it("nunca usa 0, O, 1 nem I", () => {
    // Varre o alfabeto inteiro: `random` percorre todos os indices.
    let i = 0;
    const passos = 64;
    const codigo = gerarPublicCode(() => {
      const v = i / passos;
      i += 1;
      return v;
    });
    expect(codigo.slice(4).replace("-", "")).not.toMatch(/[01OI]/);
  });

  it("random fixo da codigo estavel", () => {
    expect(gerarPublicCode(() => 0)).toBe(gerarPublicCode(() => 0));
    expect(gerarPublicCode(() => 0)).toBe("BNT-2222-2222");
  });
});
