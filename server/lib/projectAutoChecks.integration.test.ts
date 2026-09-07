import { describe, expect, it } from "vitest";

/**
 * Integracao REAL com o GitHub, pulada sem `GITHUB_TOKEN`.
 *
 * O coletor de evidencia e I/O puro e nao cabe em teste unitario. Este arquivo
 * existe para que a decisao de nao testa-lo seja explicita e reversivel: com
 * token, ele roda de verdade.
 */
const token = process.env.GITHUB_TOKEN;
const rodar = token ? describe : describe.skip;

rodar("coletarEvidencia contra o GitHub", () => {
  it("le um repositorio publico conhecido", async () => {
    const { coletarEvidencia } = await import("./projectAutoChecks");
    const e = await coletarEvidencia({
      checks: [],
      deployUrl: null,
      repoUrl: "https://github.com/octocat/Hello-World",
      artifactUrl: null,
    });
    expect(e.repo?.publico).toBe(true);
    expect(e.repo?.rootEntries.length).toBeGreaterThan(0);
  }, 30_000);
});
