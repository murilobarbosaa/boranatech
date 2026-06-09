import {
  CHECK_CATALOG,
  TIER_WEIGHTS,
  type DeterministicResult,
  type GithubCheckResult,
  type GithubProfileData,
  type GithubRepoData,
  type ScoreBand,
  type Suficiencia,
} from "../../shared/github/schema";

/**
 * Checagens determinísticas do analisador de GitHub.
 *
 * Tudo aqui é função pura: sem fetch, sem env, sem IO. A entrada são os
 * tipos de contrato (GithubRepoData, GithubProfileData) que o fetch real
 * vai produzir no próximo passo. A nota sai só dos status das checagens.
 */

const CATALOG_BY_ID = new Map(CHECK_CATALOG.map((entry) => [entry.id, entry]));

function make(id: string, status: GithubCheckResult["status"], detail: string): GithubCheckResult {
  const entry = CATALOG_BY_ID.get(id);
  if (!entry) {
    throw new Error(`Check desconhecido no catálogo: ${id}`);
  }
  return { id, label: entry.label, category: entry.category, tier: entry.tier, status, detail };
}

function hasText(value: string | null | undefined): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isWithin12Months(iso: string | null): boolean {
  if (!iso) return false;
  const when = new Date(iso);
  if (Number.isNaN(when.getTime())) return false;
  const cutoff = new Date();
  cutoff.setMonth(cutoff.getMonth() - 12);
  return when.getTime() >= cutoff.getTime();
}

function isoDate(iso: string | null): string {
  if (!iso) return "data desconhecida";
  const slice = iso.slice(0, 10);
  return slice.length === 10 ? slice : iso;
}

const USAGE_RE = /install|usage|uso|getting started|como rodar|npm|pnpm|yarn|docker|run/i;
const HEADING_RE = /^#/m;
// Pastas meta nao contam como organizacao de codigo. Tudo em minusculo.
const META_DIRS = new Set([
  "docs",
  "doc",
  ".github",
  ".vscode",
  ".idea",
  "node_modules",
  "dist",
  "build",
  "out",
  "target",
  "vendor",
  "coverage",
  ".husky",
  ".git",
]);

export function runRepoChecks(data: GithubRepoData): GithubCheckResult[] {
  const checks: GithubCheckResult[] = [];

  // README presente
  const readmePresent = hasText(data.readme);
  checks.push(
    make(
      "repo_readme_present",
      readmePresent ? "pass" : "fail",
      readmePresent ? "README presente no repositório." : "Repositório sem README.",
    ),
  );

  // README com conteúdo real (>= 200 caracteres e pelo menos um heading)
  const readmeLen = data.readme ? data.readme.length : 0;
  const readmeHasHeading = !!data.readme && HEADING_RE.test(data.readme);
  const substancePass = !!data.readme && readmeLen >= 200 && readmeHasHeading;
  let substanceDetail: string;
  if (substancePass) {
    substanceDetail = `README com ${readmeLen} caracteres e pelo menos um heading markdown.`;
  } else if (!data.readme) {
    substanceDetail = "README vazio, sem conteúdo.";
  } else if (readmeLen < 200) {
    substanceDetail = `README tem ${readmeLen} caracteres, praticamente vazio.`;
  } else {
    substanceDetail = `README com ${readmeLen} caracteres, mas sem nenhum heading markdown.`;
  }
  checks.push(make("repo_readme_substance", substancePass ? "pass" : "fail", substanceDetail));

  // README explica como rodar
  const usagePass = !!data.readme && USAGE_RE.test(data.readme);
  let usageDetail: string;
  if (usagePass) {
    usageDetail = "README menciona como instalar ou rodar o projeto.";
  } else if (!data.readme) {
    usageDetail = "Sem README para avaliar instruções de uso.";
  } else {
    usageDetail = "README não explica como instalar ou rodar.";
  }
  checks.push(make("repo_readme_usage", usagePass ? "pass" : "warn", usageDetail));

  // Descrição
  const descPass = hasText(data.description);
  checks.push(
    make(
      "repo_description",
      descPass ? "pass" : "fail",
      descPass ? "Descrição do repositório preenchida." : "Repositório sem descrição.",
    ),
  );

  // Topics
  const topicsCount = data.topics.length;
  checks.push(
    make(
      "repo_topics",
      topicsCount >= 1 ? "pass" : "warn",
      topicsCount >= 1 ? `${topicsCount} topics definidos.` : "Nenhum topic definido.",
    ),
  );

  // Licença
  const licensePass = hasText(data.license);
  checks.push(
    make(
      "repo_license",
      licensePass ? "pass" : "fail",
      licensePass ? `Licença ${data.license} definida.` : "Sem LICENSE no repositório.",
    ),
  );

  // .gitignore
  checks.push(
    make(
      "repo_gitignore",
      data.files.gitignore ? "pass" : "warn",
      data.files.gitignore ? ".gitignore presente." : "Sem .gitignore no repositório.",
    ),
  );

  // Sem .env versionado
  checks.push(
    make(
      "repo_no_secrets",
      data.files.envCommitted ? "fail" : "pass",
      data.files.envCommitted
        ? "Arquivo .env versionado no repositório, risco de vazar segredos."
        : "Nenhum arquivo .env versionado.",
    ),
  );

  // SECURITY
  checks.push(
    make(
      "repo_security",
      data.files.security ? "pass" : "warn",
      data.files.security ? "Arquivo SECURITY presente." : "Sem arquivo SECURITY.",
    ),
  );

  // CONTRIBUTING
  checks.push(
    make(
      "repo_contributing",
      data.files.contributing ? "pass" : "warn",
      data.files.contributing ? "Arquivo CONTRIBUTING presente." : "Sem arquivo CONTRIBUTING.",
    ),
  );

  // Código de conduta
  checks.push(
    make(
      "repo_code_of_conduct",
      data.files.codeOfConduct ? "pass" : "warn",
      data.files.codeOfConduct ? "Código de conduta presente." : "Sem código de conduta.",
    ),
  );

  // CI
  checks.push(
    make(
      "repo_ci",
      data.files.ci ? "pass" : "warn",
      data.files.ci ? "CI configurado no repositório." : "Sem CI configurado.",
    ),
  );

  // Estrutura de pastas de código.
  // Passa se a raiz tem pelo menos uma subpasta de verdade, ignorando pastas meta.
  const codeDirs = data.rootDirs.filter((dir) => !META_DIRS.has(dir.toLowerCase()));
  checks.push(
    make(
      "repo_structure",
      codeDirs.length > 0 ? "pass" : "warn",
      codeDirs.length > 0
        ? `Código organizado em pastas: ${codeDirs.join(", ")}.`
        : "Tudo na raiz, sem pastas de código.",
    ),
  );

  // Atividade recente
  const recent = isWithin12Months(data.pushedAt);
  let activityDetail: string;
  if (recent) {
    activityDetail = `Último push em ${isoDate(data.pushedAt)}.`;
  } else if (!data.pushedAt) {
    activityDetail = "Sem data de último push.";
  } else {
    activityDetail = `Último push em ${isoDate(data.pushedAt)}, há mais de 12 meses.`;
  }
  checks.push(make("repo_recent_activity", recent ? "pass" : "warn", activityDetail));

  return checks;
}

export function runProfileChecks(data: GithubProfileData): GithubCheckResult[] {
  const checks: GithubCheckResult[] = [];

  // README de perfil presente
  const readmePresent = hasText(data.profileReadme);
  checks.push(
    make(
      "profile_readme_present",
      readmePresent ? "pass" : "fail",
      readmePresent ? "README de perfil presente." : "Sem README de perfil.",
    ),
  );

  // README de perfil com conteúdo (>= 200 caracteres)
  const readmeLen = data.profileReadme ? data.profileReadme.length : 0;
  const substancePass = !!data.profileReadme && readmeLen >= 200;
  let substanceDetail: string;
  if (substancePass) {
    substanceDetail = `README de perfil com ${readmeLen} caracteres.`;
  } else if (!data.profileReadme) {
    substanceDetail = "Sem README de perfil para avaliar.";
  } else {
    substanceDetail = `README de perfil com ${readmeLen} caracteres, muito curto.`;
  }
  checks.push(make("profile_readme_substance", substancePass ? "pass" : "warn", substanceDetail));

  // Bio
  const bioPass = hasText(data.bio);
  checks.push(
    make(
      "profile_bio",
      bioPass ? "pass" : "fail",
      bioPass ? "Bio preenchida." : "Perfil sem bio.",
    ),
  );

  // Quantidade de repositórios autorais (fork nao conta como projeto proprio)
  const authoredRepos = data.repos.filter((repo) => !repo.fork);
  const authoredCount = authoredRepos.length;
  let reposStatus: GithubCheckResult["status"];
  let reposDetail: string;
  if (authoredCount >= 3) {
    reposStatus = "pass";
    reposDetail = `${authoredCount} repositórios próprios (sem contar forks).`;
  } else if (authoredCount >= 1) {
    reposStatus = "warn";
    reposDetail = `Apenas ${authoredCount} repositório(s) próprio(s), sem contar forks.`;
  } else {
    reposStatus = "fail";
    reposDetail = "Nenhum repositório próprio (só forks ou nenhum repo público).";
  }
  checks.push(make("profile_repos_count", reposStatus, reposDetail));

  // Links de contato
  const hasLinks = hasText(data.blog) || hasText(data.email) || hasText(data.twitterUsername);
  checks.push(
    make(
      "profile_links",
      hasLinks ? "pass" : "warn",
      hasLinks
        ? "Tem ao menos um link de contato (site, email ou Twitter/X)."
        : "Sem links de contato no perfil.",
    ),
  );

  // Localização ou empresa
  const hasLocationCompany = hasText(data.location) || hasText(data.company);
  checks.push(
    make(
      "profile_location_company",
      hasLocationCompany ? "pass" : "warn",
      hasLocationCompany ? "Localização ou empresa preenchida." : "Sem localização nem empresa.",
    ),
  );

  // Repositórios próprios com descrição
  const nonFork = data.repos.filter((repo) => !repo.fork);
  if (nonFork.length === 0) {
    checks.push(
      make(
        "profile_repos_described",
        "na",
        "Nenhum repositório próprio (não-fork) para avaliar descrições.",
      ),
    );
  } else {
    const described = nonFork.filter((repo) => hasText(repo.description)).length;
    const describedPass = described * 2 >= nonFork.length;
    checks.push(
      make(
        "profile_repos_described",
        describedPass ? "pass" : "warn",
        describedPass
          ? `${described} de ${nonFork.length} repositórios próprios com descrição.`
          : `Só ${described} de ${nonFork.length} repositórios próprios têm descrição.`,
      ),
    );
  }

  // Atividade recente
  const active = data.repos.some((repo) => isWithin12Months(repo.pushedAt));
  checks.push(
    make(
      "profile_activity",
      active ? "pass" : "warn",
      active
        ? "Tem repositório com push nos últimos 12 meses."
        : "Nenhum repositório com push nos últimos 12 meses.",
    ),
  );

  return checks;
}

function bandFromScore(score: number): ScoreBand {
  if (score <= 40) return "comecando";
  if (score <= 70) return "evoluindo";
  if (score <= 90) return "bom";
  return "destaque";
}

export function scoreChecks(checks: GithubCheckResult[]): { score: number; band: ScoreBand } {
  let possivel = 0;
  let ganho = 0;

  for (const check of checks) {
    if (check.status === "na") continue;
    const weight = TIER_WEIGHTS[check.tier];
    possivel += weight;
    if (check.status === "pass") {
      ganho += weight;
    } else if (check.status === "warn") {
      ganho += weight / 2;
    }
  }

  const score = possivel === 0 ? 0 : Math.round((100 * ganho) / possivel);
  return { score, band: bandFromScore(score) };
}

/**
 * Suficiencia de dados do repo. Ortogonal a nota. Baixa quando o repo
 * esta quase vazio (sem README e praticamente sem arquivo).
 */
function repoSufficiency(data: GithubRepoData): { suficiencia: Suficiencia; razao: string } {
  const hasReadme = hasText(data.readme);
  const fileCount = data.rootEntries.length;

  if (!hasReadme && fileCount <= 2) {
    return {
      suficiencia: "baixa",
      razao: "O repositório está quase vazio, então essa leitura é parcial.",
    };
  }
  if (!hasReadme || fileCount <= 3) {
    return {
      suficiencia: "media",
      razao: "O repositório tem poucos arquivos pra avaliar, então a leitura é parcial.",
    };
  }
  return { suficiencia: "alta", razao: "" };
}

/**
 * Suficiencia de dados do perfil. Ortogonal a nota. Baixa quando nao ha
 * repo autoral (tudo fork ou zero repo publico) ou o sinal e muito magro.
 */
function profileSufficiency(data: GithubProfileData): { suficiencia: Suficiencia; razao: string } {
  const authoredCount = data.repos.filter((repo) => !repo.fork).length;
  const hasReadme = hasText(data.profileReadme);

  if (data.publicRepos === 0) {
    return {
      suficiencia: "baixa",
      razao: "Você não tem repositórios públicos, então essa leitura é parcial.",
    };
  }
  if (authoredCount === 0) {
    return {
      suficiencia: "baixa",
      razao: "Todos os seus repositórios públicos são forks, então essa leitura do que é seu é parcial.",
    };
  }
  if (authoredCount < 2 && !hasReadme) {
    return {
      suficiencia: "baixa",
      razao: "Vi poucos repositórios próprios e sem README de perfil, então essa leitura é parcial.",
    };
  }
  if (authoredCount < 3) {
    return {
      suficiencia: "media",
      razao: "Vi poucos repositórios próprios, então a leitura fica mais completa com mais projetos seus.",
    };
  }
  return { suficiencia: "alta", razao: "" };
}

export function analyzeRepo(data: GithubRepoData): DeterministicResult {
  const checks = runRepoChecks(data);
  const { score, band } = scoreChecks(checks);
  const { suficiencia, razao } = repoSufficiency(data);
  return { mode: "repo", score, band, checks, suficiencia, suficienciaRazao: razao };
}

export function analyzeProfile(data: GithubProfileData): DeterministicResult {
  const checks = runProfileChecks(data);
  const { score, band } = scoreChecks(checks);
  const { suficiencia, razao } = profileSufficiency(data);
  return { mode: "perfil", score, band, checks, suficiencia, suficienciaRazao: razao };
}
