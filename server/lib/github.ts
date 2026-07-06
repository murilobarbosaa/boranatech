import { env } from "./env";
import type {
  GithubDeepSignals,
  GithubProfileData,
  GithubRepoData,
} from "../../shared/github/schema";

/**
 * Camada de busca do analisador de GitHub.
 *
 * Dado um username (perfil) ou owner/repo (repositorio), busca os dados
 * publicos no GitHub e devolve exatamente os tipos de contrato de
 * shared/github/schema.ts. As checagens deterministicas (githubChecks.ts)
 * consomem esses tipos.
 *
 * Seguranca: a camada so monta URL para api.github.com e
 * raw.githubusercontent.com. owner, repo e login passam por validacao de
 * formato antes de virar parte de qualquer URL (anti-SSRF).
 */

const API_BASE = "https://api.github.com";
const RAW_BASE = "https://raw.githubusercontent.com";
const REQUEST_TIMEOUT_MS = 10_000;

// Formato permitido pelo GitHub.
// owner/login: 1 a 39 caracteres, letras, numeros e hifen, sem hifen no inicio nem no fim.
const OWNER_RE = /^[A-Za-z0-9](?:[A-Za-z0-9-]{0,37}[A-Za-z0-9])?$/;
// repo: 1 a 100 caracteres, letras, numeros, ponto, sublinhado e hifen.
const REPO_RE = /^[A-Za-z0-9._-]{1,100}$/;

// Erros normalizados. A rota traduz para HTTP no proximo passo.

export class GithubNotFoundError extends Error {
  constructor(message = "Recurso nao encontrado no GitHub.") {
    super(message);
    this.name = "GithubNotFoundError";
  }
}

export class GithubRateLimitError extends Error {
  constructor(message = "Limite de requisicoes do GitHub atingido.") {
    super(message);
    this.name = "GithubRateLimitError";
  }
}

export class GithubFetchError extends Error {
  status: number;
  constructor(status: number, message = "Falha ao consultar o GitHub.") {
    super(message);
    this.name = "GithubFetchError";
    this.status = status;
  }
}

// Parsers puros (exportados, testados sem rede)

export function parseRepoInput(
  input: string,
): { owner: string; repo: string } | null {
  if (typeof input !== "string") return null;
  const trimmed = input.trim();
  if (!trimmed) return null;

  let owner: string | undefined;
  let repo: string | undefined;

  if (/^https?:\/\//i.test(trimmed)) {
    let url: URL;
    try {
      url = new URL(trimmed);
    } catch {
      return null;
    }
    if (url.hostname.toLowerCase() !== "github.com") return null;
    const segments = url.pathname.split("/").filter(Boolean);
    if (segments.length < 2) return null;
    owner = segments[0];
    repo = segments[1];
  } else {
    // Atalho owner/repo. Nao pode trazer mais nada depois do repo.
    const segments = trimmed.split("/");
    if (segments.length !== 2) return null;
    owner = segments[0];
    repo = segments[1];
  }

  if (!owner || !repo) return null;
  repo = stripGitSuffix(repo);

  if (!isValidOwner(owner)) return null;
  if (!isValidRepo(repo)) return null;

  return { owner, repo };
}

export function parseProfileInput(input: string): { login: string } | null {
  if (typeof input !== "string") return null;
  const trimmed = input.trim();
  if (!trimmed) return null;

  let login: string | undefined;

  if (/^https?:\/\//i.test(trimmed)) {
    let url: URL;
    try {
      url = new URL(trimmed);
    } catch {
      return null;
    }
    if (url.hostname.toLowerCase() !== "github.com") return null;
    const segments = url.pathname.split("/").filter(Boolean);
    if (segments.length !== 1) return null;
    login = segments[0];
  } else {
    if (trimmed.includes("/")) return null;
    login = trimmed;
  }

  if (!login || !isValidOwner(login)) return null;
  return { login };
}

function stripGitSuffix(repo: string): string {
  return repo.toLowerCase().endsWith(".git") ? repo.slice(0, -4) : repo;
}

function isValidOwner(value: string): boolean {
  return OWNER_RE.test(value);
}

function isValidRepo(value: string): boolean {
  if (value === "." || value === "..") return false;
  return REPO_RE.test(value);
}

// Cliente HTTP interno (nao exportado)

function buildHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };
  if (env.githubToken) {
    headers.Authorization = `Bearer ${env.githubToken}`;
  }
  return headers;
}

// outerSignal (opcional) e o budget global da rota, encadeado via
// AbortSignal.any SEM remover o teto de 10s por chamada.
async function withTimeout<T>(
  run: (signal: AbortSignal) => Promise<T>,
  outerSignal?: AbortSignal,
): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  const signal = outerSignal
    ? AbortSignal.any([outerSignal, controller.signal])
    : controller.signal;
  try {
    return await run(signal);
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      throw new GithubFetchError(0, "Tempo de resposta do GitHub esgotado.");
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

function isRateLimited(response: Response): boolean {
  const remaining = response.headers.get("x-ratelimit-remaining");
  return response.status === 403 && remaining === "0";
}

/**
 * Faz um GET na API do GitHub.
 * - 200: devolve o JSON.
 * - 404: devolve null (chamador decide se e erro ou ausencia esperada).
 * - 403 com rate limit zerado: GithubRateLimitError.
 * - resto: GithubFetchError.
 */
async function apiGet<T>(
  path: string,
  outerSignal?: AbortSignal,
): Promise<T | null> {
  return withTimeout(async (signal) => {
    const response = await fetch(`${API_BASE}${path}`, {
      method: "GET",
      headers: buildHeaders(),
      signal,
    });

    if (response.status === 404) return null;
    if (isRateLimited(response)) throw new GithubRateLimitError();
    if (!response.ok) {
      throw new GithubFetchError(
        response.status,
        `GitHub respondeu ${response.status}.`,
      );
    }
    return (await response.json()) as T;
  }, outerSignal);
}

/**
 * Busca um arquivo cru. Fora da API, nao conta no rate limit dela.
 * 200 devolve texto, 404 devolve null.
 */
async function rawGet(
  owner: string,
  repo: string,
  branch: string,
  path: string,
): Promise<string | null> {
  return withTimeout(async (signal) => {
    const response = await fetch(
      `${RAW_BASE}/${owner}/${repo}/${branch}/${path}`,
      {
        method: "GET",
        signal,
      },
    );
    if (response.status === 404) return null;
    if (!response.ok) {
      throw new GithubFetchError(
        response.status,
        `Arquivo cru respondeu ${response.status}.`,
      );
    }
    return await response.text();
  });
}

function decodeBase64(content: string): string {
  // A API manda base64 com quebras de linha.
  return Buffer.from(content.replace(/\n/g, ""), "base64").toString("utf-8");
}

// Tipos parciais das respostas do GitHub que a camada consome

interface GithubApiRepo {
  description: string | null;
  topics?: string[];
  homepage?: string | null;
  default_branch: string;
  language: string | null;
  stargazers_count: number;
  forks_count: number;
  open_issues_count: number;
  pushed_at: string | null;
  license: { spdx_id?: string | null; name?: string | null } | null;
}

interface GithubApiContentEntry {
  name: string;
  type: string;
}

interface GithubApiReadme {
  content?: string;
  encoding?: string;
}

interface GithubApiUser {
  login: string;
  name: string | null;
  bio: string | null;
  company: string | null;
  location: string | null;
  blog: string | null;
  email: string | null;
  twitter_username: string | null;
  public_repos: number;
  followers: number;
  html_url: string;
}

interface GithubApiUserRepo {
  name: string;
  description: string | null;
  language: string | null;
  stargazers_count: number;
  pushed_at: string | null;
  fork: boolean;
}

// Busca de repositorio

const DOC_DIRS = ["", ".github", "docs"] as const;

function pickLicense(license: GithubApiRepo["license"]): string | null {
  if (!license) return null;
  if (license.spdx_id && license.spdx_id !== "NOASSERTION")
    return license.spdx_id;
  return license.name ?? null;
}

export async function fetchRepoData(
  owner: string,
  repo: string,
  signal?: AbortSignal,
): Promise<GithubRepoData> {
  if (!isValidOwner(owner) || !isValidRepo(repo)) {
    throw new GithubFetchError(0, "owner ou repo em formato invalido.");
  }

  const meta = await apiGet<GithubApiRepo>(`/repos/${owner}/${repo}`, signal);
  if (!meta) {
    throw new GithubNotFoundError(
      "Repositorio nao encontrado ou nao e publico.",
    );
  }

  const [languages, readme, rootContents] = await Promise.all([
    apiGet<Record<string, number>>(
      `/repos/${owner}/${repo}/languages`,
      signal,
    ),
    apiGet<GithubApiReadme>(`/repos/${owner}/${repo}/readme`, signal),
    apiGet<GithubApiContentEntry[]>(`/repos/${owner}/${repo}/contents`, signal),
  ]);

  const root = Array.isArray(rootContents) ? rootContents : [];
  const rootEntries = root.map((entry) => entry.name);
  const rootDirNames = root.filter((e) => e.type === "dir").map((e) => e.name);
  const rootFiles = new Set(
    root.filter((e) => e.type === "file").map((e) => e.name.toLowerCase()),
  );
  const rootDirs = new Set(rootDirNames.map((name) => name.toLowerCase()));

  // Doc files (SECURITY, CONTRIBUTING, CODE_OF_CONDUCT) podem viver em /, /.github ou /docs.
  // So consultamos pastas extras se elas existirem na raiz.
  const dirsToScan: string[] = [""];
  if (rootDirs.has(".github")) dirsToScan.push(".github");
  if (rootDirs.has("docs")) dirsToScan.push("docs");

  const extraDirFiles = await Promise.all(
    dirsToScan
      .filter((dir) => dir !== "")
      .map(async (dir) => {
        const listing = await apiGet<GithubApiContentEntry[]>(
          `/repos/${owner}/${repo}/contents/${dir}`,
          signal,
        );
        const names = Array.isArray(listing)
          ? listing
              .filter((e) => e.type === "file")
              .map((e) => e.name.toLowerCase())
          : [];
        return new Set(names);
      }),
  );

  const fileSets = [rootFiles, ...extraDirFiles];
  const hasDocFile = (target: string) =>
    fileSets.some((set) => set.has(target));

  // CI: existe .github/workflows com pelo menos um arquivo.
  let ci = false;
  if (rootDirs.has(".github")) {
    const workflows = await apiGet<GithubApiContentEntry[]>(
      `/repos/${owner}/${repo}/contents/.github/workflows`,
      signal,
    );
    ci = Array.isArray(workflows) && workflows.some((e) => e.type === "file");
  }

  const files = {
    security: hasDocFile("security.md"),
    contributing: hasDocFile("contributing.md"),
    codeOfConduct: hasDocFile("code_of_conduct.md"),
    gitignore: rootFiles.has(".gitignore"),
    ci,
    envCommitted: rootFiles.has(".env"),
  };

  const readmeText =
    readme && readme.content && readme.encoding === "base64"
      ? decodeBase64(readme.content)
      : null;

  return {
    owner,
    name: repo,
    fullName: `${owner}/${repo}`,
    htmlUrl: `https://github.com/${owner}/${repo}`,
    description: meta.description,
    topics: Array.isArray(meta.topics) ? meta.topics : [],
    defaultBranch: meta.default_branch,
    primaryLanguage: meta.language,
    languages: languages ?? {},
    stars: meta.stargazers_count,
    forks: meta.forks_count,
    openIssues: meta.open_issues_count,
    pushedAt: meta.pushed_at,
    license: pickLicense(meta.license),
    readme: readmeText,
    files,
    rootEntries,
    rootDirs: rootDirNames,
  };
}

// Leitura funda dos top repos proprios (perfil)

// Quantos repos proprios (nao-fork) inspecionar a fundo por analise de perfil.
const PROFILE_DEEP_REPOS = 6;

// Pastas que indicam testes na raiz.
const TEST_DIR_NAMES = new Set(["test", "tests", "__tests__"]);
// Arquivos na raiz que indicam deploy estatico.
const DEPLOY_FILE_NAMES = new Set(["vercel.json", "netlify.toml", "gh-pages"]);

interface ProfileRepoSignals {
  hasReadme: boolean;
  hasCI: boolean;
  hasTests: boolean;
  hasDeploy: boolean;
  topics: string[];
}

function detectReadme(entries: GithubApiContentEntry[]): boolean {
  return entries.some(
    (e) => e.type === "file" && e.name.toLowerCase().startsWith("readme"),
  );
}

function detectTests(entries: GithubApiContentEntry[]): boolean {
  return entries.some((e) => {
    const lower = e.name.toLowerCase();
    if (e.type === "dir") return TEST_DIR_NAMES.has(lower);
    return lower.startsWith("vitest.config") || lower.startsWith("jest.config");
  });
}

function detectDeployFiles(entries: GithubApiContentEntry[]): boolean {
  return entries.some((e) => DEPLOY_FILE_NAMES.has(e.name.toLowerCase()));
}

/**
 * Le os sinais-chave de um repo proprio, reusando os mesmos endpoints do
 * fetchRepoData (meta, /contents e .github/workflows pra CI). README e detectado
 * pelo nome na raiz pra evitar uma chamada extra por repo.
 */
async function fetchProfileRepoSignals(
  owner: string,
  repo: string,
  signal?: AbortSignal,
): Promise<ProfileRepoSignals> {
  const [meta, contents] = await Promise.all([
    apiGet<GithubApiRepo>(`/repos/${owner}/${repo}`, signal),
    apiGet<GithubApiContentEntry[]>(`/repos/${owner}/${repo}/contents`, signal),
  ]);

  const entries = Array.isArray(contents) ? contents : [];
  const rootDirs = new Set(
    entries.filter((e) => e.type === "dir").map((e) => e.name.toLowerCase()),
  );

  // CI: mesma logica do fetchRepoData (workflows com pelo menos um arquivo).
  let hasCI = false;
  if (rootDirs.has(".github")) {
    const workflows = await apiGet<GithubApiContentEntry[]>(
      `/repos/${owner}/${repo}/contents/.github/workflows`,
      signal,
    );
    hasCI =
      Array.isArray(workflows) && workflows.some((e) => e.type === "file");
  }

  const homepage = meta?.homepage ?? null;
  const hasDeploy =
    (typeof homepage === "string" && homepage.trim() !== "") ||
    detectDeployFiles(entries);

  return {
    hasReadme: detectReadme(entries),
    hasCI,
    hasTests: detectTests(entries),
    hasDeploy,
    topics: meta && Array.isArray(meta.topics) ? meta.topics : [],
  };
}

/**
 * Agrega os sinais dos top repos proprios. Faz as leituras em paralelo e
 * tolera falha por repo (allSettled): um repo que falha sai da conta, nao
 * derruba a analise. Devolve undefined quando nao ha repo proprio.
 */
async function aggregateDeepSignals(
  login: string,
  ownRepos: GithubApiUserRepo[],
  signal?: AbortSignal,
): Promise<GithubDeepSignals | undefined> {
  if (ownRepos.length === 0) return undefined;

  const settled = await Promise.allSettled(
    ownRepos.map((repo) => fetchProfileRepoSignals(login, repo.name, signal)),
  );
  const ok = settled
    .filter(
      (r): r is PromiseFulfilledResult<ProfileRepoSignals> =>
        r.status === "fulfilled",
    )
    .map((r) => r.value);

  const topics = new Set<string>();
  for (const signals of ok) {
    for (const topic of signals.topics) topics.add(topic);
  }

  return {
    reposAnalisados: ok.length,
    comReadme: ok.filter((s) => s.hasReadme).length,
    comCI: ok.filter((s) => s.hasCI).length,
    comTestes: ok.filter((s) => s.hasTests).length,
    comDeploy: ok.filter((s) => s.hasDeploy).length,
    topics: Array.from(topics),
  };
}

// Busca de perfil

export async function fetchProfileData(
  login: string,
  signal?: AbortSignal,
): Promise<GithubProfileData> {
  if (!isValidOwner(login)) {
    throw new GithubFetchError(0, "login em formato invalido.");
  }

  const user = await apiGet<GithubApiUser>(`/users/${login}`, signal);
  if (!user) {
    throw new GithubNotFoundError("Perfil nao encontrado.");
  }

  const [readme, repos] = await Promise.all([
    apiGet<GithubApiReadme>(`/repos/${login}/${login}/readme`, signal),
    apiGet<GithubApiUserRepo[]>(
      `/users/${login}/repos?per_page=100&sort=pushed&type=owner`,
      signal,
    ),
  ]);

  const profileReadme =
    readme && readme.content && readme.encoding === "base64"
      ? decodeBase64(readme.content)
      : null;

  const repoList = Array.isArray(repos) ? repos : [];

  // Leitura funda: top repos proprios (lista ja ordenada por push), sem forks.
  const topOwnRepos = repoList
    .filter((repo) => !repo.fork)
    .slice(0, PROFILE_DEEP_REPOS);
  const deepSignals = await aggregateDeepSignals(login, topOwnRepos, signal);

  return {
    login: user.login,
    htmlUrl: user.html_url,
    name: user.name,
    bio: user.bio,
    company: user.company,
    location: user.location,
    blog: user.blog ? user.blog : null,
    email: user.email,
    twitterUsername: user.twitter_username,
    publicRepos: user.public_repos,
    followers: user.followers,
    profileReadme,
    repos: repoList.map((repo) => ({
      name: repo.name,
      description: repo.description,
      primaryLanguage: repo.language,
      stars: repo.stargazers_count,
      pushedAt: repo.pushed_at,
      fork: repo.fork,
    })),
    deepSignals,
  };
}
