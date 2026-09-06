import type { ProjetoVerificacaoAuto } from "../../shared/projects/v2/types";

// Checagens automaticas da entrega (lote 04).
//
// Esta e a casca: os tipos e o contrato. A coleta de evidencia e o avaliador
// entram no commit seguinte (Passo C). Ate la toda checagem devolve `erro`,
// nunca `ok` nem `falhou`: dizer "passou" sem ter olhado seria exatamente a
// classe de defeito que este repositorio cataloga.

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

export async function rodarChecagens(
  alvo: AlvoChecagem,
  _signal?: AbortSignal,
): Promise<ResultadoCheck[]> {
  return alvo.checks.map((check) => ({
    check,
    status: "erro" as const,
    // TODO(Ana): mensagem de checagem ainda nao implementada
    mensagem: "Ainda nao conseguimos conferir isto.",
  }));
}
