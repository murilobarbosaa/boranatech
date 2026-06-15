import { describe, expect, it } from "vitest";

import { analyzeProfile, analyzeRepo, runProfileChecks, runRepoChecks } from "./githubChecks";
import type {
  GithubCheckResult,
  GithubProfileData,
  GithubRepoData,
} from "../../shared/github/schema";

// pushedAt "agora" para os checks de atividade recente caírem em pass.
const now = new Date().toISOString();
// pushedAt antigo para o repo forkado, sem peso na atividade.
const old = "2019-01-01T00:00:00.000Z";

function statusOf(checks: GithubCheckResult[], id: string): string {
  const check = checks.find((c) => c.id === id);
  if (!check) throw new Error(`check ${id} ausente`);
  return check.status;
}

// README forte: > 200 caracteres, com headings markdown e a palavra "usage".
const strongRepoReadme =
  "# Projeto Forte\n\n" +
  "Aplicação de referência do BoraNaTech.\n\n" +
  "## Usage\n\n" +
  "Para rodar local: pnpm install e depois pnpm dev. " +
  "O projeto sobe client e server juntos.\n\n" +
  "## Arquitetura\n\n" +
  "A base separa camadas de domínio, infraestrutura e apresentação, " +
  "com testes cobrindo as funções puras de pontuação e as rotas de API. " +
  "Cada módulo tem responsabilidade única e o fluxo de dados é unidirecional, " +
  "o que facilita a manutenção e a leitura por quem chega novo no repositório.\n";

const strongProfileReadme =
  "# Oi, eu sou a Dev Forte\n\n" +
  "Engenheira de software com foco em backend e dados. " +
  "Gosto de construir APIs resilientes, escrever testes e documentar bem. " +
  "Atualmente estudo arquitetura de sistemas distribuídos e contribuo com " +
  "projetos open source nas horas livres. Bora trocar ideia sobre carreira em tecnologia.\n";

const repoFraco: GithubRepoData = {
  owner: "user",
  name: "fraco",
  fullName: "user/fraco",
  htmlUrl: "https://github.com/user/fraco",
  description: null,
  topics: [],
  defaultBranch: "main",
  primaryLanguage: "JavaScript",
  languages: { JavaScript: 1000 },
  stars: 0,
  forks: 0,
  openIssues: 0,
  pushedAt: now,
  license: null,
  readme: "boranatech",
  files: {
    security: false,
    contributing: false,
    codeOfConduct: false,
    gitignore: true,
    ci: false,
    envCommitted: false,
  },
  rootEntries: ["client", "server", "package.json", "README.md", ".gitignore"],
  rootDirs: ["client", "server"],
};

const repoForte: GithubRepoData = {
  owner: "user",
  name: "forte",
  fullName: "user/forte",
  htmlUrl: "https://github.com/user/forte",
  description: "Aplicação de exemplo completa do BoraNaTech.",
  topics: ["typescript", "react", "node", "api", "testing"],
  defaultBranch: "main",
  primaryLanguage: "TypeScript",
  languages: { TypeScript: 5000, CSS: 200 },
  stars: 42,
  forks: 7,
  openIssues: 1,
  pushedAt: now,
  license: "MIT",
  readme: strongRepoReadme,
  files: {
    security: true,
    contributing: true,
    codeOfConduct: true,
    gitignore: true,
    ci: true,
    envCommitted: false,
  },
  rootEntries: ["src", "tests", "package.json", "README.md"],
  rootDirs: ["src", "tests"],
};

// Repositorio bem preenchido, mas com tudo na raiz (so uma pasta meta).
// Serve pra confirmar que repo_structure cai pra warn sem pastas de codigo.
const repoTudoSolto: GithubRepoData = {
  owner: "user",
  name: "solto",
  fullName: "user/solto",
  htmlUrl: "https://github.com/user/solto",
  description: "Projeto com tudo na raiz.",
  topics: ["demo"],
  defaultBranch: "main",
  primaryLanguage: "JavaScript",
  languages: { JavaScript: 1000 },
  stars: 0,
  forks: 0,
  openIssues: 0,
  pushedAt: now,
  license: "MIT",
  readme: "boranatech",
  files: {
    security: false,
    contributing: false,
    codeOfConduct: false,
    gitignore: true,
    ci: false,
    envCommitted: false,
  },
  rootEntries: ["index.js", "package.json", "README.md", "docs"],
  rootDirs: ["docs"],
};

const perfilFraco: GithubProfileData = {
  login: "fraco",
  htmlUrl: "https://github.com/fraco",
  name: null,
  bio: null,
  company: null,
  location: null,
  blog: null,
  email: null,
  twitterUsername: null,
  publicRepos: 0,
  followers: 0,
  profileReadme: null,
  repos: [],
};

const perfilForte: GithubProfileData = {
  login: "forte",
  htmlUrl: "https://github.com/forte",
  name: "Dev Forte",
  bio: "Engenheira de software focada em backend.",
  company: "BoraNaTech",
  location: "São Paulo, BR",
  blog: "https://devforte.dev",
  email: "dev@forte.dev",
  twitterUsername: "devforte",
  publicRepos: 12,
  followers: 50,
  profileReadme: strongProfileReadme,
  repos: [
    { name: "api", description: "API REST de exemplo", primaryLanguage: "TypeScript", stars: 10, pushedAt: now, fork: false },
    { name: "web", description: "Frontend de exemplo", primaryLanguage: "TypeScript", stars: 5, pushedAt: now, fork: false },
    { name: "cli", description: "CLI de exemplo", primaryLanguage: "TypeScript", stars: 3, pushedAt: now, fork: false },
    { name: "forked", description: null, primaryLanguage: "Go", stars: 0, pushedAt: old, fork: true },
  ],
};

// Repositorio quase vazio: sem README e praticamente sem arquivo.
// Serve pra confirmar a suficiencia "baixa".
const repoVazio: GithubRepoData = {
  owner: "user",
  name: "vazio",
  fullName: "user/vazio",
  htmlUrl: "https://github.com/user/vazio",
  description: null,
  topics: [],
  defaultBranch: "main",
  primaryLanguage: null,
  languages: {},
  stars: 0,
  forks: 0,
  openIssues: 0,
  pushedAt: now,
  license: null,
  readme: null,
  files: {
    security: false,
    contributing: false,
    codeOfConduct: false,
    gitignore: false,
    ci: false,
    envCommitted: false,
  },
  rootEntries: ["LICENSE"],
  rootDirs: [],
};

// Perfil so com forks: nenhum repo autoral, suficiencia "baixa".
const perfilSoForks: GithubProfileData = {
  login: "forks",
  htmlUrl: "https://github.com/forks",
  name: "Dev Forks",
  bio: "Curioso por open source.",
  company: null,
  location: null,
  blog: null,
  email: null,
  twitterUsername: null,
  publicRepos: 4,
  followers: 0,
  profileReadme: null,
  repos: [
    { name: "fork-a", description: "Fork A", primaryLanguage: "JavaScript", stars: 0, pushedAt: now, fork: true },
    { name: "fork-b", description: "Fork B", primaryLanguage: "Python", stars: 0, pushedAt: now, fork: true },
  ],
};

describe("runRepoChecks / analyzeRepo", () => {
  it("repoFraco: status por check e nota determinística", () => {
    const checks = runRepoChecks(repoFraco);

    expect(statusOf(checks, "repo_readme_present")).toBe("pass");
    expect(statusOf(checks, "repo_readme_substance")).toBe("fail");
    expect(statusOf(checks, "repo_readme_usage")).toBe("warn");
    expect(statusOf(checks, "repo_description")).toBe("fail");
    expect(statusOf(checks, "repo_topics")).toBe("warn");
    expect(statusOf(checks, "repo_license")).toBe("fail");
    expect(statusOf(checks, "repo_gitignore")).toBe("pass");
    expect(statusOf(checks, "repo_no_secrets")).toBe("pass");
    expect(statusOf(checks, "repo_security")).toBe("warn");
    expect(statusOf(checks, "repo_contributing")).toBe("warn");
    expect(statusOf(checks, "repo_code_of_conduct")).toBe("warn");
    expect(statusOf(checks, "repo_ci")).toBe("warn");
    expect(statusOf(checks, "repo_structure")).toBe("pass");
    expect(statusOf(checks, "repo_recent_activity")).toBe("pass");

    // Aritmética da nota (pesos: essencial 10, importante 6, opcional 3):
    // essenciais: present 10 + substance 0 + description 0 + license 0 + no_secrets 10 = 20
    // importantes: usage 3 + topics 3 + gitignore 6 + ci 3 + recent_activity 6 = 21
    // opcionais: security 1.5 + contributing 1.5 + code_of_conduct 1.5 + structure 3 = 7.5
    // ganho = 48.5 ; possivel = 50 + 30 + 12 = 92
    // score = round(100 * 48.5 / 92) = round(52.717) = 53
    const result = analyzeRepo(repoFraco);
    expect(result.score).toBe(53);
    expect(result.band).toBe("evoluindo");
    expect(result.mode).toBe("repo");
  });

  it("repoForte: todos os checks pass, nota 100, faixa destaque", () => {
    const checks = runRepoChecks(repoForte);
    for (const check of checks) {
      expect(check.status).toBe("pass");
    }

    const result = analyzeRepo(repoForte);
    expect(result.score).toBe(100);
    expect(result.band).toBe("destaque");
    expect(result.mode).toBe("repo");
  });

  it("repoTudoSolto: sem pasta de código na raiz, repo_structure vira warn", () => {
    const checks = runRepoChecks(repoTudoSolto);
    expect(statusOf(checks, "repo_structure")).toBe("warn");

    // Mesmos status do repoFraco, exceto: description pass, topics pass,
    // license pass e structure warn (em vez de pass).
    // essenciais: present 10 + substance 0 + description 10 + license 10 + no_secrets 10 = 40
    // importantes: usage 3 + topics 6 + gitignore 6 + ci 3 + recent_activity 6 = 24
    // opcionais: security 1.5 + contributing 1.5 + code_of_conduct 1.5 + structure 1.5 = 6
    // ganho = 70 ; possivel = 50 + 30 + 12 = 92
    // score = round(100 * 70 / 92) = round(76.087) = 76
    const result = analyzeRepo(repoTudoSolto);
    expect(result.score).toBe(76);
    expect(result.band).toBe("bom");
  });
});

describe("runProfileChecks / analyzeProfile", () => {
  it("perfilFraco: status por check e nota determinística", () => {
    const checks = runProfileChecks(perfilFraco);

    expect(statusOf(checks, "profile_readme_present")).toBe("fail");
    expect(statusOf(checks, "profile_readme_substance")).toBe("warn");
    expect(statusOf(checks, "profile_bio")).toBe("fail");
    expect(statusOf(checks, "profile_repos_count")).toBe("fail");
    expect(statusOf(checks, "profile_links")).toBe("warn");
    expect(statusOf(checks, "profile_location_company")).toBe("warn");
    expect(statusOf(checks, "profile_repos_described")).toBe("na");
    expect(statusOf(checks, "profile_activity")).toBe("warn");

    // Aritmética da nota:
    // essenciais: present 0 + bio 0 + repos_count 0 = 0
    // importantes: substance 3 + links 3 + activity 3 = 9 (repos_described = na, fora da conta)
    // opcionais: location_company 1.5
    // ganho = 10.5 ; possivel = 30 + 18 + 3 = 51
    // score = round(100 * 10.5 / 51) = round(20.588) = 21
    const result = analyzeProfile(perfilFraco);
    expect(result.score).toBe(21);
    expect(result.band).toBe("comecando");
    expect(result.mode).toBe("perfil");
    expect(result.suficiencia).toBe("baixa");
  });

  it("perfilForte: todos os checks pass, nota 100, faixa destaque", () => {
    const checks = runProfileChecks(perfilForte);
    for (const check of checks) {
      expect(check.status).toBe("pass");
    }

    const result = analyzeProfile(perfilForte);
    expect(result.score).toBe(100);
    expect(result.band).toBe("destaque");
    expect(result.mode).toBe("perfil");
    expect(result.suficiencia).toBe("alta");
  });

  it("perfilSoForks: nenhum repo autoral, repos_count fail e suficiencia baixa", () => {
    const checks = runProfileChecks(perfilSoForks);
    expect(statusOf(checks, "profile_repos_count")).toBe("fail");
    expect(statusOf(checks, "profile_repos_described")).toBe("na");

    const result = analyzeProfile(perfilSoForks);
    expect(result.suficiencia).toBe("baixa");
  });
});

describe("suficiencia de dados (repo)", () => {
  it("repoFraco tem README, suficiencia alta", () => {
    expect(analyzeRepo(repoFraco).suficiencia).toBe("alta");
  });

  it("repoVazio sem README e quase sem arquivo, suficiencia baixa", () => {
    const result = analyzeRepo(repoVazio);
    expect(result.suficiencia).toBe("baixa");
    // A nota continua sendo calculada normalmente, independente da suficiencia.
    expect(typeof result.score).toBe("number");
  });
});

describe("determinismo", () => {
  it("analyzeRepo(repoFraco) produz resultado idêntico em duas rodadas", () => {
    const first = analyzeRepo(repoFraco);
    const second = analyzeRepo(repoFraco);
    expect(second).toEqual(first);
  });
});
