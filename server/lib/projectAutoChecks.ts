import type { ProjetoVerificacaoAuto } from "../../shared/projects/v2/types";
import { assertPublicHttpsTarget } from "./fetchExternalPage";
import {
  fetchRepoData,
  fetchValidationEvidence,
  parseRepoInput,
} from "./github";
import { fetchWithTimeout } from "./http";

// Checagens automaticas da entrega (lote 04).
//
// Duas metades separadas de proposito: `coletarEvidencia` faz I/O (GitHub e um
// GET no link publicado) e `evaluateChecks` e pura. So a segunda tem teste
// unitario; a primeira tem teste de integracao que pula sem token.
//
// REGRA DE OURO: evidencia ausente vira `erro`, NUNCA `falhou`. "Nao consegui
// olhar" e "olhei e esta errado" sao coisas diferentes, e conflacionar as duas
// e a classe de defeito que esta base cataloga (o `contarLinhas` devolvendo
// -1). `falhou` so sai quando a evidencia existe e nega a checagem.

export type StatusCheck = "ok" | "falhou" | "erro";

export type ResultadoCheck = {
  check: ProjetoVerificacaoAuto;
  status: StatusCheck;
  mensagem: string;
};

export type EvidenciaDeploy = { status: number | null; erro?: string };

export type EvidenciaRepo = {
  publico: boolean;
  readme: string | null;
  rootEntries: string[];
  treePaths: string[] | null;
  commitsPelo5: number | null;
};

export type Evidencia = {
  deploy: EvidenciaDeploy | null;
  artifact: EvidenciaDeploy | null;
  repo: EvidenciaRepo | null;
  deployUrl: string | null;
};

export type AlvoChecagem = {
  checks: readonly ProjetoVerificacaoAuto[];
  deployUrl: string | null;
  repoUrl: string | null;
  artifactUrl: string | null;
};

const TIMEOUT_PAGINA_MS = 8_000;
const CORPO_MAX_BYTES = 64 * 1024;
const README_MINIMO = 80;

// ---------------------------------------------------------------------------
// Coleta de evidencia (I/O)
// ---------------------------------------------------------------------------

/** GET numa pagina publica, com o mesmo guard anti-SSRF do fetchExternalPage. */
async function alcancarPagina(url: string): Promise<EvidenciaDeploy> {
  let alvo: URL;
  try {
    alvo = await assertPublicHttpsTarget(url);
  } catch (err) {
    return {
      status: null,
      erro: err instanceof Error ? err.message : "URL bloqueada.",
    };
  }
  try {
    const resposta = await fetchWithTimeout(
      alvo.toString(),
      {
        method: "GET",
        headers: {
          accept: "text/html, text/plain;q=0.9",
          "user-agent": "BoraNaTechBot/1.0 (+https://boranatech.com.br)",
        },
      },
      { service: "project-submission", timeoutMs: TIMEOUT_PAGINA_MS },
    );
    // O corpo nao interessa; cancelar evita segurar a conexao por um HTML
    // grande so para descobrir o status.
    await resposta.body?.cancel().catch(() => undefined);
    return { status: resposta.status };
  } catch (err) {
    return {
      status: null,
      erro: err instanceof Error ? err.message : "Falha ao acessar a página.",
    };
  }
}

async function contarCommitsAte5(
  owner: string,
  repo: string,
  signal?: AbortSignal,
): Promise<number | null> {
  try {
    const resposta = await fetchWithTimeout(
      `https://api.github.com/repos/${owner}/${repo}/commits?per_page=5`,
      {
        method: "GET",
        headers: {
          Accept: "application/vnd.github+json",
          "X-GitHub-Api-Version": "2022-11-28",
          "user-agent": "BoraNaTechBot/1.0 (+https://boranatech.com.br)",
        },
        signal,
      },
      { service: "github", timeoutMs: TIMEOUT_PAGINA_MS },
    );
    if (!resposta.ok) return null;
    const corpo: unknown = await resposta.json();
    return Array.isArray(corpo) ? corpo.length : null;
  } catch {
    return null;
  }
}

export async function coletarEvidencia(
  alvo: AlvoChecagem,
  signal?: AbortSignal,
): Promise<Evidencia> {
  const evidencia: Evidencia = {
    deploy: null,
    artifact: null,
    repo: null,
    deployUrl: alvo.deployUrl,
  };

  if (alvo.deployUrl) evidencia.deploy = await alcancarPagina(alvo.deployUrl);
  if (alvo.artifactUrl)
    evidencia.artifact = await alcancarPagina(alvo.artifactUrl);

  if (alvo.repoUrl) {
    const parsed = parseRepoInput(alvo.repoUrl);
    if (!parsed) {
      evidencia.repo = {
        publico: false,
        readme: null,
        rootEntries: [],
        treePaths: null,
        commitsPelo5: null,
      };
    } else {
      try {
        const dados = await fetchRepoData(parsed.owner, parsed.repo, signal);
        const [provas, commits] = await Promise.all([
          fetchValidationEvidence(
            parsed.owner,
            parsed.repo,
            dados.defaultBranch,
            signal,
          ),
          contarCommitsAte5(parsed.owner, parsed.repo, signal),
        ]);
        evidencia.repo = {
          publico: true,
          readme: dados.readme,
          rootEntries: dados.rootEntries,
          treePaths: provas.treePaths,
          commitsPelo5: commits,
        };
      } catch {
        // Repositorio inexistente, privado, ou GitHub fora do ar: nao da para
        // distinguir os tres com o que o cliente devolve, entao `publico:
        // false` cobre os dois primeiros e o terceiro vira `erro` nas
        // checagens que dependem de conteudo.
        evidencia.repo = {
          publico: false,
          readme: null,
          rootEntries: [],
          treePaths: null,
          commitsPelo5: null,
        };
      }
    }
  }

  return evidencia;
}

// ---------------------------------------------------------------------------
// Avaliador (puro)
// ---------------------------------------------------------------------------

function normalizarUrl(url: string): string {
  return url
    .trim()
    .replace(/^https?:\/\//i, "")
    .replace(/\/+$/, "")
    .toLowerCase();
}

function ok(check: ProjetoVerificacaoAuto, mensagem: string): ResultadoCheck {
  return { check, status: "ok", mensagem };
}
function falhou(
  check: ProjetoVerificacaoAuto,
  mensagem: string,
): ResultadoCheck {
  return { check, status: "falhou", mensagem };
}
function erro(check: ProjetoVerificacaoAuto, mensagem: string): ResultadoCheck {
  return { check, status: "erro", mensagem };
}

// TODO(Ana): mensagens das checagens automaticas, no positivo e no negativo
const SEM_EVIDENCIA = "Não conseguimos conferir isto agora.";

function avaliarUma(
  check: ProjetoVerificacaoAuto,
  e: Evidencia,
): ResultadoCheck {
  if (check === "deploy_responde" || check === "artefato_responde") {
    const alvo = check === "deploy_responde" ? e.deploy : e.artifact;
    if (!alvo) return erro(check, SEM_EVIDENCIA);
    if (alvo.status === null) return erro(check, SEM_EVIDENCIA);
    return alvo.status >= 200 && alvo.status < 400
      ? ok(check, "O link respondeu.")
      : falhou(check, `O link não respondeu (status ${alvo.status}).`);
  }

  const repo = e.repo;
  if (!repo) return erro(check, SEM_EVIDENCIA);

  if (check === "repo_publico") {
    return repo.publico
      ? ok(check, "O repositório é público.")
      : falhou(check, "O repositório não é público (ou não existe).");
  }

  // Daqui para baixo tudo depende de ler o repositorio: sem isso e erro, nao
  // reprovacao.
  if (!repo.publico) return erro(check, SEM_EVIDENCIA);

  if (check === "readme_existe") {
    if (repo.readme === null) return falhou(check, "Não achamos um README.");
    return repo.readme.trim().length > README_MINIMO
      ? ok(check, "O README tem conteúdo.")
      : falhou(check, "O README está muito curto.");
  }

  if (check === "readme_tem_link_deploy") {
    if (repo.readme === null) return falhou(check, "Não achamos um README.");
    if (!e.deployUrl) return erro(check, SEM_EVIDENCIA);
    return normalizarUrl(repo.readme).includes(normalizarUrl(e.deployUrl))
      ? ok(check, "O README traz o link do site.")
      : falhou(check, "O README não traz o link do site.");
  }

  if (check === "min_commits_5") {
    if (repo.commitsPelo5 === null) return erro(check, SEM_EVIDENCIA);
    return repo.commitsPelo5 >= 5
      ? ok(check, "Tem 5 commits ou mais.")
      : falhou(check, `Tem ${repo.commitsPelo5} commit(s), o mínimo é 5.`);
  }

  if (check.startsWith("arquivo:")) {
    const caminho = check.slice("arquivo:".length);
    const naRaiz = !caminho.includes("/");
    if (naRaiz) {
      if (repo.rootEntries.length === 0) return erro(check, SEM_EVIDENCIA);
      return repo.rootEntries.includes(caminho)
        ? ok(check, `Achamos ${caminho}.`)
        : falhou(check, `Não achamos ${caminho} na raiz.`);
    }
    if (repo.treePaths === null) return erro(check, SEM_EVIDENCIA);
    return repo.treePaths.includes(caminho)
      ? ok(check, `Achamos ${caminho}.`)
      : falhou(check, `Não achamos ${caminho}.`);
  }

  if (check.startsWith("pasta:")) {
    const nome = check.slice("pasta:".length);
    if (repo.treePaths === null) return erro(check, SEM_EVIDENCIA);
    // Com a barra: `cypress.config.js` NAO satisfaz `pasta:cypress`.
    return repo.treePaths.some((p) => p.startsWith(`${nome}/`))
      ? ok(check, `Achamos a pasta ${nome}.`)
      : falhou(check, `Não achamos a pasta ${nome}.`);
  }

  return erro(check, SEM_EVIDENCIA);
}

export function evaluateChecks(
  checks: readonly ProjetoVerificacaoAuto[],
  evidencia: Evidencia,
): ResultadoCheck[] {
  return checks.map((check) => avaliarUma(check, evidencia));
}

export async function rodarChecagens(
  alvo: AlvoChecagem,
  signal?: AbortSignal,
): Promise<ResultadoCheck[]> {
  const evidencia = await coletarEvidencia(alvo, signal);
  return evaluateChecks(alvo.checks, evidencia);
}
