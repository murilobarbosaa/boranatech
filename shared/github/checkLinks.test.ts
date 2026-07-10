import { describe, expect, it } from "vitest";

import { resolveCheckActionUrl } from "./checkLinks";

const repoTarget = {
  kind: "repo" as const,
  login: "octocat",
  repo: "hello-world",
};
const profileTarget = { kind: "perfil" as const, login: "octocat", repo: null };

describe("resolveCheckActionUrl", () => {
  it("gera criar/editar README e arquivos no formato oficial", () => {
    expect(resolveCheckActionUrl("repo_readme_present", repoTarget)).toBe(
      "https://github.com/octocat/hello-world/new/main?filename=README.md",
    );
    expect(resolveCheckActionUrl("repo_readme_usage", repoTarget)).toBe(
      "https://github.com/octocat/hello-world/edit/main/README.md",
    );
    expect(resolveCheckActionUrl("repo_gitignore", repoTarget)).toBe(
      "https://github.com/octocat/hello-world/new/main?filename=.gitignore",
    );
    expect(resolveCheckActionUrl("repo_ci", repoTarget)).toBe(
      "https://github.com/octocat/hello-world/actions/new",
    );
  });

  it("gera links fixos de perfil e paginas de settings", () => {
    expect(resolveCheckActionUrl("profile_bio", profileTarget)).toBe(
      "https://github.com/settings/profile",
    );
    expect(resolveCheckActionUrl("profile_repos_count", profileTarget)).toBe(
      "https://github.com/new",
    );
    expect(
      resolveCheckActionUrl("profile_repos_described", profileTarget),
    ).toBe("https://github.com/octocat?tab=repositories");
    expect(
      resolveCheckActionUrl("profile_readme_substance", profileTarget),
    ).toBe("https://github.com/octocat/octocat/edit/main/README.md");
  });

  it("devolve null para checks sem link honesto e alvo incompativel", () => {
    expect(resolveCheckActionUrl("repo_recent_activity", repoTarget)).toBeNull();
    expect(resolveCheckActionUrl("repo_structure", repoTarget)).toBeNull();
    expect(resolveCheckActionUrl("profile_activity", profileTarget)).toBeNull();
    // Check de repo com alvo de perfil (sem repo): nunca inventa URL.
    expect(resolveCheckActionUrl("repo_readme_present", profileTarget)).toBeNull();
    expect(resolveCheckActionUrl("id_desconhecido", repoTarget)).toBeNull();
  });
});
