// GENERATED FILE. Do not edit. Run pnpm gen:projetos-v2
//
// Derivado dos arquivos de shared/projects/v2/. Para adicionar um projeto v2:
// criar shared/projects/v2/<id>.ts e rodar o gerador.
import type { ProjetoV2Detalhe } from "./types";

export const PROJETOS_V2_IDS = [
  "analise-dados-publicos",
  "api-rest-tarefas",
  "automacao-login-cypress",
  "dashboard-power-bi",
  "landing-page-pessoal",
  "lista-tarefas-fullstack",
  "persona-journey-mapa",
  "pipeline-etl-python",
  "todo-list",
] as const;

export const loaders: Record<
  string,
  () => Promise<{ default: ProjetoV2Detalhe }>
> = {
  "analise-dados-publicos": () => import("./analise-dados-publicos"),
  "api-rest-tarefas": () => import("./api-rest-tarefas"),
  "automacao-login-cypress": () => import("./automacao-login-cypress"),
  "dashboard-power-bi": () => import("./dashboard-power-bi"),
  "landing-page-pessoal": () => import("./landing-page-pessoal"),
  "lista-tarefas-fullstack": () => import("./lista-tarefas-fullstack"),
  "persona-journey-mapa": () => import("./persona-journey-mapa"),
  "pipeline-etl-python": () => import("./pipeline-etl-python"),
  "todo-list": () => import("./todo-list"),
};
