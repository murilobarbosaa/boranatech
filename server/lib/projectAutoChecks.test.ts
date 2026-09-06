import { describe, expect, it } from "vitest";

import { evaluateChecks, type Evidencia } from "./projectAutoChecks";

/**
 * O avaliador das checagens de entrega.
 *
 * O ponto do arquivo e a distincao entre `falhou` e `erro`. Um avaliador que
 * transformasse "nao consegui olhar" em "esta errado" reprovaria entrega boa
 * numa queda do GitHub; um que transformasse em "ok" aprovaria qualquer coisa.
 */

const SITE = "https://fulano.github.io/portfolio";

function evidencia(over: Partial<Evidencia> = {}): Evidencia {
  return {
    deploy: { status: 200 },
    artifact: null,
    repo: {
      publico: true,
      readme: `# Portfolio\n\n${"conteudo ".repeat(20)}\n\n${SITE}`,
      rootEntries: ["index.html", "style.css", "README.md"],
      treePaths: [
        "index.html",
        "style.css",
        "cypress/e2e/login.cy.js",
        "cypress.config.js",
      ],
      commitsPelo5: 5,
    },
    deployUrl: SITE,
    ...over,
  };
}

const um = (
  check: Parameters<typeof evaluateChecks>[0][number],
  e: Evidencia,
) => evaluateChecks([check], e)[0];

describe("deploy_responde e artefato_responde", () => {
  it("200 a 399 passa", () => {
    for (const status of [200, 204, 301, 399]) {
      expect(
        um("deploy_responde", evidencia({ deploy: { status } })).status,
      ).toBe("ok");
    }
  });

  it("404 reprova nomeando o status", () => {
    const r = um("deploy_responde", evidencia({ deploy: { status: 404 } }));
    expect(r.status).toBe("falhou");
    expect(r.mensagem).toContain("404");
  });

  it("sem resposta e ERRO, nao reprovacao", () => {
    const r = um(
      "deploy_responde",
      evidencia({ deploy: { status: null, erro: "timeout" } }),
    );
    expect(r.status).toBe("erro");
  });

  it("evidencia ausente e erro", () => {
    expect(um("deploy_responde", evidencia({ deploy: null })).status).toBe(
      "erro",
    );
    expect(um("artefato_responde", evidencia()).status).toBe("erro");
  });

  it("artefato usa a evidencia do artefato, nao a do deploy", () => {
    const e = evidencia({ artifact: { status: 200 }, deploy: { status: 500 } });
    expect(um("artefato_responde", e).status).toBe("ok");
  });
});

describe("repo_publico", () => {
  it("publico passa, nao publico reprova", () => {
    expect(um("repo_publico", evidencia()).status).toBe("ok");
    const e = evidencia({
      repo: { ...evidencia().repo!, publico: false },
    });
    expect(um("repo_publico", e).status).toBe("falhou");
  });

  it("sem evidencia de repo, erro", () => {
    expect(um("repo_publico", evidencia({ repo: null })).status).toBe("erro");
  });
});

describe("checagens que dependem de ler o repositorio", () => {
  it("repo nao publico vira ERRO nelas, nao reprovacao", () => {
    // Reprovar "readme_existe" porque o repo e privado seria dizer que o
    // README nao existe, e a gente nao sabe disso.
    const e = evidencia({ repo: { ...evidencia().repo!, publico: false } });
    for (const check of [
      "readme_existe",
      "min_commits_5",
      "arquivo:index.html",
    ] as const) {
      expect(um(check, e).status, check).toBe("erro");
    }
  });
});

describe("readme_existe", () => {
  it("README com corpo passa", () => {
    expect(um("readme_existe", evidencia()).status).toBe("ok");
  });

  it("README curto reprova", () => {
    const e = evidencia({ repo: { ...evidencia().repo!, readme: "# oi" } });
    expect(um("readme_existe", e).status).toBe("falhou");
  });

  it("sem README reprova (a ausencia e observada)", () => {
    const e = evidencia({ repo: { ...evidencia().repo!, readme: null } });
    expect(um("readme_existe", e).status).toBe("falhou");
  });
});

describe("readme_tem_link_deploy", () => {
  it("acha o link mesmo com barra final e esquema diferente", () => {
    for (const noReadme of [
      SITE,
      `${SITE}/`,
      SITE.replace("https://", "http://"),
      SITE.toUpperCase(),
    ]) {
      const e = evidencia({
        repo: { ...evidencia().repo!, readme: `# t\n\nveja em ${noReadme}` },
      });
      expect(um("readme_tem_link_deploy", e).status, noReadme).toBe("ok");
    }
  });

  it("README sem o link reprova", () => {
    const e = evidencia({
      repo: { ...evidencia().repo!, readme: "# t\n\nsem link nenhum" },
    });
    expect(um("readme_tem_link_deploy", e).status).toBe("falhou");
  });

  it("sem deployUrl, erro", () => {
    expect(
      um("readme_tem_link_deploy", evidencia({ deployUrl: null })).status,
    ).toBe("erro");
  });
});

describe("min_commits_5", () => {
  it("5 passa, 3 reprova nomeando o numero", () => {
    expect(um("min_commits_5", evidencia()).status).toBe("ok");
    const e = evidencia({ repo: { ...evidencia().repo!, commitsPelo5: 3 } });
    const r = um("min_commits_5", e);
    expect(r.status).toBe("falhou");
    expect(r.mensagem).toContain("3");
  });

  it("contagem indisponivel e erro", () => {
    const e = evidencia({ repo: { ...evidencia().repo!, commitsPelo5: null } });
    expect(um("min_commits_5", e).status).toBe("erro");
  });
});

describe("arquivo: e pasta:", () => {
  it("arquivo na raiz usa rootEntries", () => {
    expect(um("arquivo:index.html", evidencia()).status).toBe("ok");
    expect(um("arquivo:package.json", evidencia()).status).toBe("falhou");
  });

  it("arquivo em subpasta usa a arvore", () => {
    expect(um("arquivo:cypress/e2e/login.cy.js", evidencia()).status).toBe(
      "ok",
    );
    expect(um("arquivo:src/app.js", evidencia()).status).toBe("falhou");
  });

  it("pasta: exige a barra, entao cypress.config.js nao satisfaz pasta:cypress", () => {
    expect(um("pasta:cypress", evidencia()).status).toBe("ok");
    const e = evidencia({
      repo: { ...evidencia().repo!, treePaths: ["cypress.config.js"] },
    });
    expect(um("pasta:cypress", e).status).toBe("falhou");
  });

  it("arvore indisponivel e erro", () => {
    const e = evidencia({ repo: { ...evidencia().repo!, treePaths: null } });
    expect(um("pasta:cypress", e).status).toBe("erro");
    expect(um("arquivo:src/app.js", e).status).toBe("erro");
    // O de raiz continua respondendo, porque usa outra evidencia.
    expect(um("arquivo:index.html", e).status).toBe("ok");
  });
});

describe("evaluateChecks", () => {
  it("devolve um resultado por checagem, na ordem", () => {
    const r = evaluateChecks(
      ["repo_publico", "min_commits_5", "deploy_responde"],
      evidencia(),
    );
    expect(r.map((x) => x.check)).toEqual([
      "repo_publico",
      "min_commits_5",
      "deploy_responde",
    ]);
    expect(r.every((x) => x.status === "ok")).toBe(true);
  });

  it("lista vazia devolve lista vazia", () => {
    expect(evaluateChecks([], evidencia())).toEqual([]);
  });
});
