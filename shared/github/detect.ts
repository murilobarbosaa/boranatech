// Deteccao pura e deterministica do alvo de analise de GitHub a partir de um
// input unico (URL, @usuario, usuario ou owner/repo). FONTE UNICA de parse:
// o server (rota e wrappers de server/lib/github.ts) e o client (badge de
// deteccao do formulario) usam a mesma funcao.
//
// Regras:
//  - github.com/<user> (com ou sem protocolo/www), @<user> ou username simples
//    viram perfil.
//  - github.com/<user>/<repo> (ignorando query, fragment, barra final,
//    segmentos extras como /tree/main e sufixo .git) e o atalho owner/repo
//    viram repositorio.
//  - Qualquer outra coisa vira invalido com o motivo.

// Formato permitido pelo GitHub.
// owner/login: 1 a 39 caracteres, letras, numeros e hifen, sem hifen no inicio nem no fim.
const OWNER_RE = /^[A-Za-z0-9](?:[A-Za-z0-9-]{0,37}[A-Za-z0-9])?$/;
// repo: 1 a 100 caracteres, letras, numeros, ponto, sublinhado e hifen.
const REPO_RE = /^[A-Za-z0-9._-]{1,100}$/;

export function isValidOwner(value: string): boolean {
  return OWNER_RE.test(value);
}

export function isValidRepo(value: string): boolean {
  if (value === "." || value === "..") return false;
  return REPO_RE.test(value);
}

export function stripGitSuffix(repo: string): string {
  return repo.toLowerCase().endsWith(".git") ? repo.slice(0, -4) : repo;
}

export type GithubTargetDetection =
  | { kind: "perfil"; login: string }
  | { kind: "repo"; owner: string; repo: string }
  | { kind: "invalid"; reason: string };

// TODO(Ana): revisar os motivos de input invalido mostrados no formulario.
const REASONS = {
  empty: "Cole a URL do seu perfil ou repositorio do GitHub.",
  host: "So aceitamos enderecos do github.com.",
  owner: "Esse nome de usuario nao parece valido no GitHub.",
  repo: "Esse nome de repositorio nao parece valido no GitHub.",
  format:
    "Nao reconheci o formato. Use github.com/usuario ou github.com/usuario/projeto.",
} as const;

export function detectGithubTarget(input: string): GithubTargetDetection {
  if (typeof input !== "string") {
    return { kind: "invalid", reason: REASONS.format };
  }
  const trimmed = input.trim();
  if (!trimmed) return { kind: "invalid", reason: REASONS.empty };

  const hasProtocol = /^https?:\/\//i.test(trimmed);
  const isUrlLike = hasProtocol || /^(www\.)?github\.com\//i.test(trimmed);

  if (isUrlLike) {
    let url: URL;
    try {
      url = new URL(hasProtocol ? trimmed : `https://${trimmed}`);
    } catch {
      return { kind: "invalid", reason: REASONS.format };
    }
    const host = url.hostname.toLowerCase();
    if (host !== "github.com" && host !== "www.github.com") {
      return { kind: "invalid", reason: REASONS.host };
    }
    const segments = url.pathname.split("/").filter(Boolean);
    if (segments.length === 0) {
      return { kind: "invalid", reason: REASONS.format };
    }
    const owner = segments[0];
    if (!isValidOwner(owner)) return { kind: "invalid", reason: REASONS.owner };
    if (segments.length === 1) return { kind: "perfil", login: owner };
    const repo = stripGitSuffix(segments[1]);
    if (!isValidRepo(repo)) return { kind: "invalid", reason: REASONS.repo };
    return { kind: "repo", owner, repo };
  }

  // @usuario ou username simples.
  const bare = trimmed.startsWith("@") ? trimmed.slice(1) : trimmed;
  if (!bare.includes("/")) {
    if (!isValidOwner(bare)) return { kind: "invalid", reason: REASONS.owner };
    return { kind: "perfil", login: bare };
  }

  // Atalho owner/repo. Nao pode trazer mais nada depois do repo.
  const segments = bare.split("/");
  if (segments.length === 2 && segments[0] && segments[1]) {
    const owner = segments[0];
    const repo = stripGitSuffix(segments[1]);
    if (!isValidOwner(owner)) return { kind: "invalid", reason: REASONS.owner };
    if (!isValidRepo(repo)) return { kind: "invalid", reason: REASONS.repo };
    return { kind: "repo", owner, repo };
  }
  return { kind: "invalid", reason: REASONS.format };
}
