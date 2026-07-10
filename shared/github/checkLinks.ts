// Deep links DETERMINISTAS de "Resolver agora" por check do analisador de
// GitHub. Regra dura de honestidade: so URLs que existem por construcao
// (formatos oficiais do GitHub), nunca adivinhacao de arquivo/pagina:
//  - criar arquivo: github.com/<o>/<r>/new/main?filename=<nome> (formato
//    oficial de novo arquivo; main e o branch default do GitHub e o formato
//    prescrito pra este mapa);
//  - editar README: github.com/<o>/<r>/edit/main/README.md (so em checks que
//    PROVARAM que o README existe);
//  - blob do .env: so no check que provou que o arquivo esta na raiz;
//  - paginas fixas (actions/new, settings/profile, github.com/new, tab de
//    repositorios) sao sempre validas.
// Check sem link honesto devolve null e a UI mostra so o hint.

export interface CheckLinkTarget {
  kind: "perfil" | "repo";
  login: string;
  repo: string | null;
}

export function resolveCheckActionUrl(
  checkId: string,
  target: CheckLinkTarget,
): string | null {
  const { login } = target;
  const repoBase =
    target.kind === "repo" && target.repo
      ? `https://github.com/${login}/${target.repo}`
      : null;

  switch (checkId) {
    case "repo_readme_present":
      return repoBase ? `${repoBase}/new/main?filename=README.md` : null;
    case "repo_readme_substance":
    case "repo_readme_usage":
      return repoBase ? `${repoBase}/edit/main/README.md` : null;
    // Descricao e topics editam no gear About da pagina do repositorio.
    case "repo_description":
    case "repo_topics":
      return repoBase;
    case "repo_license":
      return repoBase ? `${repoBase}/new/main?filename=LICENSE` : null;
    case "repo_gitignore":
      return repoBase ? `${repoBase}/new/main?filename=.gitignore` : null;
    // O check provou que .env existe na raiz; o blob e a pagina de remocao.
    case "repo_no_secrets":
      return repoBase ? `${repoBase}/blob/main/.env` : null;
    case "repo_ci":
      return repoBase ? `${repoBase}/actions/new` : null;
    case "profile_readme_present":
    case "profile_repos_count":
      return "https://github.com/new";
    case "profile_readme_substance":
      return `https://github.com/${login}/${login}/edit/main/README.md`;
    case "profile_bio":
    case "profile_links":
      return "https://github.com/settings/profile";
    case "profile_repos_described":
      return `https://github.com/${login}?tab=repositories`;
    // repo_structure, repo_recent_activity, profile_activity e afins: sem
    // link honesto (nenhuma URL resolve o problema).
    default:
      return null;
  }
}
